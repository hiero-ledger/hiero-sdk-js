#!/usr/bin/env node
/**
 * Checks the size of the npm packages this repository publishes, before they
 * reach the registry.
 *
 *   node scripts/package-size/check-package-sizes.mjs [--budgets <file>] [--root <dir>] [--offline]
 *
 * For every entry in budgets.json the script runs `npm pack --dry-run --json`
 * in the package directory, so the build output (lib/, dist/, generated proto
 * sources) must exist. It fails when the tarball would exceed the file count
 * or unpacked size budget, or when it contains a forbidden path. It also
 * compares the tarball with the latest version on npm and warns when the
 * package grew by more than the configured percentage; that comparison is
 * informational and never fails the run, because the baseline lives outside
 * the repository.
 *
 * budgets.json is an array of:
 *   dir               package directory, relative to the repository root
 *   maxFiles          hard limit on the number of files in the tarball
 *   maxUnpackedMB     hard limit on the unpacked size, in MB
 *   forbiddenPaths    optional path prefixes that must not appear in the tarball
 *   maxGrowthPercent  optional warning threshold against the latest npm release (default 50)
 *
 * Why this exists: @hiero-ledger/proto 2.27.0 through 2.31.0 shipped the whole
 * hiero-consensus-node git submodule (110 MB, about 8,000 Java files) because
 * the release job started checking out submodules while the package's files
 * field published all of src/. Nothing in CI looked at the tarball, so it went
 * unnoticed for six months.
 *
 * Exit code 1 on any violation. In GitHub Actions the result table is also
 * written to the step summary.
 */

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MB = 1024 * 1024;
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

/**
 * @param {string} name
 * @returns {string | undefined}
 */
function argValue(name) {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args[index + 1];
}

const budgetsPath = argValue("--budgets") ?? join(here, "budgets.json");
const repoRoot = resolve(argValue("--root") ?? join(here, "..", ".."));
const offline = args.includes("--offline");

/**
 * @typedef {object} Budget
 * @property {string} dir
 * @property {number} maxFiles
 * @property {number} maxUnpackedMB
 * @property {string[]} [forbiddenPaths]
 * @property {number} [maxGrowthPercent]
 */

/**
 * @typedef {object} PackResult
 * @property {string} name
 * @property {string} version
 * @property {{ path: string, size: number }[]} files
 * @property {number} entryCount
 * @property {number} unpackedSize
 */

/**
 * Runs `npm pack --dry-run --json` in a package directory and returns the
 * single result npm prints for it.
 *
 * @param {string} dir
 * @returns {PackResult}
 */
function dryRunPack(dir) {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const stdout = execFileSync(
        npm,
        ["pack", "--dry-run", "--json", "--ignore-scripts"],
        {
            cwd: dir,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "inherit"],
            maxBuffer: 64 * MB,
        },
    );
    const [result] = JSON.parse(stdout);
    return result;
}

/**
 * Looks up the latest published version of a package on npm.
 *
 * @param {string} name
 * @returns {Promise<{ version: string, unpackedSize: number | null, fileCount: number | null } | null>}
 */
async function latestOnNpm(name) {
    if (offline) {
        return null;
    }

    try {
        // The /latest endpoint returns only that version's manifest, a few
        // KB, instead of the whole packument that grows with every release.
        const response = await fetch(
            `https://registry.npmjs.org/${name}/latest`,
            { signal: AbortSignal.timeout(15000) },
        );
        if (!response.ok) {
            return null;
        }
        const manifest = await response.json();
        if (!manifest.version || !manifest.dist) {
            return null;
        }
        return {
            version: manifest.version,
            unpackedSize: manifest.dist.unpackedSize ?? null,
            fileCount: manifest.dist.fileCount ?? null,
        };
    } catch {
        return null;
    }
}

/**
 * @param {{ path: string, size: number }[]} files
 * @param {number} depth
 * @param {number} count
 * @returns {[string, number][]}
 */
function largestDirectories(files, depth = 2, count = 5) {
    /** @type {Map<string, number>} */
    const totals = new Map();
    for (const file of files) {
        const key = file.path.split("/").slice(0, depth).join("/");
        totals.set(key, (totals.get(key) ?? 0) + file.size);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, count);
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatMB(bytes) {
    return `${(bytes / MB).toFixed(1)} MB`;
}

/** @type {Budget[]} */
const budgets = JSON.parse(readFileSync(budgetsPath, "utf8"));
const rows = [];
let failed = false;

for (const budget of budgets) {
    const pack = dryRunPack(resolve(repoRoot, budget.dir));
    const problems = [];
    const warnings = [];

    if (pack.entryCount > budget.maxFiles) {
        problems.push(
            `${pack.entryCount} files in the tarball, budget is ${budget.maxFiles}`,
        );
    }
    if (pack.unpackedSize > budget.maxUnpackedMB * MB) {
        problems.push(
            `${formatMB(pack.unpackedSize)} unpacked, budget is ${
                budget.maxUnpackedMB
            } MB`,
        );
    }
    for (const prefix of budget.forbiddenPaths ?? []) {
        const hits = pack.files.filter((file) =>
            file.path.startsWith(prefix),
        ).length;
        if (hits > 0) {
            problems.push(`${hits} files under the forbidden path ${prefix}`);
        }
    }

    const latest = await latestOnNpm(pack.name);
    let change = "n/a";
    if (latest?.unpackedSize) {
        const percent =
            ((pack.unpackedSize - latest.unpackedSize) / latest.unpackedSize) *
            100;
        change = `${percent >= 0 ? "+" : ""}${percent.toFixed(0)}% vs ${
            latest.version
        } (${formatMB(latest.unpackedSize)}, ${latest.fileCount} files)`;
        const maxGrowth = budget.maxGrowthPercent ?? 50;
        if (percent > maxGrowth) {
            warnings.push(
                `grew ${percent.toFixed(0)}% since ${
                    latest.version
                } on npm, above the ${maxGrowth}% warning threshold`,
            );
        }
    }

    for (const problem of problems) {
        failed = true;
        console.error(`::error title=${pack.name} package size::${problem}`);
    }
    for (const warning of warnings) {
        console.warn(`::warning title=${pack.name} package size::${warning}`);
    }
    if (problems.length > 0) {
        console.error(`Largest directories in the ${pack.name} tarball:`);
        for (const [directory, bytes] of largestDirectories(pack.files)) {
            console.error(`  ${formatMB(bytes).padStart(10)}  ${directory}`);
        }
    }

    rows.push({
        name: pack.name,
        version: pack.version,
        files: pack.entryCount,
        size: formatMB(pack.unpackedSize),
        budget: `${budget.maxFiles} files / ${budget.maxUnpackedMB} MB`,
        change,
        status:
            problems.length > 0 ? "FAIL" : warnings.length > 0 ? "WARN" : "OK",
    });
}

const table = [
    "| Package | Version | Files | Unpacked | Budget | Change vs npm latest | Status |",
    "|---|---|---|---|---|---|---|",
    ...rows.map(
        (row) =>
            `| ${row.name} | ${row.version} | ${row.files} | ${row.size} | ${row.budget} | ${row.change} | ${row.status} |`,
    ),
].join("\n");

console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Published package sizes\n\n${table}\n`,
    );
}

process.exit(failed ? 1 : 0);
