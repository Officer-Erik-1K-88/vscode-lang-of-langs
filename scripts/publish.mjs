#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { run, multiRun, sayError } from './functions.mjs';

async function main() {
    // Ensure clean working tree
    try {
        await multiRun(
            {bin: 'git', args: ['diff', '--quiet']},
            {bin: 'git', args: ['diff', '--cached', '--quiet']}
        );
    } catch (error) {
        throw Error('Working tree not clean. Commit or stash changes first.', {cause: error});
    }

    const args = [...{*[Symbol.iterator]() {
        for (let i = 2; i < process.argv; i++) {yield process.argv[i];}
    }}];

    const pubArgs = ["publish"];
    if (args.length !== 0) {
        pubArgs.push(args[0]);
    }
    pubArgs.push("-m", "chore(release): %s");

    const marker = path.join(os.tmpdir(), `postversion-${crypto.randomUUID()}.flag`);

    await run("vsce", pubArgs, { shell: true , env: { ...process.env, POSTVERSION_MARKER: marker }});

    // 2) Decide whether to run postversion yourself
let ran = false;
try { await fs.access(marker); ran = true; } catch {}

    if (!ran) {
        console.log(`→ Running GitHub Release script…`);
        await run("node", ["scripts/after-version.mjs"], { shell: true, env: { ...process.env, POSTVERSION_MARKER: marker }, });
    } else {
        console.log(`→ GitHub Release script already ran (via vsce); skipping.`);
    }

    console.log("✅ New Release Published to Marketplace.");
}

main().catch((err) => {
    sayError("✗ publish failed:", err);
    process.exit(1);
}).finally(async () => {
    // do nothing;
    try { await fs.unlink(marker); } catch {}
});