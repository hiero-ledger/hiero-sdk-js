# Input:  gh pr view --json number,title,mergeable,mergeStateStatus,reviewDecision,headRefOid,statusCheckRollup
# $req:   JSON array of the required check names (common.sh req_json)
# Output: one tab-separated line
#   #N  ALL-REQUIRED-GREEN|WAITING|FAILED  mergeable/mergeStateStatus  reviewDecision  headSha  check=state ... [missing=a,b]  title
# ALL-REQUIRED-GREEN needs every required check present AND ok: a check that has not reported yet makes it WAITING,
# one red required check makes it FAILED even while others still run.

# gh prints a missing date as 0001-01-01T00:00:00Z (truthy in jq); treat it as missing.
def ts: if . == null or startswith("0001-") then empty else . end;

. as $p
| [ .statusCheckRollup[]
    | { name: (.name // .context),
        st: (.status // "EXTERNAL"),        # CheckRun.status, or EXTERNAL for a commit status context (DCO, Snyk, ...)
        c: (.conclusion // .state // ""),   # CheckRun.conclusion or StatusContext.state; "" while a check run is running
        t: ([.startedAt, .completedAt] | map(ts) | max // "") } ]
| map(select(.name | IN($req[])))
# the rollup can list several attempts of one check; the newest wins: a running attempt beats a completed one, then by time
| group_by(.name)
| map(sort_by([(if .st == "COMPLETED" or .st == "EXTERNAL" then 0 else 1 end), .t]) | last)
| map(.state = (if (.st != "COMPLETED" and .st != "EXTERNAL") or .c == "PENDING" or .c == "EXPECTED" then "running"
                elif .c == "SUCCESS" then "ok"
                elif .c == "" then "UNKNOWN"
                else .c end))
| . as $present
| ($req - ($present | map(.name))) as $missing
| ($present | map(.state)) as $states
| (if ($states | any(. != "ok" and . != "running")) then "FAILED"
   elif (($missing | length) > 0) or ($states | any(. == "running")) then "WAITING"
   else "ALL-REQUIRED-GREEN" end) as $verdict
| [ "#\($p.number)",
    $verdict,
    "\($p.mergeable)/\($p.mergeStateStatus)",
    $p.reviewDecision,
    $p.headRefOid,
    (($present | map("\(.name)=\(.state)")) + (if ($missing | length) > 0 then ["missing=\($missing | join(","))"] else [] end) | join(" ")),
    $p.title ]
| join("\t")
