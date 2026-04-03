#!/usr/bin/env node

/**
 * Release helper script for hiero-sdk-js monorepo.
 * Provides subcommands for version computation, file mutations, and git/GitHub queries.
 *
 * Usage: node scripts/release-helpers.mjs <subcommand> [args]
 *
 * Subcommands:
 *   get-previous-tag
 *   list-prs-since <tag>
 *   detect-subpackage-changes <tag>
 *   compute-next-version <current-version> <release-type>
 *   bump-versions <sdk-version> [--proto <version>] [--cryptography <version>]
 *   insert-changelog <version> <changelog-entry-file>
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function exec(cmd, opts = {}) {
    return execSync(cmd, { encoding: "utf-8", cwd: ROOT, ...opts }).trim();
}

// ── get-previous-tag ──────────────────────────────────────────────────────────

function getPreviousTag() {
    exec("git fetch --tags origin");
    const tags = exec("git tag --sort=-v:refname").split("\n").filter(Boolean);
    const semverTag = tags.find((t) =>
        /^v\d+\.\d+\.\d+(-beta\.\d+)?$/.test(t),
    );
    if (!semverTag) {
        console.error("No semver tag found");
        process.exit(1);
    }
    console.log(semverTag);
}

// ── list-prs-since ────────────────────────────────────────────────────────────

function listPrsSince(tag) {
    if (!tag) {
        console.error("Usage: list-prs-since <tag>");
        process.exit(1);
    }

    // Get the date of the tag
    const tagDate = exec(`git log -1 --format=%aI ${tag}`);

    // Use gh CLI to list merged PRs since that date
    const json = exec(
        `gh pr list --state merged --search "merged:>=${tagDate.split("T")[0]}" ` +
            `--json number,title,body,files,url,labels --limit 200`,
    );
    console.log(json);
}

// ── detect-subpackage-changes ─────────────────────────────────────────────────

function detectSubpackageChanges(tag) {
    if (!tag) {
        console.error("Usage: detect-subpackage-changes <tag>");
        process.exit(1);
    }

    const changedFiles = exec(`git diff --name-only ${tag}..HEAD`).split("\n");

    const result = {
        proto: changedFiles.some((f) => f.startsWith("packages/proto/src/")),
        cryptography: changedFiles.some((f) =>
            f.startsWith("packages/cryptography/src/"),
        ),
    };

    console.log(JSON.stringify(result, null, 2));
}

// ── compute-next-version ──────────────────────────────────────────────────────

function computeNextVersion(currentVersion, releaseType) {
    if (!currentVersion || !releaseType) {
        console.error("Usage: compute-next-version <current-version> <stable|beta>");
        process.exit(1);
    }

    if (releaseType !== "stable" && releaseType !== "beta") {
        console.error('release-type must be "stable" or "beta"');
        process.exit(1);
    }

    // Parse version: major.minor.patch[-beta.N]
    const betaMatch = currentVersion.match(
        /^(\d+)\.(\d+)\.(\d+)-beta\.(\d+)$/,
    );
    const stableMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!betaMatch && !stableMatch) {
        console.error(`Invalid version: ${currentVersion}`);
        process.exit(1);
    }

    const isBeta = !!betaMatch;
    const match = betaMatch || stableMatch;
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const patch = parseInt(match[3], 10);
    const betaNum = isBeta ? parseInt(match[4], 10) : 0;

    let nextVersion;

    if (releaseType === "stable") {
        if (isBeta) {
            // beta → stable: drop the beta suffix (e.g., 2.83.0-beta.1 → 2.83.0)
            nextVersion = `${major}.${minor}.${patch}`;
        } else {
            // stable → stable: bump minor (e.g., 2.82.0 → 2.83.0)
            nextVersion = `${major}.${minor + 1}.0`;
        }
    } else {
        // beta
        if (isBeta) {
            // beta → beta: increment beta number (e.g., 2.83.0-beta.1 → 2.83.0-beta.2)
            nextVersion = `${major}.${minor}.${patch}-beta.${betaNum + 1}`;
        } else {
            // stable → beta: bump minor + beta.1 (e.g., 2.82.0 → 2.83.0-beta.1)
            nextVersion = `${major}.${minor + 1}.0-beta.1`;
        }
    }

    console.log(nextVersion);
}

// ── bump-versions ─────────────────────────────────────────────────────────────

function bumpVersions(args) {
    if (args.length < 1) {
        console.error(
            "Usage: bump-versions <sdk-version> [--proto <version>] [--cryptography <version>]",
        );
        process.exit(1);
    }

    const sdkVersion = args[0];
    let protoVersion = null;
    let cryptographyVersion = null;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === "--proto" && args[i + 1]) {
            protoVersion = args[++i];
        } else if (args[i] === "--cryptography" && args[i + 1]) {
            cryptographyVersion = args[++i];
        }
    }

    // Bump root package.json
    bumpPackageJson(resolve(ROOT, "package.json"), sdkVersion);
    console.log(`SDK version bumped to ${sdkVersion}`);

    if (protoVersion) {
        bumpPackageJson(
            resolve(ROOT, "packages/proto/package.json"),
            protoVersion,
        );
        console.log(`Proto version bumped to ${protoVersion}`);
    }

    if (cryptographyVersion) {
        bumpPackageJson(
            resolve(ROOT, "packages/cryptography/package.json"),
            cryptographyVersion,
        );
        console.log(`Cryptography version bumped to ${cryptographyVersion}`);
    }
}

function bumpPackageJson(filePath, version) {
    const content = readFileSync(filePath, "utf-8");
    const pkg = JSON.parse(content);
    pkg.version = version;
    // Preserve original formatting (detect indent)
    const indent = content.match(/^(\s+)"/m)?.[1] || "    ";
    writeFileSync(filePath, JSON.stringify(pkg, null, indent) + "\n");
}

// ── insert-changelog ──────────────────────────────────────────────────────────

function insertChangelog(version, entryFile) {
    if (!version || !entryFile) {
        console.error("Usage: insert-changelog <version> <changelog-entry-file>");
        process.exit(1);
    }

    const changelogPath = resolve(ROOT, "CHANGELOG.md");
    const changelog = readFileSync(changelogPath, "utf-8");
    const entry = readFileSync(resolve(ROOT, entryFile), "utf-8");

    const lines = changelog.split("\n");

    // Find the first version heading after the header block (skip first 6 lines: title + blank + description lines)
    let insertIndex = -1;
    for (let i = 6; i < lines.length; i++) {
        if (/^#\s+v?\d+/.test(lines[i])) {
            insertIndex = i;
            break;
        }
    }

    if (insertIndex === -1) {
        // No existing version entry found, append after header
        insertIndex = lines.length;
    }

    // Build the entry with normalized heading
    const entryLines = entry.split("\n");

    // Insert a blank line before if needed
    const newLines = [
        ...lines.slice(0, insertIndex),
        ...entryLines,
        "",
        ...lines.slice(insertIndex),
    ];

    writeFileSync(changelogPath, newLines.join("\n"));
    console.log(`Changelog entry for v${version} inserted`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const [subcommand, ...args] = process.argv.slice(2);

switch (subcommand) {
    case "get-previous-tag":
        getPreviousTag();
        break;
    case "list-prs-since":
        listPrsSince(args[0]);
        break;
    case "detect-subpackage-changes":
        detectSubpackageChanges(args[0]);
        break;
    case "compute-next-version":
        computeNextVersion(args[0], args[1]);
        break;
    case "bump-versions":
        bumpVersions(args);
        break;
    case "insert-changelog":
        insertChangelog(args[0], args[1]);
        break;
    default:
        console.error(
            `Unknown subcommand: ${subcommand}\n\n` +
                "Available subcommands:\n" +
                "  get-previous-tag\n" +
                "  list-prs-since <tag>\n" +
                "  detect-subpackage-changes <tag>\n" +
                "  compute-next-version <current-version> <release-type>\n" +
                "  bump-versions <sdk-version> [--proto <version>] [--cryptography <version>]\n" +
                "  insert-changelog <version> <changelog-entry-file>",
        );
        process.exit(1);
}
