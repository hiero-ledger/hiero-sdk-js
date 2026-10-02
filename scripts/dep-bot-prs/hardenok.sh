#!/usr/bin/env bash
# usage: hardenok.sh <pr>
# Prints "#N head=<sha> Harden-Runner: <status>/<conclusion> <title>" for the newest StepSecurity Harden-Runner check
# run on the PR head. Exit 0 only when it is completed/success (team rule 2026-10-01: no re-run before that).
# Harden-Runner stays in_progress until every monitored workflow run for the head has finished.
set -uo pipefail
# shellcheck source=scripts/dep-bot-prs/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

[ $# -eq 1 ] || { echo "usage: $0 <pr>" >&2; exit 2; }
n=$1
sha=$(pr_head "$n") || { echo "#$n gh pr view failed"; exit 2; }
res=$(T 120 gh api "repos/$R/commits/$sha/check-runs?check_name=StepSecurity%20Harden-Runner&per_page=50" |
    jq -r '[.check_runs[]] | sort_by(.id) | last | if . == null then "absent/-" else "\(.status)/\(.conclusion // "-") \(.output.title // "")" end') || { echo "#$n check-runs query failed"; exit 2; }
echo "#$n head=${sha:0:8} Harden-Runner: $res"
[ "${res%% *}" = "completed/success" ]
