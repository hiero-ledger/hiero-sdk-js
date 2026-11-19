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

const channelId = new Uint8Array(32).fill(1);
const registration = new sdk.ClprRegisterConnectorTransaction({
    channelId,
    commitment: new Uint8Array(32).fill(2),
});
const decoded = sdk.Transaction.fromBytes(registration.toBytes());
assert.ok(decoded instanceof sdk.ClprRegisterConnectorTransaction);
assert.deepEqual(decoded.channelId, channelId);
channelId.fill(0);
assert.equal(registration.channelId[0], 1);
console.log("CommonJS connector registration preserves and copies channelId.");
