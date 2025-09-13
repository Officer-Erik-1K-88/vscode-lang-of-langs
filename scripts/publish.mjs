#!/usr/bin/env node

import { run, multiRun, sayError } from './functions.ts';

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

    await run("vsce", pubArgs);
    

    console.log("✅ New Release Published to Marketplace.");
}

main().catch((err) => {
    sayError("✗ publish failed:", err);
    process.exit(1);
});