#!/usr/bin/env node
/*
 * Re-runs the failed jobs of a "Build & Test" or "Common JS" run when they
 * failed for a reason that has nothing to do with the code under test: a job
 * that hit its timeout-minutes, a Solo network that stopped answering (tests
 * and hooks timing out), a runner that was lost, a package registry or
 * connection error. Jobs that failed on a test assertion, a build or lint
 * error, or that a person cancelled are left alone.
 *
 * Driven by .github/workflows/retry-failed-runs.yml, which passes GH_TOKEN,
 * GITHUB_REPOSITORY, RUN_ID, RUN_ATTEMPT, HEAD_SHA, RUN_EVENT, HEAD_BRANCH,
 * HEAD_REPO_OWNER and MAX_RETRIES (default 3). DRY_RUN=1 decides without
 * re-running anything.
 *
 * Try the classifier on downloaded job logs:
 *   node .github/scripts/retry-failed-run.mjs --classify job.log [more.log ...]
 */

import fs from "node:fs";

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
// annotations, never in the log.
const JOB_TIMED_OUT = /exceeded the maximum execution time/;
const CANCELLED_BY_PERSON = /The run was canceled by @/;
const CANCELLED = /The operation was canceled/;
// Annotations that say nothing about the cause.
const GENERIC_ANNOTATION =
    /^(Process completed with exit code \d+\.?|The operation was canceled\.?)$/;

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

    if (JOB_TIMED_OUT.test(notes))
        return { retry: true, reason: "job hit its timeout-minutes" };
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
    const runId = process.env.RUN_ID;
    const attempt = Number(process.env.RUN_ATTEMPT);
    const maxRetries = Number(process.env.MAX_RETRIES ?? 3);
    const dryRun = Boolean(process.env.DRY_RUN);
    const isPullRequest = process.env.RUN_EVENT === "pull_request";

    // Every attempt of every job, reduced to the latest attempt per job: a
    // job that passed in attempt 1 and was not re-run still counts as passed.
    const { jobs } = await api(
        `/repos/${repo}/actions/runs/${runId}/jobs?filter=all&per_page=100`,
    );
    const latest = new Map();
    for (const job of jobs) {
        const seen = latest.get(job.name);
        if (seen === undefined || job.run_attempt > seen.run_attempt)
            latest.set(job.name, job);
    }
    const failedJobs = [...latest.values()].filter(
        (job) =>
            job.status === "completed" &&
            !["success", "skipped", "neutral"].includes(job.conclusion),
    );
    const rows = [];
    for (const job of failedJobs) {
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
    const retryable = rows.filter((row) => row.retry);

    let decision;
    if (retryable.length === 0) {
        decision =
            rows.length === 0
                ? "no failed job to look at"
                : "nothing to re-run";
    } else if (attempt > maxRetries) {
        decision = `attempt ${attempt} has already used the ${maxRetries} retries, not re-running`;
    } else if (isPullRequest) {
        const owner = process.env.HEAD_REPO_OWNER || repo.split("/")[0];
        const pulls = await api(
            `/repos/${repo}/pulls?state=open&head=${encodeURIComponent(
                `${owner}:${process.env.HEAD_BRANCH}`,
            )}&per_page=5`,
        );
        if (pulls.length === 0)
            decision = "no open pull request for this branch, not re-running";
    }
    if (decision === undefined && isPullRequest) {
        // Pull request heads are re-run only once Harden-Runner has looked at
        // them. Pushes to main carry no such check.
        const hardenRunner = await hardenRunnerState(
            repo,
            process.env.HEAD_SHA,
        );
        if (hardenRunner !== "success")
            decision = `${HARDEN_RUNNER_CHECK} is ${hardenRunner}, not re-running`;
    }
    if (decision === undefined) {
        const verb = dryRun ? "would re-run" : "re-ran";
        if (retryable.length === rows.length) {
            if (!dryRun)
                await api(
                    `/repos/${repo}/actions/runs/${runId}/rerun-failed-jobs`,
                    { method: "POST" },
                );
            decision = `${verb} all ${rows.length} failed job(s), retry ${attempt} of ${maxRetries}`;
        } else {
            // A re-run has to wait for the previous one to finish, so only one
            // job goes now; the rest are judged again when this attempt ends.
            const [first, ...rest] = retryable;
            if (!dryRun)
                await api(`/repos/${repo}/actions/jobs/${first.id}/rerun`, {
                    method: "POST",
                });
            decision =
                `${verb} "${first.name}" only, retry ${attempt} of ${maxRetries}; ` +
                `${
                    rows.length - retryable.length
                } job(s) failed on tests and stay as they are` +
                (rest.length > 0
                    ? `; ${rest.length} more infrastructure failure(s) will be judged when this attempt ends`
                    : "");
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
    writeSummary(
        `### Retry decision for run ${runId}, attempt ${attempt}\n\n` +
            (rows.length > 0
                ? `| Job | Result | Verdict | Why |\n| --- | --- | --- | --- |\n${table}\n\n`
                : "") +
            `**Decision:** ${decision}`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
