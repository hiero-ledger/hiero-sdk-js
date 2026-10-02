#!/usr/bin/env bash
# usage: classify.sh <pr>
# For every REQUIRED job that is not green in the PR head's newest "Build & Test" / "Common JS" runs, print one
# tab-separated line:
#   #N<TAB>run_id<TAB>job_id<TAB>CLASS<TAB>workflow attempt A / job name: detail
# CLASS  REAL       the bump broke something: report it, never re-run
#        FLAKE      known flaky test: re-run
#        INFRA      Solo / runner infrastructure problem: re-run
#        CANCELLED  the job was cancelled (hung sibling, manual cancel), it did not run: re-run
#        RUNNING    the job has not finished
#        UNKNOWN    no known signature; the first error lines of the log follow, indented, so you can decide
# REAL signatures are checked first: a log that has both a real error and a known flake is REAL.
# rerun.sh consumes these lines and only re-runs FLAKE, INFRA and CANCELLED jobs.
# Logs are 5-6k lines and the API is slow; run several PRs in the background.
set -uo pipefail
# shellcheck source=scripts/dep-bot-prs/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

[ $# -eq 1 ] || { echo "usage: $0 <pr>" >&2; exit 2; }
n=$1
sha=$(pr_head "$n") || { echo "#$n	-	-	ERROR	gh pr view failed"; exit 2; }
req_re=$(req_regex)
log=$(mktemp "${TMPDIR:-/tmp}/dep-bot-prs-log.XXXXXX")
trap 'rm -f "$log"' EXIT

class=UNKNOWN
detail=""
# match <CLASS> <detail> <grep options and pattern>: first match wins
match() {
    [ "$class" = UNKNOWN ] || return 0
    local c=$1 d=$2
    shift 2
    if grep -q "$@" "$log"; then
        class=$c
        detail=$d
    fi
}
classify_log() {
    class=UNKNOWN
    detail=""
    # REAL breakages first (seen 2026-10-01); re-running does not help
    match REAL "vitest 5 family: coverage/browser provider mismatch, needs vitest itself bumped too" -F 'does not support command "__vitest_'
    match REAL "vitest 5 family: @vitest/browser-playwright 5 needs vitest 5" -F "does not provide an export named 'BrowserConnectionError'"
    match REAL "vitest 5 family: @vitest/coverage-istanbul 5 needs vitest 5" -F 'coverageFilesDirectory is required'
    match REAL "eslint 10: a plugin crashes with 'Class extends value undefined'" -F 'Class extends value undefined'
    match REAL "ESM-only dependency required from CommonJS (mocha 12)" -F 'ERR_REQUIRE_ESM'
    match REAL "new lint errors from @typescript-eslint" -E 'error .*@typescript-eslint/'
    # known flakes and infrastructure problems; re-run
    match FLAKE "Mocker fixed-port collision (EADDRINUSE) between parallel vitest workers" -F 'EADDRINUSE'
    match FLAKE "Jumbo transaction integration test timed out" -F '× Jumbo transaction'
    match FLAKE "AccountBalanceDeprecation 1 ms deadline assertion (4320 vs 4321)" -F 'expected 4320 to equal 4321'
    match FLAKE "PrivateKey.isDerKey on a random raw key (test-design flake)" -F 'should return false if the key is not a DER key'
    match FLAKE "HIP-1300 chromium integration test (TypeError reading toString)" -F 'HIP-1300 > should not create a transaction with more than 6kbs'
    match INFRA "SoloError during Solo bring-up" -F 'SoloError'
    match INFRA "no applicable address book (Solo not ready)" -F 'no applicable address book'
    if [ "$class" = UNKNOWN ] && grep -E ' FAIL +(chromium|node)? *test/integration/' -A1 "$log" | grep -q 'timeout exceeded'; then
        class=FLAKE
        detail="integration test timed out against Solo"
    fi
}

latest_runs "$sha" | while IFS=$'\t' read -r run name _ _ att; do
    T 120 gh api "repos/$R/actions/runs/$run/jobs?per_page=50" --jq '.jobs[] | "\(.id)\t\(.name)\t\(.status)\t\(.conclusion // "-")"' |
        while IFS=$'\t' read -r jid jname jst jconcl; do
            [[ "$jname" =~ $req_re ]] || continue
            [ "$jconcl" = success ] && continue
            where="$name attempt $att / $jname"
            if [ "$jst" != completed ]; then
                printf '#%s\t%s\t%s\tRUNNING\t%s: %s\n' "$n" "$run" "$jid" "$where" "$jst"
                continue
            fi
            if [ "$jconcl" = cancelled ]; then
                printf '#%s\t%s\t%s\tCANCELLED\t%s: cancelled, did not run\n' "$n" "$run" "$jid" "$where"
                continue
            fi
            if ! T 300 gh api "repos/$R/actions/jobs/$jid/logs" 2>/dev/null | sed -E 's/\x1b\[[0-9;]*m//g' >"$log"; then
                printf '#%s\t%s\t%s\tUNKNOWN\t%s: %s, log could not be fetched\n' "$n" "$run" "$jid" "$where" "$jconcl"
                continue
            fi
            classify_log
            [ "$class" = UNKNOWN ] && detail="$jconcl, no known signature"
            printf '#%s\t%s\t%s\t%s\t%s: %s\n' "$n" "$run" "$jid" "$class" "$where" "$detail"
            if [ "$class" = UNKNOWN ]; then
                grep -nE '##\[error\]|Error:|FAIL ' "$log" | grep -vE 'deprecated|Python script|DER format' | head -6 | cut -c1-220 | sed 's/^/    /'
            fi
        done
done
