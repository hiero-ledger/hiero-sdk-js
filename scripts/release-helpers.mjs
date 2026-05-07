#!/usr/bin/env node
/**
 * Release helper subcommands used by the /release and /release-post-merge skills.
 *
 *   get-previous-tag                                  → prints the most recent vX.Y.Z[-beta.N] tag
 *   list-prs-since <tag>                              → JSON array of PRs merged into main since <tag>
 *   detect-subpackage-changes <tag>                   → JSON {"proto":bool,"cryptography":bool} based on source changes
 *   compute-next-version <current> <stable|beta>      → next version per repo conventions
 *   bump-versions <sdk> [--proto <v>] [--cryptography <v>]
 *                                                     → writes versions to package.json files (2-space indent)
 *   insert-changelog <version> <entry-file>           → inserts <entry-file> body below the Keep-a-Changelog header
 *   list-matching-beta-tags <stable-version>          → prints v<stable>-beta.<N> tags ascending by N (newline-separated)
 *
 * Output is always machine-readable on stdout (text or JSON depending on the command).
 * Errors go to stderr with a non-zero exit code.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

function sh(cmd, args, opts = {}) {
    return execFileSync(cmd, args, {
        cwd: REPO_ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        ...opts,
    });
}

function die(msg) {
    process.stderr.write(`release-helpers: ${msg}\n`);
    process.exit(1);
}

// -------------------- get-previous-tag --------------------

function getPreviousTag() {
    // Most recent tag matching vX.Y.Z[-beta.N] sorted by creation date.
    const out = sh("git", [
        "for-each-ref",
        "--sort=-creatordate",
        "--format=%(refname:short)",
        "refs/tags",
    ]);
    const tag = out
        .split("\n")
        .map((l) => l.trim())
        .find((l) => /^v\d+\.\d+\.\d+(-beta\.\d+)?$/.test(l));
    if (!tag) die("no release-style tag found in this repo");
    return tag;
}

// -------------------- list-prs-since --------------------

function listPrsSince(tag) {
    // Squash-merge PRs leave "(#NNNN)" in the commit subject. Collect those numbers.
    const log = sh("git", ["log", `${tag}..HEAD`, "--pretty=%s", "--first-parent", "main"], {
        // --first-parent on main keeps merge/squash commits and skips PR-internal commits.
    });
    const prNumbers = [
        ...new Set(
            log
                .split("\n")
                .map((line) => {
                    const m = line.match(/\(#(\d+)\)\s*$/);
                    return m ? Number(m[1]) : null;
                })
                .filter((n) => n != null),
        ),
    ];

    const prs = prNumbers.map((n) => {
        const json = sh("gh", [
            "pr",
            "view",
            String(n),
            "--json",
            "number,title,body,url,labels,files",
        ]);
        const pr = JSON.parse(json);
        return {
            number: pr.number,
            title: pr.title,
            body: pr.body,
            url: pr.url,
            labels: (pr.labels || []).map((l) => l.name),
            files: (pr.files || []).map((f) => f.path),
        };
    });

    process.stdout.write(JSON.stringify(prs, null, 2) + "\n");
}

// -------------------- detect-subpackage-changes --------------------

function detectSubpackageChanges(tag) {
    // A sub-package needs a release if any of its source files (not just package.json/lockfiles)
    // changed since <tag>.
    const diff = sh("git", ["diff", "--name-only", `${tag}..HEAD`]);
    const files = diff.split("\n").filter(Boolean);

    const isSourceChange = (file, pkgDir) => {
        if (!file.startsWith(`${pkgDir}/`)) return false;
        // Ignore changelog, lockfile, and version-only bumps.
        const ignore = [
            `${pkgDir}/package.json`,
            `${pkgDir}/CHANGELOG.md`,
            `${pkgDir}/pnpm-lock.yaml`,
        ];
        if (ignore.includes(file)) return false;
        return true;
    };

    const result = {
        proto: files.some((f) => isSourceChange(f, "packages/proto")),
        cryptography: files.some((f) => isSourceChange(f, "packages/cryptography")),
    };
    process.stdout.write(JSON.stringify(result) + "\n");
}

// -------------------- compute-next-version --------------------

function parseVersion(v) {
    const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/);
    if (!m) die(`unrecognized version: ${v}`);
    return {
        major: Number(m[1]),
        minor: Number(m[2]),
        patch: Number(m[3]),
        beta: m[4] != null ? Number(m[4]) : null,
    };
}

function computeNextVersion(current, type) {
    const v = parseVersion(current);
    if (type === "beta") {
        if (v.beta == null) {
            // stable → next minor beta.1
            return `${v.major}.${v.minor + 1}.0-beta.1`;
        }
        // beta.N → beta.(N+1) on same X.Y.Z
        return `${v.major}.${v.minor}.${v.patch}-beta.${v.beta + 1}`;
    }
    if (type === "stable") {
        if (v.beta == null) {
            // stable → next minor stable
            return `${v.major}.${v.minor + 1}.0`;
        }
        // beta.N → drop suffix to release X.Y.Z stable
        return `${v.major}.${v.minor}.${v.patch}`;
    }
    die(`unknown release type: ${type} (expected "stable" or "beta")`);
}

// -------------------- bump-versions --------------------

function writeVersion(pkgPath, newVersion) {
    const raw = readFileSync(pkgPath, "utf8");
    const updated = raw.replace(
        /("version"\s*:\s*")[^"]+(")/,
        (_, pre, post) => `${pre}${newVersion}${post}`,
    );
    if (updated === raw) die(`failed to update version in ${pkgPath}`);
    writeFileSync(pkgPath, updated);
}

function bumpVersions(args) {
    const sdk = args[0];
    if (!sdk || sdk.startsWith("--")) die("bump-versions requires <sdk-version> as first arg");
    let proto = null;
    let crypto = null;
    for (let i = 1; i < args.length; i++) {
        if (args[i] === "--proto") proto = args[++i];
        else if (args[i] === "--cryptography") crypto = args[++i];
        else die(`unknown flag: ${args[i]}`);
    }

    writeVersion(join(REPO_ROOT, "package.json"), sdk);
    if (proto) writeVersion(join(REPO_ROOT, "packages/proto/package.json"), proto);
    if (crypto) writeVersion(join(REPO_ROOT, "packages/cryptography/package.json"), crypto);

    const summary = { sdk, proto, cryptography: crypto };
    process.stdout.write(JSON.stringify(summary) + "\n");
}

// -------------------- insert-changelog --------------------

function insertChangelog(version, entryFile) {
    const changelogPath = join(REPO_ROOT, "CHANGELOG.md");
    const existing = readFileSync(changelogPath, "utf8");
    const entry = readFileSync(entryFile, "utf8").trimEnd() + "\n\n";

    // Insert after the Keep-a-Changelog header block (everything up to the first "# v" heading).
    const firstVersionMatch = existing.match(/\n# v/);
    if (!firstVersionMatch) {
        // No prior version entries — append after header block.
        writeFileSync(changelogPath, existing.trimEnd() + "\n\n" + entry);
    } else {
        const idx = firstVersionMatch.index + 1; // position of '#'
        const head = existing.slice(0, idx);
        const tail = existing.slice(idx);
        writeFileSync(changelogPath, head + entry + tail);
    }
    process.stdout.write(`inserted v${version} entry into CHANGELOG.md\n`);
}

// -------------------- list-matching-beta-tags --------------------

function listMatchingBetaTags(stableVersion) {
    if (!/^\d+\.\d+\.\d+$/.test(stableVersion)) {
        die(`list-matching-beta-tags requires a stable X.Y.Z version, got: ${stableVersion}`);
    }
    const out = sh("git", [
        "tag",
        "--list",
        `v${stableVersion}-beta.*`,
    ]);
    const tags = out
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((t) => new RegExp(`^v${stableVersion.replace(/\./g, "\\.")}-beta\\.\\d+$`).test(t))
        .sort((a, b) => {
            const an = Number(a.match(/-beta\.(\d+)$/)[1]);
            const bn = Number(b.match(/-beta\.(\d+)$/)[1]);
            return an - bn;
        });
    process.stdout.write(tags.join("\n") + (tags.length ? "\n" : ""));
}

// -------------------- entry --------------------

const [, , subcommand, ...rest] = process.argv;

switch (subcommand) {
    case "get-previous-tag":
        process.stdout.write(getPreviousTag() + "\n");
        break;
    case "list-prs-since":
        if (!rest[0]) die("list-prs-since requires <tag>");
        listPrsSince(rest[0]);
        break;
    case "detect-subpackage-changes":
        if (!rest[0]) die("detect-subpackage-changes requires <tag>");
        detectSubpackageChanges(rest[0]);
        break;
    case "compute-next-version":
        if (rest.length < 2) die("compute-next-version requires <current> <stable|beta>");
        process.stdout.write(computeNextVersion(rest[0], rest[1]) + "\n");
        break;
    case "bump-versions":
        bumpVersions(rest);
        break;
    case "insert-changelog":
        if (rest.length < 2) die("insert-changelog requires <version> <entry-file>");
        insertChangelog(rest[0], rest[1]);
        break;
    case "list-matching-beta-tags":
        if (!rest[0]) die("list-matching-beta-tags requires <stable-version>");
        listMatchingBetaTags(rest[0]);
        break;
    default:
        die(
            `unknown subcommand: ${subcommand || "(none)"}\n` +
                "  expected: get-previous-tag | list-prs-since | detect-subpackage-changes | " +
                "compute-next-version | bump-versions | insert-changelog | list-matching-beta-tags",
        );
}
