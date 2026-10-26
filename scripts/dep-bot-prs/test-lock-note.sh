#!/usr/bin/env bash
# usage: test-lock-note.sh
# Offline test of LOCK_JQ_DEF (common.sh), the NO-LOCKFILE note of list-prs.sh, on a fixed list of PRs: every PR
# must get exactly one line, with the expected note. Needs jq only, no GitHub access. Exit 0 pass, 1 fail.
set -uo pipefail
# shellcheck source=scripts/dep-bot-prs/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Titles as Dependabot writes them (#4576, #4577, the groups from #4586).
fixture='[
  {"number": 1, "title": "chore(deps-dev): bump the vitest-security group across 1 directory with 2 updates",
   "files": [{"path": "packages/cryptography/package.json"}]},
  {"number": 2, "title": "chore(deps-dev): bump @vitest/browser from 5.0.4 to 5.0.5 in /packages/cryptography",
   "files": [{"path": "packages/cryptography/package.json"}]},
  {"number": 3, "title": "chore(deps-dev): bump @vitest/browser from 5.0.4 to 5.0.5",
   "files": [{"path": "package.json"}, {"path": "packages/cryptography/package.json"}, {"path": "pnpm-lock.yaml"}]},
  {"number": 4, "title": "chore(deps-dev): bump the typescript-eslint group with 2 updates",
   "files": [{"path": "package.json"}, {"path": "pnpm-lock.yaml"}]},
  {"number": 5, "title": "chore(deps): bump next from 16.3.7 to 16.3.8 in /examples/frontend-examples",
   "files": [{"path": "examples/frontend-examples/package.json"}]},
  {"number": 6, "title": "chore(deps): bump step-security/harden-runner from 2.22.1 to 2.22.2",
   "files": [{"path": ".github/workflows/build.yml"}]}
]'

expected=$(printf '%s\n' \
    "#1	NO-LOCKFILE: no open PR with the same bump and the lockfile" \
    "#2	NO-LOCKFILE: superseded by #3" \
    "#3" \
    "#4" \
    "#5	NO-LOCKFILE: no open PR with the same bump and the lockfile" \
    "#6")

actual=$(jq -r "$LOCK_JQ_DEF"' . as $all | .[] | "#\(.number)\(lock_note($all))"' <<<"$fixture") || {
    echo "FAIL: jq error"
    exit 1
}
if [ "$actual" = "$expected" ]; then
    echo "PASS: lock_note, $(wc -l <<<"$expected" | tr -d ' ') PRs"
else
    echo "FAIL: lock_note (- expected, + actual)"
    diff <(echo "$expected") <(echo "$actual")
    exit 1
fi
