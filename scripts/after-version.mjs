#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { ROOT, DIST, run, fileExists, sayError } from "./functions";

async function main() {
    // --- sanity: inside a git repo -------------------------------------------
    await run("git", ["rev-parse", "--is-inside-work-tree"]).catch(() => {
        throw new Error("Not a git repo (git rev-parse failed).");
    });

    // --- read version & safe name from package.json ---------------------------
    const pkg = JSON.parse(await fs.readFile(path.join(ROOT, "package.json"), "utf8"));
    const version = pkg.version;
    const safeName = String(pkg.name || "extension").replace("@", "").replaceAll("/", "-").replaceAll(' ', '_');
    const tag = `v${version}`;
    const vsix = path.join(DIST, `${safeName}-V${version}.vsix`);

    console.log(`ℹ️ Version: ${version}`);
    console.log(`ℹ️ Tag:     ${tag}`);

    // --- push version commit & tag (created by npm version via vsce publish) ---
    await run("git", ["push", "origin", "HEAD"]);
    await run("git", ["push", "origin", tag]);

    // --- package VSIX for this version ---------------------------------------
    if (!(await fileExists(DIST))) {
        await fs.mkdir(DIST, { recursive: true });
    }

    await run("vsce", ["package", "-o", vsix]);
    console.log(`✔︎ packaged: ${path.relative(ROOT, vsix)}`);

    // --- create or update GitHub release -------------------------------------
    let releaseExists = true;
    try {
        await run("gh", ["release", "view", tag], { stdio: "ignore" });
    } catch {
        releaseExists = false;
    }

    if (releaseExists) {
        console.log(`→ Release exists; uploading asset (with --clobber)…`);
        await run("gh", ["release", "upload", tag, vsix, "--clobber"]);
    } else {
        console.log(`→ Creating release ${tag}…`);
        await run("gh", ["release", "create", tag, vsix, "--title", tag, "--generate-notes"]);
    }

    console.log(`✅ Done: pushed ${tag}, created/updated GitHub Release, attached VSIX.`);
}

main().catch((err) => {
    sayError("✗ after-version failed:", err.message || err, {simple: true});
    process.exit(1);
});
