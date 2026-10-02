# Dependency Bot PR Sweep

Sweep the open **Dependabot** PRs on `hiero-ledger/hiero-sdk-js`: approve and squash-merge every PR whose **required**
checks pass, re-run required checks that failed on a known flake, rebase stale PRs, and report the PRs that fail
for real.

**Scope rule (team, 2026-10-01): only `app/dependabot` PRs, and only when no `.yml` workflow file is involved.**
- GitHub Actions bumps (`.github/workflows/*.yml`, branch `dependabot/github_actions/...`) are never approved,
  merged, refreshed or re-run by this sweep; list them in the report for the github-maintainers.
- Snyk PRs (`lfdt-bot`, `snyk-bot`, `snyk-fix-*` branches) and human PRs are never touched (no approve, merge,
  close, comment); list them in the report.
- `pnpm-lock.yaml` / `tck/package-lock.json` changes inside an npm bump are fine.

Repo: `R=hiero-ledger/hiero-sdk-js`. Work from a scratch dir (`S=<scratchpad>`), never from the checkout's `node_modules`.

## Ground truth (verified 2026-10-01, re-verify with the commands in step 1 if anything looks off)

- **Required checks on `main`** (org + repo rulesets, `gh api repos/$R/rules/branches/main`):
  `DCO`, `StepSecurity Required Checks`, `Build using Node 22`, `Build using Node 24`, `Test using Node 22`
  (all `build.yml`), `Integration Tests on Node 22`, `Integration Tests on Node 24` (`common_js.yml`).
- **Not required** (red is allowed): `DAB Tests using Node 22`, `Run examples using Node 22`, `Upload Coverage`,
  `codecov/project`, `codecov/patch`, `Assignee Check`, `Title Check`, `conventional-pr-title`, `Notify Slack`,
  `security/snyk (...)`, `license/snyk (...)`, `CodeQL`.
- Merge rules: squash only, 1 approval **from a code owner**, review threads resolved, signed commits,
  branch does **not** need to be up to date (`strict_required_status_checks_policy: false`).
- `CODEOWNERS`: `*` is owned by `hiero-sdk-js-maintainers` + `hiero-sdk-js-committers` (any SDK maintainer or
  committer satisfies the code-owner review), but `/.github/` and `/.github/workflows/` are owned by
  `@hiero-ledger/github-maintainers` only. An SDK-side approval on a GitHub Actions bump never unblocks it
  (`reviewDecision` stays `REVIEW_REQUIRED`), which is one more reason those PRs are out of scope here.
- Repo squash settings: title = PR title, body blank. `gh pr merge N --squash` with no other flags reproduces
  the house style (`chore(deps): bump x from a to b (#N)`, author `dependabot[bot]`, GitHub-signed).
- House style for bot merges (what the maintainers do themselves): `gh pr review N --approve` then
  `gh pr merge N --squash`. No assignee, no comment. Branch is auto-deleted.
- Dependabot config: npm, directory `/`, monthly, **ignores minor/patch**, so the regular wave is major bumps
  only; minor/patch PRs are Dependabot *security* updates. All Dependabot npm PRs ship the `pnpm-lock.yaml`
  change (no manual lockfile work). GitHub Actions bumps are single-file workflow edits.

## Steps

### 1. List the bot PRs and snapshot the required checks

```bash
gh pr list --repo $R --state open --limit 100 --json number,title,author,mergeable,headRefName,files \
  --jq '.[] | select(.author.login == "app/dependabot") | select([.files[].path] | any(test("\\.ya?ml$") and (test("^pnpm-lock\\.yaml$") | not)) | not) | "\(.number)\t\(.headRefName)\t\(.mergeable)\t\(.title)"'
```

Everything the filter drops (workflow bumps, Snyk, humans) goes straight into the report's "not in scope" list:

```bash
gh pr list --repo $R --state open --limit 100 --json number,title,author,files \
  --jq '.[] | select(.author.login != "app/dependabot" or ([.files[].path] | any(test("\\.ya?ml$") and (test("^pnpm-lock\\.yaml$") | not)))) | select(.author.login | test("dependabot|lfdt-bot|snyk-bot|renovate")) | "\(.number)\t\(.author.login)\t\(.title)"'
```

Save `reqstatus.sh` in `$S` and run it on every in-scope PR. It prints one line per PR:
`#N <ALL-REQUIRED-GREEN|WAITING|FAILED> <mergeable/mergeStateStatus> <reviewDecision> <head> <check=state ...> <title>`.
A PR counts as FAILED as soon as one required check is red, even while others still run.

```bash
cat > $S/reqstatus.sh <<'EOF'
#!/bin/bash
R=hiero-ledger/hiero-sdk-js
REQ='DCO|StepSecurity Required Checks|Build using Node 22|Build using Node 24|Test using Node 22|Integration Tests on Node 22|Integration Tests on Node 24'
for n in "$@"; do
  gh pr view $n --repo $R --json number,title,mergeable,mergeStateStatus,reviewDecision,headRefOid,statusCheckRollup | jq -r --arg req "$REQ" '
    . as $p
    | [ .statusCheckRollup[] | {name: (.name // .context), st: (.status // "EXTERNAL"), c: (.conclusion // .state // "PENDING"), t: (.startedAt // .completedAt // "")} ]
    | map(select(.name | test("^(" + $req + ")$"))) | group_by(.name) | map(sort_by(.t) | last)
    | map(if .c == "SUCCESS" then "ok" elif .c == "PENDING" or .st == "IN_PROGRESS" or .st == "QUEUED" or .st == "PENDING" then "RUNNING" else .c end) as $states
    | ($states | if all(. == "ok") then "ALL-REQUIRED-GREEN" elif any(. != "ok" and . != "RUNNING") then "FAILED" else "WAITING" end) as $verdict
    | "#\($p.number)\t\($verdict)\t\($p.mergeable)/\($p.mergeStateStatus)\t\($p.reviewDecision)\t\($p.headRefOid[0:8])\t" + (map(.name + "=" + (if .c=="SUCCESS" then "ok" elif .c=="PENDING" then (.st|ascii_downcase) else .c end)) | join(" ")) + "\t\($p.title)"'
done
EOF
chmod +x $S/reqstatus.sh
```

### 2. Classify every red required check before touching it

Save `classify.sh` in `$S`; it prints, for every failed or cancelled REQUIRED job on the PR head, the run id, job id
and a one-line verdict taken from the log (FLAKE -> rerun, REAL -> report, CANCELLED -> rerun, unknown -> the
first `##[error]` lines so you can decide). Logs are 5-6k lines and the API is slow, so run it in the background
for several PRs at once.

```bash
cat > $S/classify.sh <<'EOF2'
#!/bin/bash
# usage: classify.sh <pr>  -> for each failed/cancelled REQUIRED job on the PR head: run id, job id, and a one-line classification from the log
R=hiero-ledger/hiero-sdk-js
n=$1; sha=$(gh pr view $n --repo $R --json headRefOid -q .headRefOid)
gh api "repos/$R/actions/runs?head_sha=$sha&per_page=30" --jq '.workflow_runs[] | select(.name=="Build & Test" or .name=="Common JS") | "\(.id)\t\(.name)\t\(.status)\t\(.conclusion)\t\(.run_attempt)"' | sort -u -k2,2 | while IFS=$'\t' read run name st concl att; do
  gh api "repos/$R/actions/runs/$run/jobs?per_page=30" --jq '.jobs[] | select(.name | test("^(Build using|Test using|Integration Tests on)")) | select(.conclusion != "success" and .conclusion != "skipped") | "\(.id)\t\(.name)\t\(.status)\t\(.conclusion // "-")"' | while IFS=$'\t' read jid jname jst jconcl; do
    if [ "$jst" != "completed" ]; then echo "#$n [$name run $run attempt $att] $jname: $jst"; continue; fi
    if [ "$jconcl" = "cancelled" ]; then echo "#$n [$name run $run attempt $att] $jname: CANCELLED (not run) -> rerun"; continue; fi
    log=$(gh api "repos/$R/actions/jobs/$jid/logs" 2>/dev/null | sed -E 's/\x1b\[[0-9;]*m//g')
    c="unknown"
    echo "$log" | grep -q 'EADDRINUSE' && c="FLAKE EADDRINUSE (Mocker port collision) -> rerun"
    echo "$log" | grep -q '× Jumbo transaction' && c="FLAKE Jumbo transaction timeout -> rerun"
    echo "$log" | grep -q 'SoloError' && c="INFRA SoloError during Solo bring-up -> rerun"
    echo "$log" | grep -q 'does not support command "__vitest_' && c="REAL vitest-5 coverage/provider mismatch"
    echo "$log" | grep -q 'Class extends value undefined' && c="REAL eslint-10 plugin crash"
    echo "$log" | grep -q 'ERR_REQUIRE_ESM' && c="REAL ESM-only dependency (mocha 12)"
    echo "$log" | grep -qE 'error .*@typescript-eslint/' && c="REAL new lint errors (@typescript-eslint)"
    echo "$log" | grep -q 'expected 4320 to equal 4321' && c="FLAKE AccountBalanceDeprecation 1 ms deadline assertion -> rerun"
    echo "$log" | grep -q 'should return false if the key is not a DER key' && c="FLAKE PrivateKey.isDerKey on a random raw key (test-design flake) -> rerun"
    echo "$log" | grep -q "HIP-1300 > should not create a transaction with more than 6kbs" && c="FLAKE HIP-1300 chromium integration test (TypeError reading toString) -> rerun"
    echo "$log" | grep -q "does not provide an export named 'BrowserConnectionError'" && c="REAL @vitest/browser-playwright 5 needs vitest 5"
    echo "$log" | grep -q 'coverageFilesDirectory is required' && c="REAL @vitest/coverage-istanbul 5 needs vitest 5"
    [ "$c" = "unknown" ] && echo "$log" | grep -E '^.* FAIL +(chromium|node)? *test/integration/' -A1 | grep -q 'timeout exceeded' && c="FLAKE integration test timed out against Solo -> rerun"
    [ "$c" = "unknown" ] && echo "$log" | grep -qE 'no applicable address book' && c="FLAKE/INFRA address book not found -> rerun"
    echo "#$n [$name run $run attempt $att] $jname job $jid: $c"
    if [ "$c" = "unknown" ]; then echo "$log" | grep -nE '##\[error\]|Error:|FAIL ' | grep -vE 'deprecated|Python script|DER format' | head -6 | cut -c1-220; fi
  done
done
EOF2
chmod +x $S/classify.sh
```

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
`@vitest/coverage-istanbul`) must move together; Dependabot opens one PR per package. Merge only the pieces
whose CI is green and say in the report that the rest needs a coordinated bump.

**`StepSecurity Required Checks` red** (org-required, not a workflow job, so `classify.sh` does not see it): read the
check-run output, it is one of four checks: NPM Compromised Packages, **NPM Package Cooldown** (any package version
in the PR released < 2 days ago; the text says when it will pass), Pwn Request, Script Injection.

```bash
sha=$(gh pr view N --repo $R --json headRefOid -q .headRefOid)
gh api "repos/$R/commits/$sha/check-runs?per_page=50" --jq '.check_runs[] | select(.name=="StepSecurity Required Checks") | "\(.conclusion) \(.id)\n\(.output.text)"'
```

A cooldown failure needs no fix: wait until the stated time, then re-trigger the check (`@dependabot rebase`, or
`gh api -X POST repos/$R/check-runs/<id>/rerequest`). The "Approve check run" link in the output is a manual
security bypass for maintainers; do not use it for a bot bump. Seen 2026-10-01 on #4415 (expo-symbols): the rebased
lockfile pulled `expo-server@58.0.2` published the day before, check passes 2026-10-02T15:10Z.

### 3. Re-run flakes, rebase stale PRs

**Precondition (team rule, 2026-10-01): the `StepSecurity Harden-Runner` check on the PR head must be
`completed/success` before any failed job is restarted.** Harden-Runner stays `in_progress` until every
monitored workflow run for that head has finished (Build & Test *and* Common JS), so a re-run is only possible
once the whole run set is done; if Harden-Runner reports a failure (anomalous outbound traffic), do not re-run,
report it.

```bash
cat > $S/hardenok.sh <<'EOF2'
#!/bin/bash
# usage: hardenok.sh <pr>  -> prints "<status>/<conclusion>" of the latest StepSecurity Harden-Runner check on the PR head; exit 0 only when completed/success
R=hiero-ledger/hiero-sdk-js
n=$1; sha=$(gh pr view $n --repo $R --json headRefOid -q .headRefOid)
res=$(gh api "repos/$R/commits/$sha/check-runs?per_page=50" | jq -r '[.check_runs[] | select(.name=="StepSecurity Harden-Runner")] | sort_by(.started_at) | last | "\(.status)/\(.conclusion // "-") \(.output.title // "")"')
echo "#$n head=${sha:0:8} Harden-Runner: $res"
[ "${res%% *}" = "completed/success" ]
EOF2
cat > $S/rerun.sh <<'EOF2'
#!/bin/bash
# usage: rerun.sh <pr>  -> re-run the failed/cancelled jobs of the PR head's completed Build & Test / Common JS runs,
# ONLY if the StepSecurity Harden-Runner check on that head is completed/success (team rule 2026-10-01).
R=hiero-ledger/hiero-sdk-js; S=$(dirname "$0"); n=$1
$S/hardenok.sh $n || { echo "#$n Harden-Runner not passed -> NOT re-running (wait if in_progress, report if failure)"; exit 1; }
sha=$(gh pr view $n --repo $R --json headRefOid -q .headRefOid)
gh api "repos/$R/actions/runs?head_sha=$sha&per_page=30" --jq '.workflow_runs[] | select(.name=="Build & Test" or .name=="Common JS") | "\(.id)\t\(.name)\t\(.status)\t\(.conclusion // "-")"' | sort -t$'\t' -k2,2 -k1,1nr | awk -F'\t' '!seen[$2]++' | while IFS=$'\t' read run name st concl; do
  if [ "$st" != "completed" ]; then echo "#$n [$name run $run] still $st -> cannot rerun yet"; continue; fi
  case "$concl" in failure|cancelled|timed_out) gh run rerun $run --failed --repo $R >/dev/null 2>&1 && echo "#$n [$name run $run] rerun --failed requested" || echo "#$n [$name run $run] rerun FAILED";;
    *) echo "#$n [$name run $run] $concl, nothing to rerun";; esac
done
EOF2
chmod +x $S/hardenok.sh $S/rerun.sh
$S/rerun.sh N          # guarded re-run; prints why when it refuses
gh pr comment N --repo $R --body "@dependabot rebase"   # PR head older than main's last CI-affecting change
```

- `gh run rerun --failed` works for you on this repo (write access); it only works on completed runs and re-runs
  failed **and** cancelled jobs.
- A PR whose head is weeks old (e.g. opened before the Solo bump) should be rebased, not re-run: a re-run
  reuses the old workflow snapshot.
- Dependabot auto-rebases a PR that becomes CONFLICTING after a merge (new head, fresh CI, Harden-Runner
  restarts). It stops managing a branch once a human pushed to it.
- Each re-run or rebase costs a full CI cycle (30-60 min on the shared runners); expect to loop. `Test using Node 22`
  needs the large runner and queues behind every other PR and main push, so a wave of 20 rebased PRs takes hours.
- GitHub connectivity can stall: a `git fetch` hung for 15 min mid-batch and `gh` returned `connection reset by
  peer`. Wrap fetches in `timeout 180` with `GIT_SSH_COMMAND="ssh -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3"`
  and run merge batches in the background so a stall does not block you.

### 4. Pre-merge lockfile safety check (do this for every merge)

Merging several bot PRs that each touch `pnpm-lock.yaml` can produce a lockfile that git merges cleanly but
pnpm cannot parse (duplicate `pkg@ver:` keys), after which CI silently re-resolves everything. Simulate the
squash merge against the **current** `origin/main` and verify the lockfile before every merge:

```bash
cat > $S/lockdups.py <<'EOF'
import sys, collections
section=None; seen=collections.defaultdict(collections.Counter)
for line in open(sys.argv[1]):
    if not line.strip() or line.lstrip().startswith("#"): continue
    indent=len(line)-len(line.lstrip(" "))
    if indent==0 and line.rstrip().endswith(":"): section=line.strip()[:-1]; continue
    if indent==2 and section in ("packages","snapshots","importers") and line.rstrip().endswith(":"): seen[section][line.strip()[:-1]]+=1
bad=[(s,k,c) for s,ctr in seen.items() for k,c in ctr.items() if c>1]
for s,k,c in bad: print(f"DUPLICATE in {s}: {k} x{c}")
print("OK: no duplicate keys" if not bad else f"FOUND {len(bad)} duplicate key(s)"); sys.exit(1 if bad else 0)
EOF
cat > $S/simmerge.sh <<'EOF'
#!/bin/bash
R=hiero-ledger/hiero-sdk-js; S=$(dirname "$0"); n=$1; REPO=$(git rev-parse --show-toplevel); WT=$S/wt-$n
export GIT_SSH_COMMAND="ssh -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3"
cd $REPO && timeout 180 git fetch -q origin main "+pull/$n/head:refs/simmerge/pr-$n" || exit 2
git worktree remove --force "$WT" 2>/dev/null; git worktree add -q --detach "$WT" origin/main || exit 2
cd "$WT"
if ! git merge -q --no-commit --no-ff "refs/simmerge/pr-$n" >/dev/null 2>&1; then echo "#$n CONFLICTS with origin/main: $(git diff --name-only --diff-filter=U | tr '\n' ' ')"; git merge --abort; cd $REPO; git worktree remove --force "$WT"; exit 1; fi
echo "#$n merges cleanly onto origin/main ($(git rev-parse --short origin/main)); changed: $(git diff --cached --name-only | tr '\n' ' ')"
if git diff --cached --name-only | grep -q '^pnpm-lock.yaml$'; then
  python3 $S/lockdups.py pnpm-lock.yaml || { cd $REPO; git worktree remove --force "$WT"; exit 1; }
  cp pnpm-lock.yaml /tmp/simmerge-$n.before.yaml
  npx --yes pnpm@9.15.5 install --lockfile-only --config.confirmModulesPurge=false --ignore-scripts >/tmp/simmerge-$n.pnpm.out 2>&1 || { echo "pnpm failed:"; tail -5 /tmp/simmerge-$n.pnpm.out; }
  if diff -q /tmp/simmerge-$n.before.yaml pnpm-lock.yaml >/dev/null; then echo "#$n LOCKFILE CONSISTENT after merge (pnpm@9.15.5 no-op)"; rc=0; else echo "#$n LOCKFILE INCONSISTENT after merge: $(diff /tmp/simmerge-$n.before.yaml pnpm-lock.yaml | grep -cE '^[<>]') lines would change"; rc=1; fi
else echo "#$n does not touch pnpm-lock.yaml"; rc=0; fi
cd $REPO; git worktree remove --force "$WT"; exit $rc
EOF
chmod +x $S/simmerge.sh
```

- `pnpm@9.15.5` is CI's exact pnpm (`.github/workflows/build.yml`); `--lockfile-only` never touches
  `node_modules`. A consistent lockfile returns in ~1-2 s with zero diff; a slow run with a diff means pnpm
  re-resolved (stale or corrupt lockfile) and the PR must be rebased first.
- Baseline `origin/main` first (`simmerge` on any PR prints the main SHA; run the two checks directly on main
  if in doubt). On 2026-10-01 main was clean: 0 duplicates, no-op.
- A CONFLICTS result means the PR needs `@dependabot rebase` (the PR list will show it as CONFLICTING shortly).

### 5. Approve and squash-merge, one PR at a time

```bash
cat > $S/mergepr.sh <<'EOF'
#!/bin/bash
# usage: mergepr.sh <pr>  -> scope guard, re-check required checks, simulate the merge (lockfile health), approve, squash-merge, verify
R=hiero-ledger/hiero-sdk-js
S=$(dirname "$0")
n=$1; T="timeout 120"
$T gh pr view $n --repo $R --json author,files -q 'if .author.login != "app/dependabot" then "NOT DEPENDABOT" elif ([.files[].path] | any(test("\\.ya?ml$") and (test("^pnpm-lock\\.yaml$") | not))) then "TOUCHES YML" else "ok" end' | grep -q '^ok$' || { echo "#$n OUT OF SCOPE (not Dependabot, or touches a workflow yml)"; exit 1; }
line=$($T $S/reqstatus.sh $n); verdict=$(echo "$line" | cut -f2)
[ "$verdict" != "ALL-REQUIRED-GREEN" ] && { echo "#$n NOT GREEN ($verdict): $(echo "$line" | cut -f6)"; exit 1; }
sim=$($S/simmerge.sh $n 2>&1); rc=$?; echo "$sim" | grep -E '^#'
[ $rc -ne 0 ] && { echo "#$n simulation NOT clean (rc=$rc), skipping merge"; exit 1; }
$T gh pr review $n --repo $R --approve >/dev/null 2>&1 && echo "#$n approved" || { echo "#$n approve FAILED"; exit 1; }
out=$($T gh pr merge $n --repo $R --squash 2>&1) || echo "#$n merge call returned an error (may still have merged): $(echo "$out" | tail -1 | cut -c1-120)"
sleep 5
$T gh pr view $n --repo $R --json state,mergeCommit,mergedAt -q '"#'$n' \(.state) \(.mergeCommit.oid[0:8] // "") at \(.mergedAt // "")"'
cd "$(git rev-parse --show-toplevel)" && GIT_SSH_COMMAND="ssh -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3" timeout 180 git fetch -q origin main || echo "(fetch timed out, continuing)"
EOF
chmod +x $S/mergepr.sh
$S/mergepr.sh N
```

- `mergepr.sh` refuses non-Dependabot PRs and PRs touching a `.yml`/`.yaml` other than `pnpm-lock.yaml`.
- Every `gh` call in the helper is wrapped in `timeout 120`: on 2026-10-01 a bare `gh` call stalled a batch for two
  hours, and `gh pr merge` can return `connection reset by peer` although the merge went through, so the helper
  always re-reads the PR state afterwards instead of trusting the exit code.
- Merge sequentially and re-simulate after each merge (`mergepr.sh` does both); main moves under you.
- After every merge, sibling PRs that edit neighbouring lines of the same `package.json` turn CONFLICTING and
  Dependabot rebases them; their CI starts over. Merge the PRs that touch distinct manifests first.
- Non-required red checks (DAB, examples, codecov, Snyk) do not block; mention a PR-specific `security/snyk`
  failure in the report (the Snyk page needs a Snyk login, it cannot be read from the CLI).
- `reviewDecision` must flip to `APPROVED` after your review; if it stays `REVIEW_REQUIRED` the files need a
  different code owner (workflow files).

### 6. Special cases

- **GitHub Actions bumps** are out of scope (see the scope rule). For the record: `/.github/workflows/` is owned by
  github-maintainers, `gh api -X PUT repos/$R/pulls/N/update-branch` fails on workflow files with
  `without workflow scope` (the gh OAuth token lacks `workflow`), and hiero-solo-action was already at v0.25.0
  while #4317 still proposed 0.23.0.
- **Snyk PRs** are out of scope. For the record: `snyk-fix-*` branches fail DCO (no sign-off) and the title check
  and never carry the lockfile; Dependabot usually opens the same bump (e.g. #4444 chromedriver 151.0.5 vs
  Dependabot #4422 chromedriver 154), so they end up superseded. Leave them to their owners.
- **Human commits on a bot branch** (e.g. `Merge branch 'main' into dependabot/...`): Dependabot no longer
  rebases or retargets that PR, so it will never move to a newer version by itself.
- `gh pr view --json statusCheckRollup` can list the same check twice (old + new attempt); always take the
  latest by timestamp, as `reqstatus.sh` does. `mergeable` is `UNKNOWN` for a minute after main changes.

### 7. Report

List: merged PRs (number, bump, merge SHA), PRs still in CI, re-runs/rebases triggered, real failures with
their one-line cause, and the out-of-scope PRs (workflow bumps for the github-maintainers, Snyk, human-modified
branches). Keep it short. Update the "Findings log" below with anything new.

## Findings log

- 2026-10-01/02 sweep (23 Dependabot npm PRs merged, lockfile verified clean before each merge and on main
  afterwards): #4413 undici, #4418 geckodriver 7, #4431 @vitest/browser 5.0.2, #4427 jest-dom 7, #4442
  brace-expansion (tck), #4441 @grpc/grpc-js, #4443 axios, #4277 c8 12, #4416 eslint-plugin-jsdoc 64, #4425/#4433/
  #4434/#4420/#4439/#4424/#4414/#4429 expo 58 family, #4445 next 16.3.6, #4421 dotenv 18, #4403 ip-address,
  #4422 chromedriver 154, #4419 replace-in-file 9, #4428 react-native-dotenv 5.
- Real breakages left open: #4430 eslint 10, #4432 @typescript-eslint/eslint-plugin 8, #4426 mocha 12, and the
  vitest 5 family #4417 / #4423 / #4437 (needs `vitest` itself bumped in the same PR; Dependabot cannot group it
  without a `groups:` entry in `.github/dependabot.yml`, worth adding for `@vitest/*` + `vitest`).
- Flakes met (all re-ran green): Mocker EADDRINUSE x4, AccountBalanceDeprecation 1 ms deadline x3, Jumbo
  transaction timeout x2, HIP-1300 chromium TypeError x2, PrivateKey random-key DER x1, High-Volume Throttle
  timeout x1, cancelled Test jobs x3. Budget two or three re-runs per PR on a busy day.
- Scope rules learned mid-sweep: Dependabot only, no workflow `.yml` (the three GitHub Actions bumps were
  approved by mistake and the approvals dismissed), re-run only after `StepSecurity Harden-Runner` is
  completed/success. Snyk PRs #4292 (superseded by #4430), #4293 (react-native 0.85, conflicting) and #4444
  (superseded by #4422) were left untouched.
- Environment: every bot merge queues a full main run; the large runner backlog reached 24 queued Build & Test
  runs, so a PR needed 1-3 h per CI cycle and the sweep ran ~21 h wall clock. GitHub API/SSH resets were frequent
  from the operator's machine, hence the `timeout` wrappers and background batches.
- StepSecurity "NPM Package Cooldown" blocked #4415 for a day (expo-server 58.0.2 published < 2 days earlier).
