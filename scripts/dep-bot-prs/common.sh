#!/usr/bin/env bash
# Shared settings for the /dep-bot-prs helper scripts (see .claude/commands/dep-bot-prs.md).
# Source it from the sibling scripts; it is not meant to be run on its own.
# Compatible with bash 3.2 (macOS default): no associative arrays, no mapfile.
# shellcheck shell=bash
# shellcheck disable=SC2034 # REPO and SCOPE_JQ_DEF are used by the scripts that source this file

R="${DEP_BOT_PRS_REPO:-hiero-ledger/hiero-sdk-js}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)" # the checkout these scripts live in, independent of the caller's cwd

# Required checks on main (org + repo rulesets: gh api repos/$R/rules/branches/main). Keep in sync with the command file.
REQUIRED_CHECKS=(
    "DCO"
    "StepSecurity Required Checks"
    "Build using Node 22"
    "Build using Node 24"
    "Test using Node 22"
    "Integration Tests on Node 22"
    "Integration Tests on Node 24"
)
# Workflow runs whose jobs are required checks; classify.sh and rerun.sh only look at these.
REQUIRED_WORKFLOWS=("Build & Test" "Common JS")

# JSON array of the required check names, for jq --argjson.
req_json() { printf '%s\n' "${REQUIRED_CHECKS[@]}" | jq -R . | jq -s -c .; }
# JSON array of the required workflow names, for jq --argjson.
wf_json() { printf '%s\n' "${REQUIRED_WORKFLOWS[@]}" | jq -R . | jq -s -c .; }
# ERE that matches exactly one required check name.
req_regex() {
    local IFS='|'
    printf '^(%s)$' "${REQUIRED_CHECKS[*]}"
}

# jq function `scope`: on an object with .author/.files/.commits (gh pr view|list --json author,files,commits)
# prints "ok" or the comma-separated reasons the PR is out of scope for this sweep:
#   NOT-DEPENDABOT         author is not app/dependabot (Snyk, Renovate, humans)
#   TOUCHES-.github/       a changed file is under .github/ (workflow bumps; CODEOWNERS gives /.github/ to github-maintainers)
#   HUMAN-COMMITS          a commit on the branch is not authored by dependabot[bot] (nobody reviewed that code)
#   NO-COMMIT-AUTHOR-INFO  the commit list is empty or an author could not be resolved (fail closed)
# shellcheck disable=SC2016 # single quotes on purpose, this is a jq program
SCOPE_JQ_DEF='def scope_reasons:
  if .author.login != "app/dependabot" then ["NOT-DEPENDABOT"] else
  [ (if ([.files[].path] | any(startswith(".github/"))) then "TOUCHES-.github/" else empty end),
    (if ((.commits | length) == 0) or ([.commits[] | (.authors | length) == 0] | any) then "NO-COMMIT-AUTHOR-INFO"
     elif ([.commits[].authors[].login] | any(. != "dependabot[bot]")) then "HUMAN-COMMITS" else empty end) ] end;
def scope: scope_reasons | if length == 0 then "ok" else join(",") end;'

# T <seconds> <command...>: run a command under a time limit. `timeout` is GNU coreutils; macOS ships neither it
# nor `gtimeout` by default (brew install coreutils). Without both, the command runs unbounded and we say so once.
if command -v timeout >/dev/null 2>&1; then
    _TIMEOUT=timeout
elif command -v gtimeout >/dev/null 2>&1; then
    _TIMEOUT=gtimeout
else
    _TIMEOUT=""
    if [ -z "${DEP_BOT_PRS_TIMEOUT_WARNED:-}" ]; then
        echo "warning: neither timeout nor gtimeout found (brew install coreutils); gh and git calls run unbounded" >&2
        export DEP_BOT_PRS_TIMEOUT_WARNED=1
    fi
fi
T() {
    local secs=$1
    shift
    if [ -n "$_TIMEOUT" ]; then "$_TIMEOUT" "$secs" "$@"; else "$@"; fi
}

# pr_head <pr>: full head SHA of the PR.
pr_head() { T 60 gh pr view "$1" --repo "$R" --json headRefOid -q .headRefOid; }

# latest_runs <sha>: the newest run (highest id) of each required workflow for that head, one per line:
#   run_id<TAB>workflow_name<TAB>status<TAB>conclusion<TAB>run_attempt
latest_runs() {
    # gh api --jq takes no --argjson, so the workflow list is inlined as a JSON array literal
    T 120 gh api "repos/$R/actions/runs?head_sha=$1&per_page=50" \
        --jq ".workflow_runs[] | select(.name | IN($(wf_json)[])) | \"\\(.id)\\t\\(.name)\\t\\(.status)\\t\\(.conclusion // \"-\")\\t\\(.run_attempt)\"" |
        sort -t "$(printf '\t')" -k2,2 -k1,1nr | awk -F '\t' '!seen[$2]++'
}
