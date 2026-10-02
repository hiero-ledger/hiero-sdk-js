#!/usr/bin/env bash
# usage: rerun.sh <pr> [<job-id> ...]
# Re-run jobs of the PR head's newest "Build & Test" / "Common JS" runs one job at a time (gh run rerun --job), so
# real breakages and the non-required DAB / examples jobs do not go back on the shared runners.
#   - with no job ids: classify.sh picks them; only FLAKE, INFRA and CANCELLED required jobs are re-run,
#     REAL and UNKNOWN jobs are listed and left alone (classify UNKNOWN by hand, then pass the job id explicitly)
#   - with job ids (the third field of a classify.sh line): re-run exactly those
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
# rerun_job <job-id> <run-id or ""> <why>
rerun_job() {
    local jid=$1 run=$2 why=$3 st
    [ -n "$run" ] || run=$(T 60 gh api "repos/$R/actions/jobs/$jid" --jq .run_id 2>/dev/null)
    st=$(run_status "$run")
    if [ "$st" != completed ]; then
        echo "#$n job $jid: run $run is ${st:-not a run of this head}, cannot re-run yet ($why)"
        return 1
    fi
    if [ "${DRY_RUN:-0}" = 1 ]; then
        echo "#$n DRY-RUN would run: gh run rerun --job $jid --repo $R ($why)"
        return 0
    fi
    if T 120 gh run rerun --job "$jid" --repo "$R" >/dev/null 2>&1; then
        echo "#$n job $jid re-run requested ($why)"
    else
        echo "#$n job $jid re-run FAILED ($why)"
        return 1
    fi
}

rc=0
if [ $# -gt 0 ]; then
    for jid in "$@"; do rerun_job "$jid" "" "job id given on the command line" || rc=1; done
    exit $rc
fi
cls=$(mktemp "${TMPDIR:-/tmp}/dep-bot-prs-classify.XXXXXX")
trap 'rm -f "$cls"' EXIT
"$HERE/classify.sh" "$n" >"$cls"
[ -s "$cls" ] || { echo "#$n no failed, cancelled or running required job on head ${sha:0:8}; nothing to re-run"; exit 0; }
while IFS=$'\t' read -r _ run jid class detail; do
    case "$class" in
        FLAKE | INFRA | CANCELLED) rerun_job "$jid" "$run" "$class: $detail" || rc=1 ;;
        RUNNING) echo "#$n job $jid still running: $detail" ;;
        REAL) echo "#$n job $jid REAL, not re-running: $detail" ;;
        *) echo "#$n job $jid $class, not re-running: $detail (classify it by hand, then: rerun.sh $n $jid)" ;;
    esac
done < <(grep '^#' "$cls")
exit $rc
