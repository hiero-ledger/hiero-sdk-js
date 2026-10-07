#!/usr/bin/env bash
# usage: simmerge.sh <pr> [<expected-head-sha>]
# Simulates the merge of PR <pr> onto the CURRENT main of $R in a throw-away worktree and, when pnpm-lock.yaml
# changes, checks that the merged lockfile has no duplicate keys (lockdups.py) and that CI's pnpm
# (pnpm@9.15.5 install --lockfile-only) leaves it untouched. Both refs are fetched from https://github.com/$R.git,
# so it does not matter what the local `origin` points to. The worktree lives in a temp dir and is removed on exit.
# exit 0 clean | 1 conflicts, duplicate keys, pnpm failed or lockfile not a no-op | 2 fetch/worktree error
#      3 the fetched PR head is not <expected-head-sha> (the PR moved, check it again)
set -uo pipefail
# shellcheck source=scripts/dep-bot-prs/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

[ $# -ge 1 ] && [ $# -le 2 ] || { echo "usage: $0 <pr> [<expected-head-sha>]" >&2; exit 2; }
n=$1
want=${2:-}
TMP=$(mktemp -d "${TMPDIR:-/tmp}/dep-bot-prs-simmerge.XXXXXX")
WT="$TMP/wt-$n"
MAINREF="refs/dep-bot-prs/main"
PRREF="refs/dep-bot-prs/pr-$n"
# shellcheck disable=SC2329 # invoked through the EXIT trap
cleanup() {
    cd "$REPO" || return
    git -C "$WT" merge --abort >/dev/null 2>&1
    git worktree remove --force "$WT" >/dev/null 2>&1
    git update-ref -d "$MAINREF" >/dev/null 2>&1
    git update-ref -d "$PRREF" >/dev/null 2>&1
    rm -rf "$TMP"
}
trap cleanup EXIT

cd "$REPO" || exit 2
if ! T 180 git fetch -q "https://github.com/$R.git" "+refs/heads/main:$MAINREF" "+refs/pull/$n/head:$PRREF"; then
    echo "#$n fetch of main and pull/$n/head from https://github.com/$R.git failed"
    exit 2
fi
head=$(git rev-parse "$PRREF")
main=$(git rev-parse --short "$MAINREF")
if [ -n "$want" ] && [ "$head" != "$want" ]; then
    echo "#$n HEAD MOVED: fetched ${head:0:8}, expected ${want:0:8}; check the PR again"
    exit 3
fi
git worktree add -q --detach "$WT" "$MAINREF" || { echo "#$n git worktree add failed"; exit 2; }
cd "$WT" || exit 2
if ! git merge -q --no-commit --no-ff "$PRREF" >/dev/null 2>&1; then
    echo "#$n CONFLICTS with main $main: $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
    exit 1
fi
echo "#$n head ${head:0:8} merges cleanly onto main $main; changed: $(git diff --cached --name-only | tr '\n' ' ')"
if ! git diff --cached --name-only | grep -q '^pnpm-lock.yaml$'; then
    echo "#$n does not touch pnpm-lock.yaml"
    exit 0
fi
python3 "$HERE/lockdups.py" pnpm-lock.yaml | sed "s/^/#$n lockfile: /"
[ "${PIPESTATUS[0]}" -eq 0 ] || exit 1
cp pnpm-lock.yaml "$TMP/before.yaml"
T 600 npx --yes pnpm@9.15.5 install --lockfile-only --config.confirmModulesPurge=false --ignore-scripts >"$TMP/pnpm.out" 2>&1
prc=$?
if [ $prc -ne 0 ]; then
    echo "#$n PNPM FAILED (exit $prc), lockfile not verified:"
    tail -5 "$TMP/pnpm.out" | sed "s/^/#$n pnpm: /"
    exit 1
fi
if cmp -s "$TMP/before.yaml" pnpm-lock.yaml; then
    echo "#$n LOCKFILE CONSISTENT after merge (pnpm@9.15.5 no-op)"
    exit 0
fi
echo "#$n LOCKFILE INCONSISTENT after merge: $(diff "$TMP/before.yaml" pnpm-lock.yaml | grep -cE '^[<>]') lines would change; the PR needs a rebase"
exit 1
