# Dependency Bot PR Sweep

Sweep the open **Dependabot** PRs on `hiero-ledger/hiero-sdk-js`: approve and squash-merge every PR whose **required**
checks pass, re-run required jobs that failed on a known flake, rebase stale PRs, and report the PRs that fail
for real.

**Scope rule (team, 2026-10-01): only `app/dependabot` PRs, only when no file under `.github/` changes, and only
when every commit on the branch is Dependabot's.**
- GitHub Actions bumps (`.github/workflows/*.yml`, branch `dependabot/github_actions/...`) are never approved,
  merged, refreshed or re-run by this sweep; list them in the report for the github-maintainers.
- Snyk PRs (`lfdt-bot`, `snyk-bot`, `snyk-fix-*` branches) are never touched (no approve, merge, close, comment);
  list them in the report. Human PRs are not part of the sweep: not touched, not listed.
- A Dependabot branch with a human commit on it (e.g. `Merge branch 'main' into dependabot/...`) is out of scope:
  nobody reviewed that code and Dependabot has stopped rebasing the branch. List it.
- Lockfile changes inside an npm bump (`pnpm-lock.yaml`, `tck/package-lock.json`, ...) are fine, and so is any
  other `.yml`/`.yaml` outside `.github/` (`pnpm-workspace.yaml`, Taskfiles, `common_js_test/pnpm-lock.yaml`).

The helper scripts in `scripts/dep-bot-prs/` apply these rules themselves: `list-prs.sh` sorts the PRs into in and
out of scope, `mergepr.sh` refuses anything out of scope. `R=hiero-ledger/hiero-sdk-js` in the commands below.

## Ground truth (verified 2026-10-01, re-verify with the commands in step 1 if anything looks off)

- **Required checks on `main`** (org + repo rulesets):
  `DCO`, `StepSecurity Required Checks`, `Build using Node 22`, `Build using Node 24`, `Test using Node 22`
  (all `build.yml`), `Integration Tests on Node 22`, `Integration Tests on Node 24` (`common_js.yml`). The same
  list is `REQUIRED_CHECKS` in `scripts/dep-bot-prs/common.sh`; keep the two in sync.
- **Not required** (red is allowed): `DAB Tests using Node 22`, `Run examples using Node 22`, `Upload Coverage`,
  `codecov/project`, `codecov/patch`, `Assignee Check`, `Title Check`, `conventional-pr-title`, `Notify Slack`,
  `security/snyk (...)`, `license/snyk (...)`, `CodeQL`.
- Merge rules: squash only, 1 approval **from a code owner**, review threads resolved, signed commits,
  branch does **not** need to be up to date (`strict_required_status_checks_policy: false`), stale approvals are
  dismissed on push (`dismiss_stale_reviews_on_push: true`).
- `CODEOWNERS`: `*` is owned by `hiero-sdk-js-maintainers` + `hiero-sdk-js-committers` (any SDK maintainer or
  committer satisfies the code-owner review), but `/.github/` and `/.github/workflows/` are owned by
  `@hiero-ledger/github-maintainers` only. An SDK-side approval on a GitHub Actions bump never unblocks it
  (`reviewDecision` stays `REVIEW_REQUIRED`), which is one more reason those PRs are out of scope here. The scope
  test "no file under `.github/`" is this rule.
- Repo squash settings: title = PR title, body blank. `gh pr merge N --squash` with no other flags reproduces
  the house style (`chore(deps): bump x from a to b (#N)`, author `dependabot[bot]`, GitHub-signed).
- House style for bot merges (what the maintainers do themselves): approve, then `gh pr merge N --squash`. No
  assignee, no comment. Branch is auto-deleted.
- Dependabot config: npm, directory `/`, monthly, **ignores minor/patch**, so the regular wave is major bumps
  only; minor/patch PRs are Dependabot *security* updates. All Dependabot npm PRs ship the `pnpm-lock.yaml`
  change (no manual lockfile work). GitHub Actions bumps are single-file workflow edits.

## Helpers (`scripts/dep-bot-prs/`)

They need `gh` (logged in, write access to the repo), `jq`, `python3`, `git`, bash 3.2 or newer, and GNU `timeout`
for the time limits on `gh`/`git` calls (`brew install coreutils` on macOS; `gtimeout` is picked up too; without
either the scripts say so once and run unbounded). They work from any directory and find the checkout they live in
themselves; `DEP_BOT_PRS_REPO` points them at another repo. `DRY_RUN=1` makes `rerun.sh` and `mergepr.sh` print
what they would do and stop before doing it.

| Script | Does |
| --- | --- |
| `list-prs.sh` | open bot PRs in two groups: in scope, and out of scope with the reasons (`TOUCHES-.github/`, `HUMAN-COMMITS`, `NOT-DEPENDABOT`) |
| `reqstatus.sh <pr>...` | one line per PR: `ALL-REQUIRED-GREEN` / `WAITING` / `FAILED`, head SHA, the state of every required check and the ones that have not reported yet (`missing=`) |
| `classify.sh <pr>` | every non-green required job on the head: run id, job id, `REAL` / `FLAKE` / `INFRA` / `CANCELLED` / `RUNNING` / `UNKNOWN` and a one-line reason from the log |
| `hardenok.sh <pr>` | exit 0 only when `StepSecurity Harden-Runner` on the head is `completed/success` |
| `rerun.sh <pr> [job-id...]` | Harden-Runner gate, then one `gh run rerun --job` per `FLAKE` / `INFRA` / `CANCELLED` job (or per given job id) |
| `lockdups.py <pnpm-lock.yaml>` | duplicate keys in `importers` / `packages` / `snapshots`, one-line `key: {}` leaves included |
| `simmerge.sh <pr> [sha]` | merges the PR onto current `main` (both fetched from `https://github.com/$R.git`) in a temp worktree, then `lockdups.py` and the `pnpm@9.15.5 install --lockfile-only` no-op check; exit 3 when the head is not `sha` |
| `mergepr.sh <pr>` | scope gate, `reqstatus.sh` and `simmerge.sh` for one head SHA, then approve pinned to that SHA and `gh pr merge --squash --match-head-commit` |

Every script prints `#N ...` lines, so output for several PRs can be mixed. Exit codes: 0 fine, 1 the PR is not
ready or something failed, 2 usage or GitHub error, 3 (`simmerge.sh` only) the PR head moved.

## Steps

### 1. List the bot PRs and snapshot the required checks

```bash
scripts/dep-bot-prs/list-prs.sh
scripts/dep-bot-prs/reqstatus.sh 4437 4435 4415        # every PR of the IN SCOPE group
```

The OUT OF SCOPE group goes straight into the report's "not in scope" list. `reqstatus.sh` says `FAILED` as soon
as one required check is red, even while others still run, and `WAITING` until all seven required checks have
reported: right after a Dependabot rebase only `DCO` and `StepSecurity Required Checks` exist for a few minutes.

To re-verify the ground truth:

```bash
gh api repos/$R/rules/branches/main --jq '.[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context' | sort -u
gh api repos/$R/rules/branches/main --jq '.[] | select(.type=="pull_request") | .parameters'
gh pr view N --repo $R --json statusCheckRollup        # raw check list; several attempts of one check can be listed
```

### 2. Classify every red required check before touching it

```bash
scripts/dep-bot-prs/classify.sh N        # downloads 5-6k-line logs, slow; run several PRs in the background
```

One line per failed, cancelled or running required job: `#N <run> <job> <CLASS> <where>: <why>`. The `REAL`
signatures are matched before the flake signatures, so a log that has both is `REAL` and is never re-run.
`UNKNOWN` prints the first `##[error]` lines under the verdict so you can decide; once you know what it was, re-run
it with its job id (step 3) and add the signature to `classify.sh` and to the tables below in a normal PR.

Manual equivalent:

```bash
sha=$(gh pr view N --repo $R --json headRefOid -q .headRefOid)
gh api "repos/$R/actions/runs?head_sha=$sha&per_page=50" --jq '.workflow_runs[] | "\(.id) attempt=\(.run_attempt) [\(.name)] \(.status)/\(.conclusion) \(.created_at)"'
gh api "repos/$R/actions/runs/<run>/jobs?per_page=50" --jq '.jobs[] | "\(.id) \(.name) \(.status)/\(.conclusion)"'
gh api "repos/$R/actions/jobs/<job>/logs" | sed -E 's/\x1b\[[0-9;]*m//g' | grep -nE '##\[error\]|Test Files|Tests  | FAIL |×|ERR_|TypeError|EADDRINUSE|timeout exceeded' | head -40
```

Known **flakes** (re-run is the right move):

| Signature in the log | Job | Meaning |
| --- | --- | --- |
| `listen EADDRINUSE: address already in use 0.0.0.0:53243/53244` on the two `receipt node failover` tests in `test/unit/node/TransactionResponseReceiptMocking.js` | Test using Node 22 | Mocker fixed-port collision between parallel vitest workers; passes locally 3/3, hit 3 CI runs in a row on 2026-10-01 (#4422, #4439, #4419) so budget for a second re-run |
| `× Jumbo transaction 12xxxxms` / `Error: timeout exceeded` in the chromium integration suite | Test using Node 22 | single integration test timing out against Solo |
| `MaxAttemptsOrTimeoutError: timeout exceeded` with `nodeAccountId: '0.0.3'` on many tests at exact 120 s | Test / examples | local node went dark (issue #4357 signature) |
| `AccountBalanceDeprecation.js > forwards an explicit mirror request timeout` `expected 4320 to equal 4321` | Test using Node 22 | pre-existing 1 ms deadline assertion flake (hit #4439 and #4403 re-runs) |
| `FAIL chromium test/integration/...` followed by `Error: timeout exceeded` (`nodeAccountId: '0.0.3'`), e.g. `AccountCreate > High-Volume Throttle Flag` | Test using Node 22 | one integration test timed out against Solo |
| `test/unit/PrivateKey.js > DER encoded functions > should return false if the key is not a DER key` `expected true to be false` | Test using Node 22 | test feeds a random raw ECDSA key to `PrivateKey.isDerKey`, which returns true whenever the random bytes happen to parse as ASN.1; 25/25 local passes, 1 CI hit (#4424). Real fix = a fixed raw key in the test |
| `FAIL chromium test/integration/TransactionIntegrationTest.js > HIP-1300 > should not create a transaction with more than 6kbs...` `TypeError: Cannot read properties of undefined (reading 'toString')` | Test using Node 22 | chromium integration flake, seen on #4317 and #4415, passes on re-run |
| Job `cancelled` with no error of its own | any | run was cancelled (hung sibling, manual cancel); treat as "not run" |
| `SoloError` / `v1.min.io/tenant=minio` in "Prepare Hiero Solo" | Test / DAB / examples | Solo bring-up outage, nothing to do with the PR |
| `DAB Tests using Node 22` red on `NodeUpdateIntegrationTest.js` | DAB | known mirror-importer lag flake and **not required** anyway |

Known **real breakages** seen on 2026-10-01 (re-running does not help, report them):

| PR | Bump | Failure |
| --- | --- | --- |
| #4430 | eslint 9 → 10 | `Build using Node 24`: lint crashes `TypeError: Class extends value undefined is not a constructor or null` (a plugin is not eslint-10 ready) |
| #4432 | @typescript-eslint/eslint-plugin 5 → 8 | `Build` + `Integration Tests`: hundreds of new lint errors (`no-base-to-string`, `no-unsafe-enum-comparison`, `no-unused-vars`, ...) |
| #4426 | mocha 11 → 12 | `Integration Tests on Node 22`: `ERR_REQUIRE_ESM` from `mocha/lib/cli/options.cjs` (mocha 12 is ESM-only, common_js tests `require()` it) |
| #4417 | @vitest/coverage-v8 4 → 5 | `Test using Node 22`: `Provider playwright does not support command "__vitest_startV8Coverage"` (needs the whole vitest 5 family, vitest itself is 4.1.x) |
| #4437 | @vitest/browser-playwright 4 → 5 | `Test using Node 22`: `SyntaxError: The requested module 'vitest/node' does not provide an export named 'BrowserConnectionError'` (same vitest 5 family problem) |
| #4423 | @vitest/coverage-istanbul 4 → 5 | `Test using Node 22`: `AssertionError: coverageFilesDirectory is required` on every file (same vitest 5 family problem) |

The vitest family (`vitest`, `@vitest/browser`, `@vitest/browser-playwright`, `@vitest/coverage-v8`,
`@vitest/coverage-istanbul`) must move together; Dependabot opens one PR per package and cannot group them without
a `groups:` entry for `vitest` + `@vitest/*` in `.github/dependabot.yml` (worth adding). Merge only the pieces
whose CI is green and say in the report that the rest needs a coordinated bump.

**`StepSecurity Required Checks` red** (org-required, not a workflow job, so `classify.sh` does not see it): read the
check-run output, it is one of four checks: NPM Compromised Packages, **NPM Package Cooldown** (any package version
in the PR released < 2 days ago; the text says when it will pass), Pwn Request, Script Injection.

```bash
sha=$(gh pr view N --repo $R --json headRefOid -q .headRefOid)
gh api "repos/$R/commits/$sha/check-runs?per_page=50" --jq '.check_runs[] | select(.name=="StepSecurity Required Checks") | "\(.conclusion) \(.id)\n\(.output.text)"'
```

A cooldown failure needs no fix: wait until the stated time, then re-trigger the check with
`gh api -X POST repos/$R/check-runs/<id>/rerequest`. `@dependabot rebase` only helps when the branch is behind
`main` (otherwise Dependabot answers that it is already up to date and nothing runs); `@dependabot recreate` forces
a fresh head. The "Approve check run" link in the output is a manual security bypass for maintainers; do not use it
for a bot bump. Seen 2026-10-01 on #4415 (expo-symbols): the rebased lockfile pulled `expo-server@58.0.2`
published the day before, the check passed the next day.

### 3. Re-run flakes, rebase stale PRs

**Precondition (team rule, 2026-10-01): the `StepSecurity Harden-Runner` check on the PR head must be
`completed/success` before any failed job is restarted.** Harden-Runner stays `in_progress` until every
monitored workflow run for that head has finished (Build & Test *and* Common JS), so a re-run is only possible
once the whole run set is done; if Harden-Runner reports a failure (anomalous outbound traffic), do not re-run,
report it. `rerun.sh` checks this itself and refuses otherwise.

```bash
DRY_RUN=1 scripts/dep-bot-prs/rerun.sh N      # what would be re-run, and why
scripts/dep-bot-prs/rerun.sh N                # Harden-Runner gate, then gh run rerun --job for every FLAKE / INFRA / CANCELLED job
scripts/dep-bot-prs/rerun.sh N <job-id>       # an UNKNOWN job you classified by hand (job id = third field of its classify line)
gh pr comment N --repo $R --body "@dependabot rebase"   # PR head older than main's last CI-affecting change
```

- Jobs are re-run one at a time (`gh run rerun --job <id>`, dependencies included) so `REAL` failures and the
  non-required DAB / examples jobs do not go back on the shared runners, which are the bottleneck.
- A job can only be re-run once its whole run is `completed`; `rerun.sh` says so otherwise, try again later.
- A PR whose head is weeks old (e.g. opened before the Solo bump) should be rebased, not re-run: a re-run
  reuses the old workflow snapshot.
- Dependabot auto-rebases a PR that becomes CONFLICTING after a merge (new head, fresh CI, Harden-Runner
  restarts). It stops managing a branch once a human pushed to it.
- Each re-run or rebase costs a full CI cycle (30-60 min on the shared runners); expect to loop. `Test using Node 22`
  needs the large runner and queues behind every other PR and main push, so a wave of 20 rebased PRs takes hours.
- GitHub connectivity can stall: a `git fetch` hung for 15 min mid-batch and `gh` returned `connection reset by
  peer`. The scripts put every `gh`/`git` call under `timeout`; run batches in the background so a stall does not
  block you.

### 4. Pre-merge lockfile safety check (done for every merge)

Merging several bot PRs that each touch `pnpm-lock.yaml` can produce a lockfile that git merges cleanly but
pnpm cannot use (duplicate `pkg@ver` keys), after which CI silently re-resolves everything. `simmerge.sh`
simulates the merge against the **current** `main` and verifies the lockfile; `mergepr.sh` runs it before every
merge, and you can run it alone:

```bash
scripts/dep-bot-prs/simmerge.sh N
```

- `pnpm@9.15.5` is CI's exact pnpm (`.github/workflows/build.yml`); `--lockfile-only` never touches
  `node_modules`. A consistent lockfile returns in ~1-2 s with zero diff; a slow run with a diff means pnpm
  re-resolved (stale or corrupt lockfile) and the PR must be rebased first. A pnpm error is reported as a failure,
  never as a pass.
- Baseline `main` first when in doubt: `python3 scripts/dep-bot-prs/lockdups.py pnpm-lock.yaml` on a fresh
  `main` checkout, then the same pnpm command. On 2026-10-01 main was clean: 0 duplicates, no-op.
- A CONFLICTS result means the PR needs `@dependabot rebase` (the PR list will show it as CONFLICTING shortly).

### 5. Approve and squash-merge, one PR at a time

```bash
DRY_RUN=1 scripts/dep-bot-prs/mergepr.sh N    # gates only
scripts/dep-bot-prs/mergepr.sh N
```

- The gates and the merge all refer to one head SHA, read once at the start: `reqstatus.sh` must have judged that
  SHA, `simmerge.sh` must have fetched that SHA, the approval is posted with `commit_id=<sha>` and the merge uses
  `--match-head-commit <sha>`. If Dependabot rebases in between, nothing is merged and the approval is dismissed.
- Every `gh` call runs under `timeout 120`: on 2026-10-01 a bare `gh` call stalled a batch for two hours, and
  `gh pr merge` can return `connection reset by peer` although the merge went through, so the script re-reads the
  PR state afterwards instead of trusting the exit code.
- Merge sequentially and re-simulate after each merge (`mergepr.sh` does both); main moves under you.
- After every merge, sibling PRs that edit neighbouring lines of the same `package.json` turn CONFLICTING and
  Dependabot rebases them; their CI starts over. Merge the PRs that touch distinct manifests first.
- Non-required red checks (DAB, examples, codecov, Snyk) do not block; mention a PR-specific `security/snyk`
  failure in the report (the Snyk page needs a Snyk login, it cannot be read from the CLI).
- `reviewDecision` must flip to `APPROVED` after the review; if it stays `REVIEW_REQUIRED` the files need a
  different code owner (workflow files), which the scope gate should have caught.

### 6. Special cases

- **GitHub Actions bumps** are out of scope (see the scope rule). For the record: `/.github/workflows/` is owned by
  github-maintainers, `gh api -X PUT repos/$R/pulls/N/update-branch` fails on workflow files with
  `without workflow scope` (the gh OAuth token lacks `workflow`), and hiero-solo-action was already at v0.25.0
  while #4317 still proposed 0.23.0.
- **Snyk PRs** are out of scope. For the record: `snyk-fix-*` branches fail DCO (no sign-off) and the title check
  and never carry the lockfile; Dependabot usually opens the same bump (e.g. #4444 chromedriver 151.0.5 vs
  Dependabot #4422 chromedriver 154), so they end up superseded. Leave them to their owners.
- **Human commits on a bot branch** (e.g. `Merge branch 'main' into dependabot/...`): out of scope, `list-prs.sh`
  flags them as `HUMAN-COMMITS`. Dependabot no longer rebases or retargets such a PR, so it will never move to a
  newer version by itself.
- `gh pr view --json statusCheckRollup` can list the same check twice (old + new attempt) and prints missing
  dates as `0001-01-01T00:00:00Z`; `reqstatus.sh` takes the newest attempt (a running one wins). `mergeable` is
  `UNKNOWN` for a minute after main changes.

### 7. Report

List: merged PRs (number, bump, merge SHA), PRs still in CI, re-runs/rebases triggered, real failures with
their one-line cause, and the out-of-scope PRs (workflow bumps for the github-maintainers, Snyk, Dependabot
branches with human commits). Keep it short. Do not edit this file as part of a sweep; a new flake or breakage
signature goes into `classify.sh` and the tables in step 2 through a normal PR.
