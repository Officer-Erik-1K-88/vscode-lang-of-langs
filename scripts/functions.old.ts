import { SerializationType, spawn, StdioOptions, StdioPipe, StdioPipeNamed } from "node:child_process";
import { promises as fs, PathLike } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
export const DIST = path.join(ROOT, "dist");

type OptionsType = {
    signal?: AbortSignal | undefined;
    uid?: number | undefined;
    gid?: number | undefined;
    cwd?: string | URL | undefined;
    env?: NodeJS.ProcessEnv | undefined;
    windowsHide?: boolean | undefined;
    timeout?: number | undefined;
    serialization?: SerializationType | undefined;
    killSignal?: NodeJS.Signals | number | undefined;
    argv0?: string | undefined;
    stdio?: StdioOptions | StdioPipeNamed | StdioPipe[] | undefined;
    shell?: boolean | string | undefined;
    windowsVerbatimArguments?: boolean | undefined;
    detached?: boolean | undefined;
};

export function run(bin: string, args: string[] = [], opts: OptionsType = {}) {
    if (!Object.hasOwn(opts, 'stdio')) {
        opts.stdio = "inherit";
    }
    if (!Object.hasOwn(opts, 'cwd')) {
        opts.cwd = ROOT;
    }
    console.log(`Running '${bin}':\n\tArguments: ${args.join(' ; ')}\n\tOptions: ${Object.entries(opts).map((val) => val[0]+': '+val[1]).join('; ')};`);
    return new Promise<any>((resolve, reject) => {
        const p = spawn(bin, args, opts);
        p.on("close", (code) => (code === 0 ? resolve(null) : reject(new Error(`${bin} ${args.join(" ")} exited with ${code}`))));
        p.on("error", reject);
    }).then(
        (val) => {
            console.log(`Successful running of '${bin}'`);
            return val;
        },
        (err) => {
            console.log(`Failed running of '${bin}'`);
            return err;
        }
    );
}

export function multiRun(...toRun: {bin: string, args?: string[], opts?: OptionsType}[]) {
    return new Promise<any[]>((resolve, reject) => {
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
                var error: Error | undefined;
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

export async function fileExists(fp: PathLike) {
    try { await fs.access(fp); return true; } catch { return false; }
}

export function sayError(message: string, err: any, options: {
    simple?: boolean;
    sayCause?: boolean;
    sayStack?: boolean;
    sayBase?: boolean;
    sayName?: boolean;
    print?: boolean;
    level?: number;
    internalError?: boolean;
} = {}): any[] {
    options.simple = options.simple || false;
    options.sayCause = options.sayCause || true;
    options.sayStack = options.sayStack || false;
    options.sayBase = options.sayBase || true;
    options.sayName = options.sayName || false;
    options.print = options.print || true;
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