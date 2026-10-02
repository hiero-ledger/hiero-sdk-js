#!/usr/bin/env node
/*
 * Re-runs the failed jobs of a "Build & Test" or "Common JS" run when they
 * failed for a reason that has nothing to do with the code under test: a job
 * or step that hit its timeout-minutes, a Solo network that stopped answering
 * (tests and hooks timing out), a runner that was lost, a package registry or
 * connection error. Jobs that failed on a test assertion, a build or lint
 * error, or that a person cancelled are left alone.
 *
 * Besides the run that triggered it, the script judges every other completed
 * run of those workflows on the same commit: on a pull request the
 * Harden-Runner check only finishes with the last workflow on the head, so
 * an earlier Common JS failure gets its turn when Build & Test completes.
 *
 * Driven by .github/workflows/retry-failed-runs.yml, which passes GH_TOKEN,
 * GITHUB_REPOSITORY, RUN_ID, RUN_NAME, RUN_ATTEMPT, HEAD_SHA, RUN_EVENT,
 * HEAD_BRANCH, HEAD_REPO_OWNER, MAX_RETRIES (pushes, default 3) and
 * MAX_RETRIES_PULL_REQUEST (default 1). DRY_RUN=1 decides without re-running.
 *
 * Try the classifier on downloaded job logs:
 *   node .github/scripts/retry-failed-run.mjs --classify job.log [more.log ...]
 */

import fs from "node:fs";
import { pathToFileURL } from "node:url";

// A failed test or hook whose error matches one of these failed on the
// infrastructure, not on the code. Checked against every entry of vitest's
// failure report (or, when the log is not available yet, against every
// error annotation of the job).
const INFRA_TEST_ERRORS = [
    [
        "test or hook timed out waiting for the network",
        /\b(Test|Hook) timed out in \d+ms/,
    ],
    [
        "SDK request timed out",
        /MaxAttemptsOrTimeoutError|Error: timeout exceeded/,
    ],
    [
        "gRPC transport error",
        /GrpcServiceError.*\b(UNAVAILABLE|DEADLINE_EXCEEDED)\b/,
    ],
    [
        "connection error",
        /\b(ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|EPIPE)\b|socket hang up/,
    ],
    ["mock server port collision", /\bEADDRINUSE\b/],
    [
        "test setup found the network unreachable",
        /the network (stopped answering|has not answered)/,
    ],
];

// A job that failed without a failure report failed on the infrastructure
// when the end of its log matches one of these.
const INFRA_JOB_ERRORS = [
    [
        "runner was lost",
        /received a shutdown signal|lost communication with the server/,
    ],
    ["Solo did not come up", /SoloError/],
    ["mirror node ingestion lag", /mirror node did not ingest in time/],
    [
        "package registry or connection error",
        /ERR_PNPM_(META_)?FETCH|\b(ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND)\b|socket hang up/,
    ],
];

// GitHub's own notes about a job. They are only in the job's check-run
// annotations, never in the log. A job cap reads "The job has exceeded the
// maximum execution time of 1h0m0s", a step cap "The action '...' has timed
// out after 25 minutes." (older runners: "The action has timed out.").
const TIMED_OUT = /exceeded the maximum execution time|has timed out/;
const CANCELLED_BY_PERSON = /The run was canceled by @/;
const CANCELLED = /The operation was canceled/;
// Annotations that say nothing about the cause.
const GENERIC_ANNOTATION =
    /^(Process completed with exit code \d+\.?|The operation was canceled\.?)$/;

// Jobs behind required checks. When one of them failed for real the run
// stays red whatever else is re-run, so nothing is.
const REQUIRED_JOB =
    /^(Build using Node|Test using Node|Integration Tests on Node)\b/;
const COVERED_WORKFLOWS = [
    ".github/workflows/build.yml",
    ".github/workflows/common_js.yml",
];
const HARDEN_RUNNER_CHECK = "StepSecurity Harden-Runner";
const TAIL_LINES = 400;

/** Drops the timestamp GitHub prefixes to every log line and any ANSI color codes. */
function cleanLine(line) {
    return line.replace(/^\S+Z /, "").replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
}

/**
 * Splits vitest's failure report into one block per failed test or suite.
 * A block starts at a " FAIL  <file> > <test>" line and ends at the next
 * block, at the "Test Files" summary or at the "[n/m]" separator.
 */
function failureBlocks(lines) {
    const blocks = [];
    let current = null;
    for (const line of lines) {
        if (/^\s*FAIL\s+\S/.test(line)) {
            current = [line];
            blocks.push(current);
            continue;
        }
        if (current === null) continue;
        if (
            /^\s*Test Files\s/.test(line) ||
            /^⎯+\[\d+\/\d+\]/.test(line) ||
            current.length >= 60
        ) {
            current = null;
            continue;
        }
        current.push(line);
    }
    return blocks.map((block) => block.join("\n"));
}

/**
 * @param {string} rawLog the job log as downloaded from the API, "" when it is not available
 * @param {string[]} [annotations] the failure-level annotations of the job's check run
 * @returns {{retry: boolean, reason: string}}
 */
export function classifyLog(rawLog, annotations = []) {
    const lines = rawLog.split(/\r?\n/).map(cleanLine);
    const notes = annotations.join("\n");

    if (TIMED_OUT.test(notes))
        return { retry: true, reason: "job or step hit its timeout-minutes" };
    if (CANCELLED_BY_PERSON.test(notes))
        return { retry: false, reason: "cancelled by a person" };

    // One entry per failed test: vitest's report when the log is there, the
    // error annotations otherwise. Every entry has to be an infrastructure
    // failure for the job to be re-run.
    let entries = failureBlocks(lines);
    if (entries.length === 0)
        entries = annotations.filter((note) => !GENERIC_ANNOTATION.test(note));
    if (entries.length > 0) {
        const causes = new Set();
        for (const entry of entries) {
            const hit = INFRA_TEST_ERRORS.find(([, pattern]) =>
                pattern.test(entry),
            );
            if (hit === undefined) {
                return {
                    retry: false,
                    reason: `failed on a test: ${entry
                        .split("\n")[0]
                        .trim()
                        .slice(0, 200)}`,
                };
            }
            causes.add(hit[0]);
        }
        return {
            retry: true,
            reason: `${
                entries.length
            } failed test(s), all on the infrastructure: ${[...causes].join(
                ", ",
            )}`,
        };
    }

    const tail = lines.slice(-TAIL_LINES).join("\n");
    const hit = INFRA_JOB_ERRORS.find(([, pattern]) => pattern.test(tail));
    if (hit !== undefined) return { retry: true, reason: hit[0] };
    if (CANCELLED.test(notes + "\n" + tail))
        return { retry: false, reason: "cancelled" };
    return {
        retry: false,
        reason: "failure not recognized as an infrastructure failure",
    };
}

const API = "https://api.github.com";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function authHeaders() {
    return {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "hiero-sdk-js-retry-failed-run",
    };
}

async function api(path, init = {}) {
    const res = await fetch(API + path, { ...init, headers: authHeaders() });
    const body = await res.text();
    if (!res.ok)
        throw new Error(
            `${init.method ?? "GET"} ${path} -> HTTP ${
                res.status
            }: ${body.slice(0, 300)}`,
        );
    return body.length > 0 ? JSON.parse(body) : null;
}

/**
 * The job log, or "" when GitHub has not published it yet. The logs endpoint
 * answers with a redirect to blob storage, which must be fetched without the
 * token, and the file can lag the end of the run by a minute or so.
 */
async function jobLog(repo, jobId) {
    const path = `/repos/${repo}/actions/jobs/${jobId}/logs`;
    for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) await sleep(15_000);
        const res = await fetch(API + path, {
            redirect: "manual",
            headers: authHeaders(),
        });
        if (res.status === 404) continue;
        if (res.status >= 300 && res.status < 400) {
            const blob = await fetch(res.headers.get("location"));
            if (blob.status === 404) continue;
            if (!blob.ok)
                throw new Error(
                    `GET ${path} (redirect) -> HTTP ${blob.status}`,
                );
            return blob.text();
        }
        if (!res.ok) throw new Error(`GET ${path} -> HTTP ${res.status}`);
        return res.text();
    }
    console.log(
        `log of job ${jobId} is not available yet, judging it by its annotations`,
    );
    return "";
}

/** The failure-level annotations of the job's check run: GitHub's own notes plus the errors vitest reported. */
async function jobAnnotations(repo, jobId) {
    const annotations = await api(
        `/repos/${repo}/check-runs/${jobId}/annotations?per_page=100`,
    );
    return annotations
        .filter((annotation) => annotation.annotation_level === "failure")
        .map((annotation) => annotation.message);
}

/**
 * "success" once every Harden-Runner check run on the commit has passed,
 * otherwise what is in the way. Waits up to 3 minutes for them to finish.
 */
async function hardenRunnerState(repo, sha) {
    let state = "not reported";
    for (let attempt = 0; attempt < 7; attempt++) {
        if (attempt > 0) await sleep(30_000);
        const { check_runs: checkRuns } = await api(
            `/repos/${repo}/commits/${sha}/check-runs?check_name=${encodeURIComponent(
                HARDEN_RUNNER_CHECK,
            )}&per_page=100`,
        );
        if (checkRuns.length === 0) continue;
        const failed = checkRuns.find(
            (run) => run.status === "completed" && run.conclusion !== "success",
        );
        if (failed !== undefined) return failed.conclusion;
        if (checkRuns.every((run) => run.status === "completed"))
            return "success";
        state = "still running";
    }
    return state;
}

/**
 * Every failed job of the run, each at its latest attempt, with a verdict.
 * A job that passed in attempt 1 and was not re-run still counts as passed.
 */
async function failedJobs(repo, runId) {
    const { jobs } = await api(
        `/repos/${repo}/actions/runs/${runId}/jobs?filter=all&per_page=100`,
    );
    const latest = new Map();
    for (const job of jobs) {
        const seen = latest.get(job.name);
        if (seen === undefined || job.run_attempt > seen.run_attempt)
            latest.set(job.name, job);
    }
    const rows = [];
    for (const job of latest.values()) {
        if (
            job.status !== "completed" ||
            ["success", "skipped", "neutral"].includes(job.conclusion)
        )
            continue;
        const verdict = classifyLog(
            await jobLog(repo, job.id),
            await jobAnnotations(repo, job.id),
        );
        rows.push({
            id: job.id,
            name: job.name,
            conclusion: job.conclusion,
            ...verdict,
        });
    }
    return rows;
}

/** The other completed, failed runs of the covered workflows on the same commit. */
async function siblingRuns(repo, headSha, ownRunId) {
    const { workflow_runs: runs } = await api(
        `/repos/${repo}/actions/runs?head_sha=${headSha}&per_page=50`,
    );
    return runs
        .filter(
            (run) =>
                COVERED_WORKFLOWS.includes(run.path) &&
                String(run.id) !== String(ownRunId),
        )
        .filter(
            (run) =>
                run.status === "completed" &&
                ["failure", "cancelled", "timed_out"].includes(run.conclusion),
        )
        .map((run) => ({
            id: run.id,
            name: run.name,
            attempt: run.run_attempt,
            event: run.event,
            headBranch: run.head_branch,
            headRepoOwner: run.head_repository?.owner?.login ?? "",
        }));
}

function required(names) {
    const missing = names.filter((name) => !process.env[name]);
    if (missing.length > 0)
        throw new Error(`missing environment variables: ${missing.join(", ")}`);
}

function writeSummary(markdown) {
    if (process.env.GITHUB_STEP_SUMMARY)
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n");
    console.log(markdown);
}

async function main() {
    if (process.argv[2] === "--classify") {
        for (const file of process.argv.slice(3)) {
            const verdict = classifyLog(fs.readFileSync(file, "utf8"));
            console.log(
                `${verdict.retry ? "RETRY" : "STOP "}  ${
                    verdict.reason
                }  [${file}]`,
            );
        }
        return;
    }

    required([
        "GH_TOKEN",
        "GITHUB_REPOSITORY",
        "RUN_ID",
        "RUN_ATTEMPT",
        "HEAD_SHA",
        "RUN_EVENT",
    ]);
    const repo = process.env.GITHUB_REPOSITORY;
    const headSha = process.env.HEAD_SHA;
    const dryRun = process.env.DRY_RUN === "1";
    const budgets = {
        push: Number(process.env.MAX_RETRIES ?? 3),
        pull_request: Number(process.env.MAX_RETRIES_PULL_REQUEST ?? 1),
    };
    const ownRun = {
        id: process.env.RUN_ID,
        name: process.env.RUN_NAME ?? "this run",
        attempt: Number(process.env.RUN_ATTEMPT),
        event: process.env.RUN_EVENT,
        headBranch: process.env.HEAD_BRANCH ?? "",
        headRepoOwner: process.env.HEAD_REPO_OWNER || repo.split("/")[0],
    };

    // Checks that depend on the commit, not on the run, are made once.
    let pullRequestState;
    const pullRequestIsCurrent = async (run) => {
        if (pullRequestState === undefined) {
            const pulls = await api(
                `/repos/${repo}/pulls?state=open&head=${encodeURIComponent(
                    `${run.headRepoOwner}:${run.headBranch}`,
                )}&per_page=5`,
            );
            if (pulls.length === 0)
                pullRequestState = "no open pull request for this branch";
            else if (!pulls.some((pull) => pull.head.sha === headSha))
                pullRequestState =
                    "the pull request has moved on to another commit";
            else pullRequestState = "current";
        }
        return pullRequestState;
    };
    let hardenRunner;
    const hardenRunnerPassed = async () => {
        if (hardenRunner === undefined)
            hardenRunner = await hardenRunnerState(repo, headSha);
        return hardenRunner;
    };

    const sections = [];
    for (const run of [
        ownRun,
        ...(await siblingRuns(repo, headSha, ownRun.id)),
    ]) {
        const rows = await failedJobs(repo, run.id);
        const retryable = rows.filter((row) => row.retry);
        const realRequiredFailure = rows.find(
            (row) => !row.retry && REQUIRED_JOB.test(row.name),
        );
        const maxRetries = budgets[run.event] ?? budgets.push;
        const isPullRequest = run.event === "pull_request";
        let decision;

        if (rows.length === 0) {
            decision = "no failed job to look at";
        } else if (retryable.length === 0) {
            decision = "nothing to re-run";
        } else if (realRequiredFailure !== undefined) {
            decision = `"${realRequiredFailure.name}" failed for real, so the run stays red whatever is re-run; not re-running`;
        } else if (run.attempt > maxRetries) {
            decision = `attempt ${
                run.attempt
            } has already used the ${maxRetries} ${
                isPullRequest ? "pull request " : ""
            }retr${maxRetries === 1 ? "y" : "ies"}, not re-running`;
        } else if (
            isPullRequest &&
            (await pullRequestIsCurrent(run)) !== "current"
        ) {
            decision = `${pullRequestState}, not re-running`;
        } else if (
            isPullRequest &&
            (await hardenRunnerPassed()) !== "success"
        ) {
            // The check covers the whole commit and finishes with the last
            // workflow on it, so a later completion judges this run again.
            decision =
                `${HARDEN_RUNNER_CHECK} is ${hardenRunner}, not re-running` +
                (hardenRunner === "still running"
                    ? "; the next completed workflow on this commit judges this run again"
                    : "");
        } else {
            const verb = dryRun ? "would re-run" : "re-ran";
            try {
                if (retryable.length === rows.length) {
                    if (!dryRun)
                        await api(
                            `/repos/${repo}/actions/runs/${run.id}/rerun-failed-jobs`,
                            { method: "POST" },
                        );
                    decision = `${verb} all ${rows.length} failed job(s), retry ${run.attempt} of ${maxRetries}`;
                } else {
                    // A re-run has to wait for the previous one to finish, so only
                    // one job goes now; the rest are judged again when this
                    // attempt ends.
                    const [first, ...rest] = retryable;
                    if (!dryRun)
                        await api(
                            `/repos/${repo}/actions/jobs/${first.id}/rerun`,
                            { method: "POST" },
                        );
                    decision =
                        `${verb} "${first.name}" only, retry ${run.attempt} of ${maxRetries}; ` +
                        `${
                            rows.length - retryable.length
                        } job(s) failed on tests and stay as they are` +
                        (rest.length > 0
                            ? `; ${rest.length} more infrastructure failure(s) will be judged when this attempt ends`
                            : "");
                }
            } catch (error) {
                // Typically: another handler re-ran it a moment ago.
                decision = `re-run request failed, leaving it: ${
                    /** @type {Error} */ (error).message.slice(0, 200)
                }`;
            }
        }

        // Backslashes and pipes would break the markdown table.
        const cell = (text) => text.replace(/[\\|]/g, (char) => `\\${char}`);
        const table = rows
            .map(
                (row) =>
                    `| ${cell(row.name)} | ${row.conclusion} | ${
                        row.retry ? "re-run" : "leave"
                    } | ${cell(row.reason)} |`,
            )
            .join("\n");
        sections.push(
            `### Retry decision for ${run.name} run ${run.id}, attempt ${run.attempt}\n\n` +
                (rows.length > 0
                    ? `| Job | Result | Verdict | Why |\n| --- | --- | --- | --- |\n${table}\n\n`
                    : "") +
                `**Decision:** ${decision}`,
        );
    }
    writeSummary(sections.join("\n\n"));
}

// Only run when executed directly, so `classifyLog` can be imported.
if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
