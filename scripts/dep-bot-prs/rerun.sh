#!/usr/bin/env bash
# usage: rerun.sh <pr> [<job-id> ...]
# Re-run jobs of the PR head's newest "Build & Test" / "Common JS" runs, so real breakages and the non-required
# DAB / examples jobs do not go back on the shared runners.
#   - with no job ids: classify.sh picks them; only FLAKE, INFRA and CANCELLED required jobs are re-run, and only in
#     a run with no REAL or UNKNOWN required job: the PR stays red anyway, and neither matrix turns fail-fast off,
#     so a job cancelled next to a REAL failure fails the same way. REAL and UNKNOWN jobs are listed and left alone
#     (classify UNKNOWN by hand, then pass the job id explicitly)
#   - with job ids (the third field of a classify.sh line): re-run exactly those
# One re-run call per run, because GitHub refuses a second re-run while the first is in progress: one job gets
# `gh run rerun --job`, several jobs of one run get `gh run rerun <run> --failed`, which also re-runs any
# non-required failed job of that run.
# Refuses to re-run anything unless the StepSecurity Harden-Runner check on that head is completed/success.
# A run that is still in progress cannot be re-run; the script says so and you try again later.
# DRY_RUN=1 prints what would be re-run instead of doing it.
set -uo pipefail
# shellcheck source=scripts/dep-bot-prs/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

[ $# -ge 1 ] || { echo "usage: $0 <pr> [<job-id> ...]" >&2; exit 2; }
n=$1
shift
"$HERE/hardenok.sh" "$n" || { echo "#$n Harden-Runner not passed -> NOT re-running (wait if in_progress, report if failure)"; exit 1; }
sha=$(pr_head "$n") || exit 2
runs=$(latest_runs "$sha")

run_status() { awk -F '\t' -v r="$1" '$1 == r { print $3 }' <<<"$runs"; }
# one "run_id<TAB>job_id<TAB>why" line per job to re-run
plan=""
# rerun_run <run-id>: one re-run call for every planned job of that run
rerun_run() {
    local run=$1 jobs why st
    jobs=$(awk -F '\t' -v r="$run" '$1 == r { printf "%s%s", sep, $2; sep = " " }' <<<"$plan")
    why=$(awk -F '\t' -v r="$run" '$1 == r && !seen[$3]++ { printf "%s%s", sep, $3; sep = "; " }' <<<"$plan")
    st=$(run_status "$run")
    if [ "$st" != completed ]; then
        echo "#$n job $jobs: run $run is ${st:-not a run of this head}, cannot re-run yet ($why)"
        return 1
    fi
    if [[ "$jobs" == *" "* ]]; then
        set -- run rerun "$run" --failed --repo "$R"
    else
        set -- run rerun --job "$jobs" --repo "$R"
    fi
    if [ "${DRY_RUN:-0}" = 1 ]; then
        echo "#$n DRY-RUN would run: gh $* ($why)"
        return 0
    fi
    if T 120 gh "$@" >/dev/null 2>&1; then
        echo "#$n job $jobs re-run requested: gh $* ($why)"
    else
        echo "#$n job $jobs re-run FAILED: gh $* ($why)"
        return 1
    fi
}

rc=0
if [ $# -gt 0 ]; then
    for jid in "$@"; do
        run=$(T 60 gh api "repos/$R/actions/jobs/$jid" --jq .run_id 2>/dev/null) || run=""
        if [ -z "$run" ]; then
            echo "#$n job $jid: could not look up its run"
            rc=1
            continue
        fi
        plan+="$run	$jid	job id given on the command line"$'\n'
    done
else
    cls=$(mktemp "${TMPDIR:-/tmp}/dep-bot-prs-classify.XXXXXX")
    trap 'rm -f "$cls"' EXIT
    "$HERE/classify.sh" "$n" >"$cls"
    [ -s "$cls" ] || { echo "#$n no failed, cancelled or running required job on head ${sha:0:8}; nothing to re-run"; exit 0; }
    blocked=$(awk -F '\t' '/^#/ && ($4 == "REAL" || $4 == "UNKNOWN") { print $2 }' "$cls")
    while IFS=$'\t' read -r _ run jid class detail; do
        case "$class" in
            FLAKE | INFRA | CANCELLED)
                if grep -qxF "$run" <<<"$blocked"; then
                    echo "#$n job $jid $class, not re-running: run $run also has a REAL or UNKNOWN job ($detail)"
                else
                    plan+="$run	$jid	$class: $detail"$'\n'
                fi
                ;;
            RUNNING) echo "#$n job $jid still running: $detail" ;;
            REAL) echo "#$n job $jid REAL, not re-running: $detail" ;;
            *) echo "#$n job $jid $class, not re-running: $detail (classify it by hand, then: rerun.sh $n $jid)" ;;
        esac
    done < <(grep '^#' "$cls")
fi
while read -r run; do
    rerun_run "$run" || rc=1
done < <(cut -f1 <<<"$plan" | awk 'NF && !seen[$0]++')
exit $rc
