# Whole-transaction body hash (candidate)

`await transaction.getTransactionBodyHash()` returns 48 raw SHA-384 bytes for a frozen transaction's complete prepared body set. It covers every node and every chunk and excludes signatures in transaction envelopes, including batch child envelopes.

This is a concrete local candidate for [sdk-collaboration-hub PR #288](https://github.com/hiero-ledger/sdk-collaboration-hub/pull/288), tracked in JavaScript by [#4579](https://github.com/hiero-ledger/hiero-sdk-js/issues/4579). The batch framing, import ordering and rejection rules remain pending maintainer agreement. SDK PRs must not merge before that agreement. This guide describes the candidate, not an approved cross-SDK contract.

## Review prepared bytes

```js
const transaction = new TransferTransaction()
    .setTransactionId(transactionId)
    .setNodeAccountIds(nodeAccountIds)
    .addHbarTransfer(sender, new Hbar(-1))
    .addHbarTransfer(recipient, new Hbar(1))
    .freeze();

const reviewedHash = await transaction.getTransactionBodyHash();
await transaction.sign(privateKey);

const returned = Transaction.fromBytes(transaction.toBytes());
const returnedHash = await returned.getTransactionBodyHash();
const matches = reviewedHash.every(
    (byte, index) => byte === returnedHash[index],
);
```

Freeze with the final transaction IDs, nodes and chunking before review. Hashing requires a complete frozen body set; missing IDs, missing bodies and malformed content cause a local error. It performs no network requests and invokes no signer callbacks, including deferred signers registered with `signWith()`.

A successful call locks the selected transaction IDs and node membership. Execution keeps the reviewed nodes even if the client's `maxNodesPerTransaction` is later reduced, and it cannot regenerate the reviewed IDs. Set a smaller node list before freezing if required. Deferred request signing uses the original reviewed bodies. Signatures can still be added after review; the getter does not lock signature containers. Repeated calls preserve body bytes, existing signatures and iteration cursors. Failed calls leave transaction state unchanged.

Calling `freeze()` or `freezeWith()` again after a successful review is a no-op for ordinary and chunked transactions. It preserves prepared IDs, node membership, chunk boundaries, original body bytes, signatures and deferred-signing settings. A prepared batch child's explicit `0.0.0` node and transaction ID also survive standalone and embedded batch imports.

Recompute this digest from returned transaction bytes before comparing it with an application review record. Matching content does not establish signature validity, authorization or successful execution; those remain part of the normal transaction workflow.

## Exact representation

For ordinary entries, `entryHash = SHA384(original bodyBytes)`. The result is always `SHA384(concat(entryHash[0], ..., entryHash[n-1]))`, including for a single entry. Every inner digest is 48 bytes.

Chunks are traversed by the first appearance of their decoded transaction ID in the imported list. Nodes are traversed by their first appearance in the first chunk. Node-major lists and permutations of later chunks' node order therefore yield the same digest as their corresponding chunk-major list. Changing the first chunk's node order or the first appearance of chunk IDs changes the digest.

Imports reject duplicate decoded `(transaction ID, node ID)` pairs before regrouping can discard evidence. Every chunk must have the same node set. Existing transaction type, same-chunk content and cross-chunk invariant validation still applies. Hash traversal groups entries temporarily; hashing does not rewrite the stored wire order. The importer may regroup newly supported node-major lists to satisfy the SDK's existing chunk storage invariants.

For batch content consistency across nodes, comparison uses each child's original body bytes in child order. Child signature maps, algorithm flags and other envelope metadata may differ between nodes. This temporary comparison projection leaves stored bodies, child envelopes, signatures, network serialization and network hash APIs unchanged. Different child body bytes, even from a different encoding of the same operation, remain different content; other outer-field checks still apply.

The original body bytes are hashed without decoding and re-encoding them. Unknown body fields, explicitly encoded defaults, IDs, node membership, fees, memo and chunk content all affect the result. Independently encoded protobuf messages with the same semantic operation can have different digests: **this is a representation commitment, not a semantic canonicalization promise**.

## Batch framing

For each batch entry:

```text
entryHash = SHA384(
    SHA384(original outer bodyBytes with the entire field-74 record removed)
    || SHA384(child[0].original bodyBytes)
    || ...
    || SHA384(child[k-1].original bodyBytes)
)
```

Children are `SignedTransaction` envelopes whose field 1 contains their original body bytes. Outer and child signature maps, and other envelope metadata such as the network hash algorithm flag, are outside this commitment. Signature or proof bytes contained in actual transaction body fields remain content. Unknown outer-body and child-body bytes are retained. Child order and count affect the digest.

Within the hash-inspected messages described below, the candidate rejects malformed or truncated wire data. It also rejects conflicting operation fields, repeated outer field 74, empty batches, unknown batch-wrapper fields, incorrect wrapper wire types, malformed child envelopes, missing/empty/repeated child body bytes, children without a valid operation or IDs, and nested batches. Batch children must carry an explicit node ID, including `0.0.0`. Unknown wrapper content is rejected because silently dropping future wrapper fields could omit transaction content.

Hash-only framing does not remove signatures from network transactions. `toBytes()`, `getTransactionHash()` and `getTransactionHashPerNode()` retain their existing wire/hash behavior for supported prepared transactions; the per-node network hash map is not expanded to cover additional chunks.

## Shared vectors

The exact shared fixture is copied to `test/unit/fixtures/transaction-body-hash-vectors.json`: 35 vectors, with 20 successful digests and 15 rejected inputs. The public import/freeze/getter tests in `test/unit/TransactionBodyHash.js` consume these inputs, whose expected results were independently checked with a Python wire extractor and `hashlib`.

The separate `test/unit/fixtures/transaction-body-hash-identifier-vectors.json` contains five identifier boundary cases: one successful digest and four rejections. The combined 40 shared inputs contain 21 expected digests and 19 rejections. The core 35-vector inventory remains separate and unchanged.

Strict raw record bounds apply to `TransactionBody`, its `transactionID` and `nodeAccountID` messages, the known `TransactionID.transactionValidStart` (`Timestamp`) and `TransactionID.accountID` (`AccountID`) payloads, batch wrappers, and child `SignedTransaction` envelopes. These messages accept wire types 0, 1, 2 and 5, with tag/length varints up to five bytes and value varints up to ten bytes without overflow. Legacy groups and longer tags/lengths are rejected before decoding can discard evidence. Unknown length-delimited identifier payloads are opaque bytes and are not recursively interpreted. Nonminimal encodings within the bounds remain part of the original committed bytes.

Operation-specific submessages retain the SDK's existing schema decoding and transaction checks. This bounded extraction profile is not a universal protobuf validator or a canonical encoder. These rejection bounds also await maintainer agreement in #288.
