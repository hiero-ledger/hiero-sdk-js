#!/usr/bin/env python3
"""Report duplicate keys in the top-level sections of a pnpm-lock.yaml (pnpm v9 layout).

usage: lockdups.py <pnpm-lock.yaml>
exit 0 when no duplicate key was found, 1 when there is one, 2 on usage error

pnpm writes every entry of `importers:`, `packages:` and `snapshots:` as an indent-2 line that is either
`key:` (a nested map follows) or `key: {}` (an empty map; most `snapshots:` leaves look like this). A git merge
of two bot PRs can leave the same key twice; YAML parsers then keep one of them or reject the file, and pnpm
re-resolves everything, which is what this check protects against.
"""
import sys
from collections import Counter, defaultdict

SECTIONS = ("importers", "packages", "snapshots")


def entry_key(stripped):
    """The key of an indent-2 entry line, or None when the line is not one."""
    if stripped.endswith(": {}"):
        key = stripped[:-4]
    elif stripped.endswith(":"):
        key = stripped[:-1]
    else:
        return None
    if len(key) >= 2 and key[0] == key[-1] == "'":
        key = key[1:-1]
    return key


def find_duplicates(path):
    section = None
    seen = defaultdict(Counter)
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            indent = len(line) - len(line.lstrip(" "))
            if indent == 0:
                section = stripped[:-1] if stripped.endswith(":") else None
            elif indent == 2 and section in SECTIONS:
                key = entry_key(stripped)
                if key is not None:
                    seen[section][key] += 1
    return [(s, k, c) for s, counter in seen.items() for k, c in counter.items() if c > 1]


def main(argv):
    if len(argv) != 2:
        print(__doc__.strip())
        return 2
    dups = find_duplicates(argv[1])
    for section, key, count in dups:
        print(f"DUPLICATE in {section}: {key} x{count}")
    print("OK: no duplicate keys" if not dups else f"FOUND {len(dups)} duplicate key(s)")
    return 1 if dups else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
