// SPDX-License-Identifier: Apache-2.0

const assert = require("node:assert/strict");
const sdk = require("@hiero-ledger/sdk");

// Run with NODE_OPTIONS=--no-experimental-require-module. This is offline.
const names = [
    "ClprCreateChannelTransaction",
    "ClprDeleteChannelTransaction",
    "ClprSubmitBundleTransaction",
    "ClprCreateConnectorTransaction",
    "ClprDeleteConnectorTransaction",
    "ClprUpdateLedgerConfigurationTransaction",
    "ClprGetLedgerConfigurationQuery",
    "ClprGetEndpointManifestQuery",
    "ClprThrottles",
    "ClprLedgerConfigurationInfo",
    "ClprEndpointManifestInfo",
    "ClprEndpoint",
    "ClprServiceEndpoint",
    "ClprChannelStatus",
    "MirrorNodeClprChannel",
    "MirrorNodeClprChannelQuery",
    "MirrorNodeClprConnector",
    "MirrorNodeClprConnectorQuery",
];

for (const name of names) {
    assert.equal(typeof sdk[name], "function", `Missing CJS export: ${name}`);
}
console.log(`All ${names.length} public CLPR names load through CommonJS.`);

const channelId = new Uint8Array(32).fill(1);
const deletion = new sdk.ClprDeleteConnectorTransaction({
    channelId,
    connectorId: new Uint8Array(32).fill(2),
    stakeRecipient: "0.0.3",
});
const decoded = sdk.Transaction.fromBytes(deletion.toBytes());
assert.ok(decoded instanceof sdk.ClprDeleteConnectorTransaction);
assert.deepEqual(decoded.channelId, channelId);
channelId.fill(0);
assert.equal(deletion.channelId[0], 1);
console.log("CommonJS Connector deletion preserves and copies channelId.");
