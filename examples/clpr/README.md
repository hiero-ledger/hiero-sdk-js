# CLPR integration

CLPR provides ordered cross-ledger messaging. A Channel binds a peer service to a verifier; a Connector authorizes messages and backs delivery costs; endpoints relay proof-bearing bundles. The SDK builds the HAPI operations and reads mirror state. It does not implement endpoint synchronization, verifier contracts or application contracts.

## Baseline

The HAPI schema is CN `77c8361520e595c25d2d943f89a57b32cb21d22c`. Both proof queries use the standard query cost/payment flow. CN main serves them free (cost 0) since [#28279](https://github.com/hiero-ledger/hiero-consensus-node/pull/28279) reverted the paid queries of [#28137](https://github.com/hiero-ledger/hiero-consensus-node/pull/28137); executing them still needs an operator. The CN fee model is not final.

Completion helpers follow **provisional** CN [#28017](https://github.com/hiero-ledger/hiero-consensus-node/pull/28017) at `807100e2` and [#28019](https://github.com/hiero-ledger/hiero-consensus-node/pull/28019) at `453306c6`. They are not compatible with the earlier ID-only signatures. Final EAP-0.2 vectors and the enabled runtime must be reconciled before release. The selected node must implement the same signing rules.

Mirror queries follow the [REST design](https://github.com/hiero-ledger/hiero-mirror-node/blob/0c0a831342b134f05ce81d058e16ebf6bfaa73fb/docs/design/clpr.md#rest-api-implementation); live acceptance requires a deployed implementation of both routes, targeted for MN 0.168.

## Run lifecycle examples

Build the SDK and its proto/cryptography packages first. The examples load `examples/.env`: copy the `CLPR_*` variables documented in the root `env.example` there. From `examples/`, run an example explicitly:

```sh
node clpr/get-ledger-configuration.js
node clpr/get-endpoint-manifest.js
node clpr/channel-lifecycle.js
node clpr/connector-lifecycle.js
```

`clientForName()` already supports `NODE_IP`/`NODE_ACCOUNT_ID`, `MIRROR_NETWORK` and `MIRROR_NODE_REST_URL` overrides. Use the endpoints and account IDs from the current environment handoff; resets can change account IDs. Keep private keys in local secret configuration.

The lifecycle examples use the SDK's default fee cap. CN main charges a flat fee of about $0.001 per CLPR transaction, well under that cap. Set the optional `CLPR_MAX_TRANSACTION_FEE_TINYBARS` only when the target network's schedule needs a higher cap. The SDK default-cap policy waits on the final CN fee model.

`CLPR_LOCKED_STAKE_TINYBARS` must be at least the network's `clpr.minLockedStake`, which CN main sets in tinybars. The builder's default stake is zero.

Channel completion needs real peer configuration/manifest proofs accepted by the chosen verifier. A nonempty query response does not necessarily contain usable proof material: an empty proof means the signed snapshot is unavailable. Readiness retries must be bounded. Query response fields can describe live state while the proof describes a snapshot.

Set all bound fields before `setOwnershipProof()`. Channel signatures bind the ID, verifier ContractID and both proof byte strings. Connector signatures bind the channel ID, derived connector ID, CLPR service address, connector ContractID and admin Key. Setters invalidate a proof when the bound value changes. Locked stake is not a signed input. Signing serializes ContractID/Key as CN reserializes them, including the active EVM-address oneof; do not hash a protobuf object containing an additional numeric contract field.

Connector ownership, Connector administration and consent from the contract paying delivery are distinct. The example uses `CLPR_CONNECTOR_CONTRACT_ADMIN_KEY` for ordinary transaction signing under provisional CN [#28013](https://github.com/hiero-ledger/hiero-consensus-node/pull/28013). `CLPR_CONNECTOR_ADMIN_KEY` authorizes deregistration. The stake recipient also signs deregistration. Closing channels or updating local ledger configuration requires the Treasury/SystemAdmin privilege.

## Read current mirror state

```js
import {
    MirrorNodeClprChannelQuery,
    MirrorNodeClprConnectorQuery,
} from "@hiero-ledger/sdk";

const channelId = new Uint8Array(Buffer.from("11".repeat(32), "hex"));
const connectorId = new Uint8Array(Buffer.from("22".repeat(32), "hex"));
const channel = await new MirrorNodeClprChannelQuery({ channelId }).execute(
    client,
);
const connector = await new MirrorNodeClprConnectorQuery({
    channelId,
    connectorId,
}).execute(client);

console.log(channel.status.toString(), channel.nextMessageId.toString());
console.log(connector.lockedStake.toTinybars().toString());
```

Replace the example IDs with entities created by the integration. These queries make one known-ID request, do not paginate or request historical state, and use the shared mirror HTTP retry/deadline policy. The Connector query requests `status=eq:ACTIVE` to exclude retained deleted rows. Empty results produce CLPR not-found statuses and may reflect ingestion lag. HTTP 404 is a route/HTTP failure, not proof that an entity is absent. Malformed, multiple or mismatched rows fail explicitly.

Counters are unsigned `Long`, stake is `Hbar`, and timestamps retain nanoseconds. Contract IDs, the verifier fingerprint and the trust anchor ID are `null` when the mirror node returns null. The mirror node reads only a contract's number, so a contract set by EVM address can come back as null. Convert counters/stake to decimal strings when crossing JSON boundaries. Typed bytes, contract IDs and compound keys are returned as detached copies.

## Shared SDK/TCK handoff

The current adapter methods remain provisional until shared TCK #784 settles the contract. The JS server exposes the ten HAPI methods in `tck/methods/clpr.ts` plus:

-   `getMirrorNodeClprChannel({sessionId, channelId})`
-   `getMirrorNodeClprConnector({sessionId, channelId, connectorId})`

IDs/proofs are hex strings without `0x`; counters/tinybars are decimal strings; timestamps are `seconds.nanoseconds`. Mirror contract IDs and the Channel's verifier fingerprint and trust anchor ID are JSON `null` when the mirror node returns null. Mirror Connector responses return the complete admin Key as `{_type: "ProtobufEncoded", key: "<protobuf Key hex>"}` so threshold/list structure survives. Completion responses preserve nulls and the ECDSA scheme's zero-valued enum. Ordinary transaction signer keys and max fees use existing common transaction parameters.

Port the model/validation behavior and independent provisional signing vectors in `test/unit/utils/ClprPhase2OwnershipVectors.js`, together with their pinned source metadata. `ClprOwnershipVectors.js` keeps historical signing values only; its commitment/ID formulas remain useful. Test the JSON-RPC boundary as well as SDK helpers. The mock mirror fixtures are in `test/unit/utils/ClprMirror.js`.

## Live acceptance

Record the SDK ref/package, CN image/tag/config, mirror build, ledger/chain IDs, contract IDs/ABI hashes, proof provenance, account roles and pass/fail/skip results. An offline suite or previewnet smoke transaction does not establish real-proof acceptance.

Run fresh two-ledger commit/reveal, contract-consented Connector setup, send/bundle processing, a response round trip, and mirror lookup ingestion. Sending application messages uses existing contract APIs at `0x16e`, not a new HAPI send transaction. Match the deployed fee implementation. CN main prices the `0x16e` calls as fixed gas and collects no attached value. Draft CN [#28269](https://github.com/hiero-ledger/hiero-consensus-node/pull/28269) proposes a different gas-only model with a 2M gas starting allowance; larger messages, routes and batches need measured allowances. Both HAPI proof queries are free on CN main.

Assert destination/source application state or callback payload. A successful bundle or advancing acknowledgement counter alone does not prove that the application callback ran. Close-to-CLOSED coverage and admin cleanup remain separate acceptance gates. Repeat the live checks against installed released packages before declaring the reference ready for downstream releases.
