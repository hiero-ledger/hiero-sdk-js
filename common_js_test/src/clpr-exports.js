// SPDX-License-Identifier: Apache-2.0

const assert = require("node:assert/strict");
const sdk = require("@hiero-ledger/sdk");

// Run with NODE_OPTIONS=--no-experimental-require-module. This is offline.
const names = [
    "ClprRegisterChannelTransaction",
    "ClprCompleteChannelTransaction",
    "ClprCloseChannelTransaction",
    "ClprSubmitBundleTransaction",
    "ClprRegisterConnectorTransaction",
    "ClprCompleteConnectorTransaction",
    "ClprDeregisterConnectorTransaction",
    "ClprUpdateLedgerConfigurationTransaction",
    "ClprGetLedgerConfigurationQuery",
    "ClprGetEndpointManifestQuery",
    "ClprThrottles",
    "ClprLedgerConfigurationInfo",
    "ClprEndpointManifestInfo",
    "ClprEndpoint",
    "ClprServiceEndpoint",
    "ClprSignatureScheme",
];

for (const name of names) {
    assert.equal(typeof sdk[name], "function", `Missing CJS export: ${name}`);
}
console.log("All 16 public CLPR names load through CommonJS.");
