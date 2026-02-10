#!/usr/bin/env bash
set -euo pipefail

# Link @hiero-ledger/sdk globally while preserving the original package.json.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="${ROOT}/package.json"
BACKUP="$(mktemp)"

cleanup() {
    mv "${BACKUP}" "${PKG}" 2>/dev/null || true
}
trap cleanup EXIT

cp "${PKG}" "${BACKUP}"

node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('${PKG}', 'utf8'));
['dependencies','devDependencies','peerDependencies','optionalDependencies'].forEach(k => {
  if (!data[k]) return;
  for (const dep of Object.keys(data[k])) {
    const v = data[k][dep];
    if (typeof v === 'string' && v.startsWith('workspace:')) {
      data[k][dep] = v.replace(/^workspace:/, '');
    }
  }
});
fs.writeFileSync('${PKG}', JSON.stringify(data, null, 2) + '\\n');
"

cd "${ROOT}"
pnpm link --global --dir .

