#!/usr/bin/env bash
# usage: reqstatus.sh <pr> [<pr> ...]
# One tab-separated line per PR with the state of the REQUIRED checks on its head (see reqstatus.jq for the format).
# Exit 0 when every PR could be read; a PR that gh cannot read prints "#N ERROR ..." and the exit code becomes 1.
set -uo pipefail
# shellcheck source=scripts/dep-bot-prs/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

[ $# -ge 1 ] || { echo "usage: $0 <pr> [<pr> ...]" >&2; exit 2; }
rc=0
for n in "$@"; do
    if ! json=$(T 120 gh pr view "$n" --repo "$R" --json number,title,mergeable,mergeStateStatus,reviewDecision,headRefOid,statusCheckRollup); then
        echo "#$n	ERROR	gh pr view failed"
        rc=1
        continue
    fi
    jq -r --argjson req "$(req_json)" -f "$HERE/reqstatus.jq" <<<"$json" || rc=1
done
exit $rc
