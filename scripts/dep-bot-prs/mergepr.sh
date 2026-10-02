#!/usr/bin/env bash
# usage: mergepr.sh <pr>
# Approve and squash-merge ONE Dependabot PR, after every gate passed for ONE head SHA:
#   1. scope (common.sh `scope`): author app/dependabot, no file under .github/, every commit by dependabot[bot]
#   2. reqstatus.sh: ALL-REQUIRED-GREEN, and the head it looked at is the SHA from step 1
#   3. simmerge.sh: that SHA is still the PR head, merges cleanly onto current main, lockfile healthy
#   4. approve through the reviews API with commit_id=<sha>, merge with --match-head-commit <sha>, re-read the PR
# If GitHub refuses the merge because the head moved, the approval just given is dismissed again.
# Every gh call runs under a time limit (T); the merge result is re-read instead of trusting the exit code.
# DRY_RUN=1 runs the gates and stops before approving.
set -uo pipefail
# shellcheck source=scripts/dep-bot-prs/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

[ $# -eq 1 ] || { echo "usage: $0 <pr>" >&2; exit 2; }
n=$1

info=$(T 120 gh pr view "$n" --repo "$R" --json author,files,commits,headRefOid,title) || { echo "#$n gh pr view failed"; exit 1; }
sha=$(jq -r .headRefOid <<<"$info")
scope=$(jq -r "$SCOPE_JQ_DEF scope" <<<"$info")
[ "$scope" = ok ] || { echo "#$n OUT OF SCOPE ($scope), not touching it"; exit 1; }

line=$(T 180 "$HERE/reqstatus.sh" "$n") || { echo "#$n reqstatus failed: $line"; exit 1; }
verdict=$(cut -f2 <<<"$line")
checked=$(cut -f5 <<<"$line")
[ "$verdict" = ALL-REQUIRED-GREEN ] || { echo "#$n NOT GREEN ($verdict): $(cut -f6 <<<"$line")"; exit 1; }
[ "$checked" = "$sha" ] || { echo "#$n HEAD MOVED while checking (${sha:0:8} -> ${checked:0:8}), run again"; exit 1; }

"$HERE/simmerge.sh" "$n" "$sha" | grep '^#'
rc=${PIPESTATUS[0]}
[ "$rc" -eq 0 ] || { echo "#$n simulation NOT clean (exit $rc), skipping merge"; exit 1; }

if [ "${DRY_RUN:-0}" = 1 ]; then
    echo "#$n DRY-RUN: all gates passed for head ${sha:0:8}; would approve (commit_id=$sha) and squash-merge (--match-head-commit $sha)"
    exit 0
fi

review=$(T 120 gh api -X POST "repos/$R/pulls/$n/reviews" -f event=APPROVE -f commit_id="$sha" --jq .id 2>&1) || { echo "#$n approve FAILED: $(tail -1 <<<"$review" | cut -c1-160)"; exit 1; }
echo "#$n approved head ${sha:0:8} (review $review)"
if ! out=$(T 120 gh pr merge "$n" --repo "$R" --squash --match-head-commit "$sha" 2>&1); then
    echo "#$n merge call returned an error (may still have merged): $(tail -1 <<<"$out" | cut -c1-160)"
    if grep -qiE 'head branch was modified|match.?head' <<<"$out"; then
        T 120 gh api -X PUT "repos/$R/pulls/$n/reviews/$review/dismissals" -f message="PR head changed after the checks ran" >/dev/null 2>&1 &&
            echo "#$n head moved after the checks, approval $review dismissed again"
    fi
fi
sleep 5
T 120 gh pr view "$n" --repo "$R" --json state,mergeCommit,mergedAt -q "\"#$n \(.state) \(.mergeCommit.oid[0:8] // \"not merged\") \(.mergedAt // \"\")\""
