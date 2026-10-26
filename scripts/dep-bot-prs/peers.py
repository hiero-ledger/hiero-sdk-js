#!/usr/bin/env python3
"""Report the peer dependency issues a merge adds, from two `pnpm install --resolution-only` outputs.

usage: peers.py <main-output> <merged-output>
exit 0 when the merge adds no peer issue, 1 when it adds one, 2 on usage error

pnpm 9 prints its peer report as one tree per importer:

    packages/cryptography
    ├─┬ @vitest/browser 5.0.5
    │ └── ✕ unmet peer vitest@5.0.5: found 5.0.4
    ✕ Conflicting peer dependencies:
      @expo/metro-runtime

An issue is compared by importer, the package that declares the peer (without its version) and the wanted peer
range, not by the version found: main already has unmet peers (eslint-plugin-import against eslint 10), and a
patch bump of eslint must not count as a new one. A PR that moves one package of an exact-version family
(vitest + @vitest/*, @typescript-eslint/*) adds an issue like the one above; CI stays green, so only this check
sees it.
"""
import re
import sys

TREE = re.compile(r"^((?:│ |  )*)[├└]─[┬─] (.*)$")
ISSUE = re.compile(r"✕ (unmet|missing) peer (.+?)(?:: found (\S+))?$")  # ranges can hold spaces: "^8 || ^9"


def peer_issues(path):
    """{key: printable line} for every peer issue in the pnpm output at path."""
    issues = {}
    with open(path, encoding="utf-8") as fh:
        lines = [line.rstrip("\n") for line in fh]
    try:
        start = next(i for i, line in enumerate(lines) if "Issues with peer dependencies found" in line) + 1
    except StopIteration:
        return issues
    importer = "?"
    parents = []
    conflicting = False
    for line in lines[start:]:
        if not line.strip():
            conflicting = False
            continue
        tree = TREE.match(line)
        if tree:
            depth = len(tree.group(1)) // 2
            text = tree.group(2)
            parents = parents[:depth]
            issue = ISSUE.match(text)
            if issue is None:
                parents.append(text)
                continue
            parent = parents[-1] if parents else "?"
            kind, peer = issue.group(1), issue.group(2).replace('"', "")
            key = f"{importer}: {parent.rsplit(' ', 1)[0]} -> {kind} peer {peer}"
            issues[key] = f"{importer}: {parent} -> {text[2:]}"
        elif line.startswith("✕ Conflicting peer dependencies"):
            conflicting = True
        elif conflicting and line.startswith("  "):
            key = f"{importer}: conflicting peer {line.strip()}"
            issues[key] = key
        elif not line.startswith(" "):
            importer = line.strip()
            parents = []
            conflicting = False
    return issues


def main(argv):
    if len(argv) != 3:
        print(__doc__.strip())
        return 2
    before = peer_issues(argv[1])
    after = peer_issues(argv[2])
    added = sorted(k for k in after if k not in before)
    for key in added:
        print(f"NEW: {after[key]}")
    gone = len([k for k in before if k not in after])
    if added:
        print(f"FOUND {len(added)} new peer issue(s) ({len(before)} on main, {gone} fixed by the merge)")
    else:
        print(f"OK: no new peer issues ({len(before)} on main, {gone} fixed by the merge)")
    return 1 if added else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
