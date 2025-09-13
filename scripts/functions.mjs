import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url); // Old: const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
export const ROOT = path.resolve(__dirname, "..");
export const DIST = path.join(ROOT, "dist");

/** @typedef {{
 *  signal?: AbortSignal,
 *  uid?: number, gid?: number,
 *  cwd?: string|URL,
 *  env?: NodeJS.ProcessEnv,
 *  windowsHide?: boolean,
 *  timeout?: number,
 *  killSignal?: NodeJS.Signals|number,
 *  argv0?: string,
 *  stdio?: import("node:child_process").StdioOptions
 *          | import("node:child_process").StdioPipeNamed
 *          | import("node:child_process").StdioPipe[],
 *  shell?: boolean|string,
 *  windowsVerbatimArguments?: boolean,
 *  detached?: boolean
 * }} OptionsType */

/**
 * @param {string} bin
 * @param {string[]} [args]
 * @param {OptionsType} [opts]
 */
export function run(bin, args = [], opts = {}) {
    opts.stdio = opts.stdio || "inherit";
    opts.cwd = opts.cwd || ROOT;
    opts.shell = opts.shell || true;
    console.log(`Running '${bin}':\n\tArguments: ${args.join(' ; ')}\n\tOptions: ${Object.entries(opts).map((val) => val[0]+': '+val[1]).join('; ')};`);
    return new Promise((resolve, reject) => {
        const onResolve = (val) => {
            resolve(val);
            console.log(`Successful running of '${bin}'`);
            return val;
        };
        const onReject = (err) => {
            reject(err);
            console.log(`Failed running of '${bin}'`);
            return err;
        };
        const p = spawn(bin, args, opts);
        p.on("close", (code) => (code === 0 ? onResolve(null) : onReject(new Error(`${bin} ${args.join(" ")} exited with ${code}`))));
        p.on("error", onReject);
    });
}

/**
 * @param {...{bin: string, args?: string[], opts?: OptionsType}} toRun
 */
export function multiRun(...toRun) {
    return new Promise((resolve, reject) => {
        if (toRun.length <= 0) {
            reject(new Error('Cannot run, nothing provided.'));
            return;
        }
        const promises = [];
        for (let i=0; i<toRun.length; i++) {
            let runner = toRun[i];
            promises.push(run(runner.bin, runner.args, runner.opts));
        }
        Promise.all(promises).then(
            (val) => {
                var error;
                for (let v of val) {
                    if (v instanceof Error) {
                        if (error === undefined) {
                            error = v;
                        } else {
                            if (error instanceof AggregateError) {
                                error = new AggregateError([...error.errors, v], error.message, {
                                    cause: error.cause,
                                });
                            } else {
                                error = new AggregateError([error, v], "Multiple Errors Found");
                            }
                        }
                    }
                }
                if (error !== undefined) {
                    reject(error);
                    return error;
                }
                resolve(val);
                return val;
            },
            (err) => {
                const error = err instanceof Error? err : new Error(String(err).toString(), {cause: err});
                reject(error);
                return error;
            }
        );
    });
}

/**
 * @param {import("node:fs").PathLike} fp
 */
export async function fileExists(fp) {
    try { await fs.access(fp); return true; } catch { return false; }
}

/**
 * @param {string} message
 * @param {*} err
 * @param {{
 *  simple?: boolean,
 *  sayCause?: boolean,
 *  sayStack?: boolean,
 *  sayBase?: boolean,
 *  sayName?: boolean,
 *  print?: boolean,
 *  level?: number,
 *  internalError?: boolean
 * }} [options]
 * @returns {any[]}
 */
export function sayError(message, err, options = {}) {
    options.simple = options.simple || false;
    options.sayCause = options.sayCause !== undefined ? options.sayCause : true;
    options.sayStack = options.sayStack || false;
    options.sayBase = options.sayBase !== undefined ? options.sayBase : true;
    options.sayName = options.sayName || false;
    options.print = options.print !== undefined ? options.print : true;
    options.level = options.level || 0;
    options.internalError = options.internalError || false;
    try {
        const indentation = '\t'.repeat(options.level);
        const data = [];
        let allowBase = true;
        if (err instanceof Error) {
            data.push(indentation + err.message);
            if (options.sayName) {
                data.push(`\n${indentation}\tName:${err.name}`);
            }
            if (options.sayStack && !options.simple) {
                if (err.stack !== undefined) {
                    data.push(`\n${indentation}\tStack:\n${indentation}\t\t${err.stack}`);
                }
            }
            if (options.sayCause) {
                if (err.cause) {
                    data.push(...sayError(`\n${indentation}\tCause:`, err.cause, {
                        simple: options.simple,
                        sayBase: options.sayBase,
                        sayCause: options.sayCause,
                        sayStack: options.sayStack,
                        sayName: options.sayName,
                        print: false,
                        level: options.level+1,
                        internalError: options.internalError,
                    }));
                }
            }
            if (!options.simple) {
                data.push(`\n${indentation}\tBase:\n\t\t`);
            } else {
                allowBase = false;
            }
        }
        if (allowBase) {
            if (options.sayBase) {
                if (options.internalError) {
                    data.push('Last Call Data:\n');
                    if (Array.isArray(err)) {
                        for (let val of err) {
                            let str = String(val);
                            let nSlash = 0;
                            while (str.startsWith('\n')) {
                                nSlash++;
                                str = str.replace('\n', '');
                            }
                            data.push(`${'\n'.repeat(nSlash)}\t${str}`);
                        }
                    }
                } else {
                    data.push(indentation + err);
                }
            } else {
                data.push('Not Available');
            }
        }
        if (options.print) {
            if (message.length === 0) {
                throw Error('Message must not be empty.', {cause:data});
            }
            console.error(`${message}\n`, ...data);
        }
        if (message.length !== 0) {
            data.unshift(message);
        }
        return data;
    } catch (error) {
        return sayError("Caught Error in 'sayError' Function:", error, {
            sayStack: true,
            sayName: true,
            internalError: true,
        });
    }
}