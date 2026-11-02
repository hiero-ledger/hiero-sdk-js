// SPDX-License-Identifier: Apache-2.0

import { proto, Writer } from "@hiero-ledger/proto";
import CryptoJS from "crypto-js";
import {
    AccountId,
    BatchTransaction,
    Client,
    FileAppendTransaction,
    PrivateKey,
    Status,
    Timestamp,
    TopicMessageSubmitTransaction,
    Transaction,
    TransactionId,
    TransferTransaction,
} from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
import vectors from "./fixtures/transaction-body-hash-vectors.json";
import identifierVectors from "./fixtures/transaction-body-hash-identifier-vectors.json";

// Candidate profile for hub PR #288; framing/import/rejection rules await maintainer agreement.
const fixtures = new Map(
    vectors.vectors.map((vector) => [vector.name, vector]),
);
const nodes = [new AccountId(3), new AccountId(4)];

function joinBytes(...parts) {
    const result = new Uint8Array(
        parts.reduce((size, part) => size + part.length, 0),
    );
    let offset = 0;
    for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
    }
    return result;
}

function sha384(bytes) {
    return hex.decode(
        CryptoJS.SHA384(CryptoJS.lib.WordArray.create(bytes)).toString(),
    );
}

function ordinaryHash(bodies) {
    return sha384(joinBytes(...bodies.map(sha384)));
}

function fixtureBytes(name) {
    return hex.decode(fixtures.get(name).transactionListHex);
}

function signedEnvelopes(bytes) {
    return proto.TransactionList.decode(bytes).transactionList.map((tx) =>
        tx.signedTransactionBytes?.length
            ? proto.SignedTransaction.decode(tx.signedTransactionBytes)
            : { bodyBytes: tx.bodyBytes, sigMap: tx.sigMap },
    );
}

function bodiesIn(bytes) {
    return signedEnvelopes(bytes).map((tx) => tx.bodyBytes);
}

function listWithBodies(bodies) {
    return proto.TransactionList.encode({
        transactionList: bodies.map((bodyBytes) => ({
            signedTransactionBytes: proto.SignedTransaction.encode({
                bodyBytes,
            }).finish(),
        })),
    }).finish();
}

function record(number, bytes) {
    return Writer.create()
        .uint32(number * 8 + 2)
        .bytes(bytes)
        .finish();
}

function importFrozen(bytes) {
    const tx = Transaction.fromBytes(bytes);
    if (!tx.isFrozen()) {
        tx.freeze();
    }
    return tx;
}

function transactionId(nanos = 123) {
    return new TransactionId(
        new AccountId(1001),
        new Timestamp(1700000000, nanos),
    );
}

function transfer(nodeIds = nodes) {
    return new TransferTransaction()
        .setTransactionId(transactionId())
        .setNodeAccountIds(nodeIds)
        .setTransactionMemo("review me");
}

function append(contents = "abcdefgh", nodeIds = nodes) {
    return new FileAppendTransaction()
        .setTransactionId(transactionId())
        .setNodeAccountIds(nodeIds)
        .setFileId("0.0.1002")
        .setChunkSize(4)
        .setContents(contents);
}

function topic(message = "abcdefgh") {
    return new TopicMessageSubmitTransaction()
        .setTransactionId(transactionId())
        .setNodeAccountIds(nodes)
        .setTopicId("0.0.1002")
        .setChunkSize(4)
        .setMessage(message);
}

function preparedBodies(tx) {
    return tx.signableNodeBodyBytesList.map(
        (entry) => entry.signableTransactionBodyBytes,
    );
}

function offlineClient() {
    return Client.forNetwork(
        { "127.0.0.1:50211": "0.0.3", "127.0.0.1:50212": "0.0.4" },
        { scheduleNetworkUpdate: false },
    );
}

function snapshot(tx) {
    const lists = [
        tx._transactionIds,
        tx._nodeAccountIds,
        tx._signedTransactions,
        tx._transactions,
    ];
    return {
        indexes: lists.map((list) => list.index),
        locks: lists.map((list) => list.locked),
        ids: tx._transactionIds.list.map((id) => id.toString()),
        nodes: tx._nodeAccountIds.list.map((id) => id.toString()),
        signed: tx._signedTransactions.list.map((entry) =>
            hex.encode(proto.SignedTransaction.encode(entry).finish()),
        ),
        transactions: tx._transactions.list.map((entry) =>
            entry == null
                ? null
                : hex.encode(proto.Transaction.encode(entry).finish()),
        ),
        signers: tx._transactionSigners.slice(),
        keys: [...tx._signerPublicKeys],
    };
}

// Mutated inputs below exercise rejection through the public import/getter, not a test parser.
const ordinaryBody = bodiesIn(fixtureBytes("ordinary-single"))[0];
const batchBody = proto.TransactionBody.decode(
    bodiesIn(fixtureBytes("batch-unsigned"))[0],
);
const childEnvelopes = batchBody.atomicBatch.transactions;
const outerBody = proto.TransactionBody.encode({
    ...batchBody,
    atomicBatch: null,
}).finish();

function batchWithWrapper(wrapper) {
    return listWithBodies([joinBytes(outerBody, record(74, wrapper))]);
}

function batchWithChildBody(body) {
    return batchWithWrapper(record(1, record(1, body)));
}

async function expectRejected(bytes) {
    // An absent API must fail red, never count as a successful input rejection.
    expect(Transaction.prototype.getTransactionBodyHash).toBeTypeOf("function");
    const original = hex.encode(bytes);
    let tx;
    try {
        tx = importFrozen(bytes);
    } catch (error) {
        expect(error).toBeInstanceOf(Error);
    }
    if (tx) {
        const before = snapshot(tx);
        await expect(tx.getTransactionBodyHash()).rejects.toThrow();
        expect(snapshot(tx)).toEqual(before);
    }
    expect(hex.encode(bytes)).toBe(original);
}

async function expectFixtureHash(vector) {
    const input = hex.decode(vector.transactionListHex);
    const original = hex.encode(input);
    const tx = importFrozen(input);
    const before = tx.toBytes();
    const pending = tx.getTransactionBodyHash();
    expect(pending).toBeInstanceOf(Promise);
    const hash = await pending;
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash).toHaveLength(48);
    expect(hex.encode(hash)).toBe(vector.expectedHashHex);
    expect(await tx.getTransactionBodyHash()).toEqual(hash);
    expect(tx.toBytes()).toEqual(before);
    expect(hex.encode(input)).toBe(original);

    const serialized = tx.toBytes();
    // Canonical import may regroup envelopes; each original body must survive verbatim.
    expect(bodiesIn(serialized).map(hex.encode).sort()).toEqual(
        bodiesIn(input).map(hex.encode).sort(),
    );
    expect(await importFrozen(serialized).getTransactionBodyHash()).toEqual(
        hash,
    );
    if (vector.sameHashAs) {
        expect(hex.encode(hash)).toBe(
            fixtures.get(vector.sameHashAs).expectedHashHex,
        );
    }
}

describe("Transaction.getTransactionBodyHash (proposed whole-transaction profile)", function () {
    describe("shared independent wire fixtures", function () {
        it("contains exactly 35 shared vectors: 20 digests and 15 rejections", function () {
            expect(vectors.vectors).toHaveLength(35);
            expect(
                vectors.vectors.filter((vector) => vector.expectedHashHex),
            ).toHaveLength(20);
            expect(
                vectors.vectors.filter((vector) => vector.expectedError),
            ).toHaveLength(15);
        });

        for (const vector of vectors.vectors) {
            if (vector.expectedError) {
                it(`rejects ${vector.name} (${vector.expectedError})`, async function () {
                    await expectRejected(hex.decode(vector.transactionListHex));
                });
                continue;
            }

            it(`hashes ${vector.name}, repeats and preserves original bodies on roundtrip`, async function () {
                await expectFixtureHash(vector);
            });
        }
    });

    describe("shared identifier boundary fixtures", function () {
        it("contains a separate five-vector inventory: one digest and four rejections", function () {
            expect(identifierVectors.vectors).toHaveLength(5);
            expect(
                identifierVectors.vectors.filter(
                    (vector) => vector.expectedHashHex,
                ),
            ).toHaveLength(1);
            expect(
                identifierVectors.vectors.filter(
                    (vector) => vector.expectedError,
                ),
            ).toHaveLength(4);
        });

        for (const vector of identifierVectors.vectors) {
            it(`validates ${vector.name} through public import/freeze/hash`, async function () {
                if (vector.expectedError) {
                    await expectRejected(hex.decode(vector.transactionListHex));
                } else {
                    await expectFixtureHash(vector);
                }
            });
        }
    });

    describe("nested identifier raw wire validation", function () {
        const invalidSuffixes = [
            [
                "six-byte tag",
                new Uint8Array([0xa0, 0x86, 0x80, 0x80, 0x80, 0x00, 1]),
            ],
            [
                "six-byte length",
                new Uint8Array([
                    0xa2, 6, 0x81, 0x80, 0x80, 0x80, 0x80, 0, 0x78,
                ]),
            ],
            ["legacy group", new Uint8Array([0xa3, 6, 0xa4, 6])],
            [
                "overflowing value",
                new Uint8Array([0xa0, 6, ...new Uint8Array(9).fill(255), 2]),
            ],
        ];
        const targets = [
            "nodeAccountID",
            "transactionID",
            "transactionID.accountID",
            "transactionID.transactionValidStart",
        ];

        function bodyWithIdentifierSuffix(target, suffix) {
            const body = proto.TransactionBody.decode(ordinaryBody);
            const tx = body.transactionID;
            const timestamp = proto.Timestamp.encode(
                tx.transactionValidStart,
            ).finish();
            const payer = proto.AccountID.encode(tx.accountID).finish();
            const node = proto.AccountID.encode(body.nodeAccountID).finish();
            const extra = (field) =>
                field === target ? suffix : new Uint8Array();
            const txBytes = joinBytes(
                record(
                    1,
                    joinBytes(
                        timestamp,
                        extra("transactionID.transactionValidStart"),
                    ),
                ),
                record(2, joinBytes(payer, extra("transactionID.accountID"))),
                proto.TransactionID.encode({
                    ...tx,
                    transactionValidStart: null,
                    accountID: null,
                }).finish(),
                extra("transactionID"),
            );
            return joinBytes(
                record(1, txBytes),
                record(2, joinBytes(node, extra("nodeAccountID"))),
                proto.TransactionBody.encode({
                    ...body,
                    transactionID: null,
                    nodeAccountID: null,
                }).finish(),
            );
        }

        const acceptedSuffix = joinBytes(
            new Uint8Array([0xa0, 6, 0x81, 0]),
            Writer.create()
                .uint32(101 * 8 + 1)
                .finish(),
            new Uint8Array(8).fill(255),
            record(102, new Uint8Array([0, 0x80, 0xff, 0xa3, 6])),
            Writer.create()
                .uint32(103 * 8 + 5)
                .finish(),
            new Uint8Array(4).fill(255),
        );

        for (const target of targets) {
            for (const [name, suffix] of invalidSuffixes) {
                it(`rejects ${name} inside ${target} through public import/freeze/hash`, async function () {
                    await expectRejected(
                        listWithBodies([
                            bodyWithIdentifierSuffix(target, suffix),
                        ]),
                    );
                });
            }

            it(`preserves bounded records and opaque unknown payloads inside ${target}`, async function () {
                const body = bodyWithIdentifierSuffix(target, acceptedSuffix);
                const input = listWithBodies([body]);
                const tx = importFrozen(input);
                const wire = tx.toBytes();
                const networkHash = await tx.getTransactionHash();
                const hash = await tx.getTransactionBodyHash();
                expect(hex.encode(hash)).toBe(hex.encode(ordinaryHash([body])));
                expect(await tx.getTransactionBodyHash()).toEqual(hash);
                expect(tx.toBytes()).toEqual(wire);
                expect(await tx.getTransactionHash()).toEqual(networkHash);
                expect(bodiesIn(wire).map(hex.encode)).toEqual([
                    hex.encode(body),
                ]);
                expect(
                    await importFrozen(wire).getTransactionBodyHash(),
                ).toEqual(hash);
                await tx.sign(PrivateKey.generateED25519());
                expect(await tx.getTransactionBodyHash()).toEqual(hash);
                expect(preparedBodies(tx).map(hex.encode)).toEqual([
                    hex.encode(body),
                ]);
            });

            it(`rejects frozen ${target} overflow without changing state`, async function () {
                const tx = transfer([nodes[0]]).freeze();
                tx._signedTransactions.list[0].bodyBytes =
                    bodyWithIdentifierSuffix(target, invalidSuffixes[3][1]);
                const before = snapshot(tx);
                const reviewed = tx._transactionBodyHashRead;
                await expect(tx.getTransactionBodyHash()).rejects.toThrow();
                expect(snapshot(tx)).toEqual(before);
                expect(tx._transactionBodyHashRead).toBe(reviewed);
            });
        }

        it("retains existing SDK decoding for operation payloads outside identifier scanning", async function () {
            const body = proto.TransactionBody.decode(ordinaryBody);
            const operation = joinBytes(
                proto.CryptoTransferTransactionBody.encode(
                    body.cryptoTransfer,
                ).finish(),
                invalidSuffixes[2][1],
            );
            const bytes = joinBytes(
                proto.TransactionBody.encode({
                    ...body,
                    cryptoTransfer: null,
                }).finish(),
                record(14, operation),
            );
            const tx = importFrozen(listWithBodies([bytes]));
            expect(hex.encode(await tx.getTransactionBodyHash())).toBe(
                hex.encode(ordinaryHash([bytes])),
            );
            expect(bodiesIn(tx.toBytes()).map(hex.encode)).toEqual([
                hex.encode(bytes),
            ]);
        });
    });

    describe("fresh prepared transactions", function () {
        for (const [name, build, count] of [
            [
                "single entry (including the outer SHA-384)",
                () => transfer([nodes[0]]),
                1,
            ],
            ["multiple nodes", transfer, 2],
            ["file append chunks and nodes", append, 4],
            ["topic message chunks and nodes", topic, 4],
        ]) {
            it(`hashes every body of ${name}`, async function () {
                const tx = build().freeze();
                const bodies = preparedBodies(tx);
                expect(bodies).toHaveLength(count);
                const hash = await tx.getTransactionBodyHash();
                expect(hex.encode(hash)).toBe(hex.encode(ordinaryHash(bodies)));
                if (count === 1) {
                    expect(hex.encode(hash)).not.toBe(
                        hex.encode(sha384(bodies[0])),
                    );
                }
            });
        }

        it("changes when only the final file chunk changes", async function () {
            const original = append().freeze();
            const changed = append("abcdEFGH").freeze();
            expect(preparedBodies(original).slice(0, 2)).toEqual(
                preparedBodies(changed).slice(0, 2),
            );
            expect(await changed.getTransactionBodyHash()).not.toEqual(
                await original.getTransactionBodyHash(),
            );
        });

        it("changes when only the final topic chunk changes", async function () {
            const original = topic().freeze();
            const changed = topic("abcdEFGH").freeze();
            expect(preparedBodies(original).slice(0, 2)).toEqual(
                preparedBodies(changed).slice(0, 2),
            );
            expect(await changed.getTransactionBodyHash()).not.toEqual(
                await original.getTransactionBodyHash(),
            );
        });

        it("includes node membership and the first chunk's node order", async function () {
            const original = transfer().freeze();
            for (const nodeIds of [
                [nodes[1], nodes[0]],
                [nodes[0]],
                [nodes[0], new AccountId(5)],
            ]) {
                const changed = transfer(nodeIds).freeze();
                expect(await changed.getTransactionBodyHash()).not.toEqual(
                    await original.getTransactionBodyHash(),
                );
            }
        });

        it("detects content added only to the final node body", async function () {
            const bodies = preparedBodies(transfer().freeze());
            const changed = [
                bodies[0],
                joinBytes(bodies[1], record(100, new Uint8Array([1]))),
            ];
            const original = importFrozen(listWithBodies(bodies));
            const tx = importFrozen(listWithBodies(changed));
            expect(hex.encode(await tx.getTransactionBodyHash())).toBe(
                hex.encode(ordinaryHash(changed)),
            );
            expect(await tx.getTransactionBodyHash()).not.toEqual(
                await original.getTransactionBodyHash(),
            );
        });

        it("canonicalizes node-major and later-node permutations but preserves first chunk appearance", async function () {
            const bodies = preparedBodies(append().freeze());
            const original = await importFrozen(
                listWithBodies(bodies),
            ).getTransactionBodyHash();
            for (const order of [
                [0, 2, 1, 3],
                [0, 1, 3, 2],
            ]) {
                const reordered = importFrozen(
                    listWithBodies(order.map((index) => bodies[index])),
                );
                expect(await reordered.getTransactionBodyHash()).toEqual(
                    original,
                );
                expect(hex.encode(reordered.contents)).toBe(
                    hex.encode(new TextEncoder().encode("abcdefgh")),
                );
            }
            for (const order of [
                [2, 3, 0, 1],
                [1, 0, 2, 3],
            ]) {
                expect(
                    await importFrozen(
                        listWithBodies(order.map((index) => bodies[index])),
                    ).getTransactionBodyHash(),
                ).not.toEqual(original);
            }
        });

        it("commits to unknown ordinary body fields and explicitly encoded defaults", async function () {
            const semanticBody = proto.TransactionBody.decode(ordinaryBody);
            const withoutExplicitDefaults = proto.TransactionBody.encode({
                ...semanticBody,
                transactionID: {
                    ...semanticBody.transactionID,
                    scheduled: null,
                },
                nodeAccountID: {
                    accountNum: semanticBody.nodeAccountID.accountNum,
                },
            }).finish();
            const withUnknown = joinBytes(
                ordinaryBody,
                record(100, new Uint8Array([0, 255])),
            );
            for (const body of [withoutExplicitDefaults, withUnknown]) {
                expect(body).not.toEqual(ordinaryBody);
                const tx = importFrozen(listWithBodies([body]));
                expect(hex.encode(await tx.getTransactionBodyHash())).toBe(
                    hex.encode(ordinaryHash([body])),
                );
                expect(hex.encode(await tx.getTransactionBodyHash())).not.toBe(
                    hex.encode(ordinaryHash([ordinaryBody])),
                );
                expect(bodiesIn(tx.toBytes()).map(hex.encode)).toEqual([
                    hex.encode(body),
                ]);
            }
        });
    });

    describe("supported envelope imports and existing network hashes", function () {
        for (const name of [
            "ordinary-single",
            "ordinary-signed",
            "chunk-major",
            "batch-child-and-outer-signatures",
        ]) {
            it(`retains modern and legacy bodyBytes forms for ${name}`, async function () {
                const modern = fixtureBytes(name);
                const envelopes = signedEnvelopes(modern);
                const legacy = proto.TransactionList.encode({
                    transactionList: envelopes.map(({ bodyBytes, sigMap }) => ({
                        bodyBytes,
                        sigMap,
                    })),
                }).finish();
                for (const bytes of [modern, legacy]) {
                    const tx = importFrozen(bytes);
                    expect(hex.encode(await tx.getTransactionBodyHash())).toBe(
                        fixtures.get(name).expectedHashHex,
                    );
                    expect(bodiesIn(tx.toBytes()).map(hex.encode)).toEqual(
                        envelopes.map((envelope) =>
                            hex.encode(envelope.bodyBytes),
                        ),
                    );
                }
            });
        }

        for (const legacy of [false, true]) {
            it(`accepts a raw proto.Transaction with ${
                legacy ? "legacy bodyBytes" : "signedTransactionBytes"
            }`, async function () {
                const envelope = signedEnvelopes(
                    fixtureBytes("ordinary-single"),
                )[0];
                const raw = proto.Transaction.encode(
                    legacy
                        ? envelope
                        : {
                              signedTransactionBytes:
                                  proto.SignedTransaction.encode(
                                      envelope,
                                  ).finish(),
                          },
                ).finish();
                expect(
                    hex.encode(
                        await importFrozen(raw).getTransactionBodyHash(),
                    ),
                ).toBe(fixtures.get("ordinary-single").expectedHashHex);
            });
        }

        for (const build of [
            transfer,
            append,
            () =>
                importFrozen(fixtureBytes("batch-child-and-outer-signatures")),
        ]) {
            it(`preserves wire bytes and supported network hash APIs for ${
                build().constructor.name
            }`, async function () {
                const tx = build();
                if (!tx.isFrozen()) tx.freeze();
                const wire = tx.toBytes();
                const expectedNetworkHash = sha384(
                    proto.TransactionList.decode(wire).transactionList[0]
                        .signedTransactionBytes,
                );
                const beforeHash = await tx.getTransactionHash();
                const perNode = await tx.getTransactionHashPerNode();
                const beforeMap = perNode.toString();
                expect(perNode.size).toBe(tx._nodeAccountIds.length);
                for (let i = 0; i < tx._nodeAccountIds.length; i++) {
                    expect(
                        hex.encode(perNode.get(tx._nodeAccountIds.list[i])),
                    ).toBe(
                        hex.encode(
                            sha384(
                                proto.TransactionList.decode(wire)
                                    .transactionList[i].signedTransactionBytes,
                            ),
                        ),
                    );
                }
                const bodyHash = await tx.getTransactionBodyHash();
                expect(tx.toBytes()).toEqual(wire);
                expect(await tx.getTransactionHash()).toEqual(beforeHash);
                expect(hex.encode(beforeHash)).toBe(
                    hex.encode(expectedNetworkHash),
                );
                expect((await tx.getTransactionHashPerNode()).toString()).toBe(
                    beforeMap,
                );
                expect(await tx.getTransactionBodyHash()).toEqual(bodyHash);
            });
        }
    });

    describe("signature independence and signing after review", function () {
        it("allows adding real signatures after hashing every node/chunk", async function () {
            const tx = append().freeze();
            const beforeBodies = preparedBodies(tx).map((body) => body.slice());
            const hash = await tx.getTransactionBodyHash();
            const key1 = PrivateKey.generateED25519();
            const key2 = PrivateKey.generateECDSA();
            await tx.sign(key1);
            await tx.sign(key2);
            const wire = tx.toBytes();
            expect(preparedBodies(tx)).toEqual(beforeBodies);
            for (const envelope of signedEnvelopes(wire)) {
                expect(envelope.sigMap.sigPair).toHaveLength(2);
                expect(
                    key1.publicKey.verify(
                        envelope.bodyBytes,
                        envelope.sigMap.sigPair[0].ed25519,
                    ),
                ).toBe(true);
                expect(
                    key2.publicKey.verify(
                        envelope.bodyBytes,
                        envelope.sigMap.sigPair[1].ECDSASecp256k1,
                    ),
                ).toBe(true);
            }
            expect(await tx.getTransactionBodyHash()).toEqual(hash);
            const envelopes = signedEnvelopes(wire);
            for (const reverse of [true, false]) {
                const bytes = proto.TransactionList.encode({
                    transactionList: envelopes.map((envelope) => ({
                        signedTransactionBytes: proto.SignedTransaction.encode({
                            ...envelope,
                            sigMap: {
                                sigPair: reverse
                                    ? [...envelope.sigMap.sigPair].reverse()
                                    : [],
                            },
                        }).finish(),
                    })),
                }).finish();
                expect(
                    await importFrozen(bytes).getTransactionBodyHash(),
                ).toEqual(hash);
            }
        });

        it("excludes outer and child signatures in freshly constructed batches", async function () {
            const key = PrivateKey.generateED25519();
            const [child1, child2] = [123, 124].map((nanos) =>
                new TransferTransaction()
                    .setTransactionId(transactionId(nanos))
                    .setTransactionMemo("review me")
                    .setBatchKey(key.publicKey)
                    .freeze(),
            );
            const build = () =>
                new BatchTransaction()
                    .setInnerTransactions([child1, child2])
                    .setTransactionId(transactionId())
                    .setNodeAccountIds(nodes)
                    .freeze();
            const unsigned = build();
            const hash = await unsigned.getTransactionBodyHash();
            await unsigned.sign(key);
            expect(await unsigned.getTransactionBodyHash()).toEqual(hash);
            await child1.sign(key);
            await child2.sign(key);
            const signed = build();
            await signed.sign(key);
            const wire = signed.toBytes();
            expect(wire).not.toEqual(unsigned.toBytes());
            expect(await signed.getTransactionBodyHash()).toEqual(hash);
            expect(signed.toBytes()).toEqual(wire);
            for (const envelope of signedEnvelopes(wire)) {
                expect(envelope.sigMap.sigPair).toHaveLength(1);
                const children = proto.TransactionBody.decode(
                    envelope.bodyBytes,
                ).atomicBatch.transactions;
                expect(
                    children.map(
                        (child) =>
                            proto.SignedTransaction.decode(child).sigMap.sigPair
                                .length,
                    ),
                ).toEqual([1, 1]);
            }
        });

        for (const name of [
            "batch-child-order-reversed",
            "batch-child-count-changed",
            "batch-child-content-changed",
            "batch-outer-content-changed",
            "batch-child-unknown-content",
        ]) {
            it(`detects ${name}`, async function () {
                const original = importFrozen(fixtureBytes("batch-unsigned"));
                const changed = importFrozen(fixtureBytes(name));
                expect(await changed.getTransactionBodyHash()).not.toEqual(
                    await original.getTransactionBodyHash(),
                );
            });
        }
    });

    describe("local state and deferred signing", function () {
        it("rejects an unfrozen transaction without changing it", async function () {
            const tx = transfer();
            const before = snapshot(tx);
            await expect(tx.getTransactionBodyHash()).rejects.toThrow(
                /frozen|freeze/i,
            );
            expect(snapshot(tx)).toEqual(before);
        });

        for (const body of [
            null,
            new Uint8Array(),
            new Uint8Array([0]),
            joinBytes(ordinaryBody, new Uint8Array([0x80])),
        ]) {
            it(`leaves failed frozen hashing unchanged for body ${
                body == null ? "missing" : hex.encode(body)
            }`, async function () {
                const tx = transfer().freeze();
                tx._signedTransactions.list[1].bodyBytes = body;
                tx._nodeAccountIds.index = 1;
                const before = snapshot(tx);
                await expect(tx.getTransactionBodyHash()).rejects.toThrow();
                expect(snapshot(tx)).toEqual(before);
            });
        }

        it("preserves nonzero cursors, prepared bodies and collected signatures on repeated calls", async function () {
            const tx = append().freeze();
            await tx.sign(PrivateKey.generateED25519());
            tx.toBytes();
            for (const list of [
                tx._transactionIds,
                tx._nodeAccountIds,
                tx._signedTransactions,
                tx._transactions,
            ])
                list.index = 1;
            const before = snapshot(tx);
            const first = await tx.getTransactionBodyHash();
            expect(await tx.getTransactionBodyHash()).toEqual(first);
            expect(snapshot(tx)).toEqual(before);
        });

        for (const [name, build] of [
            ["ordinary", transfer],
            ["file chunks", append],
            ["topic chunks", topic],
        ]) {
            it(`never calls deferred signers while hashing ${name} and subsequently signs reviewed bytes`, async function () {
                const client = offlineClient();
                client.setSignOnDemand(true);
                try {
                    const tx = build().freezeWith(client);
                    const key = PrivateKey.generateED25519();
                    const signedBodies = [];
                    await tx.signWith(key.publicKey, (body) => {
                        signedBodies.push(body.slice());
                        return Promise.resolve(key.sign(body));
                    });
                    tx._nodeAccountIds.index = 1;
                    if (name !== "ordinary") tx._transactionIds.index = 1;
                    const indexes = snapshot(tx).indexes;
                    const hash = await tx.getTransactionBodyHash();
                    const reviewed = preparedBodies(tx).map((body) =>
                        body.slice(),
                    );
                    expect(reviewed).toHaveLength(name === "ordinary" ? 2 : 4);
                    expect(hex.encode(hash)).toBe(
                        hex.encode(ordinaryHash(reviewed)),
                    );
                    expect(signedBodies).toEqual([]);
                    expect(await tx.getTransactionBodyHash()).toEqual(hash);
                    expect(snapshot(tx).indexes).toEqual(indexes);
                    expect(signedBodies).toEqual([]);

                    // Execution preparation and request construction stay offline.
                    client.setMaxNodesPerTransaction(1);
                    await tx._beforeExecute(client);
                    const expectedIndex =
                        tx._transactionIds.index * nodes.length +
                        tx._nodeAccountIds.index;
                    const request = await tx._makeRequestAsync();
                    const envelope = proto.SignedTransaction.decode(
                        request.signedTransactionBytes,
                    );
                    expect(envelope.bodyBytes).toEqual(reviewed[expectedIndex]);
                    expect(signedBodies).toEqual([reviewed[expectedIndex]]);
                    expect(
                        key.publicKey.verify(
                            envelope.bodyBytes,
                            envelope.sigMap.sigPair[0].ed25519,
                        ),
                    ).toBe(true);
                    expect(await tx.getTransactionBodyHash()).toEqual(hash);
                    expect(preparedBodies(tx)).toEqual(reviewed);
                    expect(signedBodies).toEqual([reviewed[expectedIndex]]);
                } finally {
                    client.close();
                }
            });
        }

        it("executes deferred signing over imported unknown body bytes without regenerating them", async function () {
            const client = offlineClient();
            client.setSignOnDemand(true);
            try {
                const body = joinBytes(
                    ordinaryBody,
                    record(100, new Uint8Array([0, 255])),
                );
                const tx = importFrozen(listWithBodies([body])).freezeWith(
                    client,
                );
                const key = PrivateKey.generateED25519();
                const signedBodies = [];
                await tx.signWith(key.publicKey, (bytes) => {
                    signedBodies.push(bytes.slice());
                    return Promise.resolve(key.sign(bytes));
                });
                const hash = await tx.getTransactionBodyHash();
                expect(hex.encode(hash)).toBe(hex.encode(ordinaryHash([body])));
                expect(signedBodies).toEqual([]);
                await tx._beforeExecute(client);
                const request = await tx._makeRequestAsync();
                expect(
                    hex.encode(
                        proto.SignedTransaction.decode(
                            request.signedTransactionBytes,
                        ).bodyBytes,
                    ),
                ).toBe(hex.encode(body));
                expect(signedBodies.map(hex.encode)).toEqual([
                    hex.encode(body),
                ]);
                expect(await tx.getTransactionBodyHash()).toEqual(hash);
                expect(signedBodies.map(hex.encode)).toEqual([
                    hex.encode(body),
                ]);
            } finally {
                client.close();
            }
        });

        for (const [name, build] of [
            ["ordinary", transfer],
            ["chunked", append],
        ]) {
            it(`locks reviewed IDs/node membership and survives a smaller execution node limit (${name})`, async function () {
                const client = offlineClient();
                try {
                    client.setOperator(
                        "0.0.1001",
                        PrivateKey.generateED25519(),
                    );
                    client.setDefaultRegenerateTransactionId(true);
                    const tx = importFrozen(
                        build().freezeWith(client).toBytes(),
                    );
                    expect(tx._transactionIds.locked).toBe(false);
                    expect(tx._nodeAccountIds.locked).toBe(false);
                    const bodies = preparedBodies(tx).map((body) =>
                        body.slice(),
                    );
                    const ids = tx._transactionIds.list.map((id) =>
                        id.toString(),
                    );
                    const hash = await tx.getTransactionBodyHash();
                    expect(tx._transactionIds.locked).toBe(true);
                    expect(tx._nodeAccountIds.locked).toBe(true);
                    client.setMaxNodesPerTransaction(1);
                    await tx._beforeExecute(client);
                    tx._getStatusAndExecutionState(
                        {},
                        {
                            nodeTransactionPrecheckCode:
                                proto.ResponseCodeEnum.TRANSACTION_EXPIRED,
                        },
                    );
                    expect(
                        tx._transactionIds.list.map((id) => id.toString()),
                    ).toEqual(ids);
                    expect(
                        tx.nodeAccountIds.map((id) => id.toString()),
                    ).toEqual(nodes.map((id) => id.toString()));
                    expect(preparedBodies(tx)).toEqual(bodies);
                    expect(await tx.getTransactionBodyHash()).toEqual(hash);
                    expect(
                        tx._getStatusAndExecutionState(
                            {},
                            {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.TRANSACTION_EXPIRED,
                            },
                        )[0],
                    ).toBe(Status.TransactionExpired);
                } finally {
                    client.close();
                }
            });
        }
    });

    describe("malformed and unsupported input", function () {
        const invalidWire = [
            ["field zero", [0]],
            ["truncated tag", [0x80]],
            ["invalid wire type", [0xa6, 0x06]],
            ["truncated length-delimited field", [0xa2, 0x06, 2, 1]],
            ["truncated fixed64", [0xa1, 0x06, 1]],
            ["truncated fixed32", [0xa5, 0x06, 1]],
            ["mistyped batch operation", [0xd0, 0x04, 1]],
        ];
        for (const [name, suffix] of invalidWire) {
            it(`rejects outer body ${name}`, async function () {
                await expectRejected(
                    listWithBodies([
                        joinBytes(ordinaryBody, new Uint8Array(suffix)),
                    ]),
                );
            });
            it(`rejects child body ${name}`, async function () {
                const child = proto.SignedTransaction.decode(
                    childEnvelopes[0],
                ).bodyBytes;
                await expectRejected(
                    batchWithChildBody(
                        joinBytes(child, new Uint8Array(suffix)),
                    ),
                );
            });
            if (name !== "mistyped batch operation") {
                it(`rejects malformed child envelope metadata: ${name}`, async function () {
                    await expectRejected(
                        batchWithWrapper(
                            record(
                                1,
                                joinBytes(
                                    childEnvelopes[0],
                                    new Uint8Array(suffix),
                                ),
                            ),
                        ),
                    );
                });
            }
        }

        for (const [name, wrapper] of [
            ["incorrect child wire type", new Uint8Array([8, 1])],
            [
                "unknown wrapper field",
                joinBytes(
                    record(1, childEnvelopes[0]),
                    record(2, new Uint8Array([1])),
                ),
            ],
            ["truncated wrapper", new Uint8Array([10, 2, 1])],
            ["child without an operation", record(1, record(1, outerBody))],
        ]) {
            it(`rejects ${name}`, async function () {
                await expectRejected(batchWithWrapper(wrapper));
            });
        }

        for (const field of ["transactionID", "nodeAccountID"]) {
            it(`rejects missing ${field}`, async function () {
                const decoded = proto.TransactionBody.decode(ordinaryBody);
                await expectRejected(
                    listWithBodies([
                        proto.TransactionBody.encode({
                            ...decoded,
                            [field]: null,
                        }).finish(),
                    ]),
                );
            });
            it(`rejects child missing ${field}`, async function () {
                const child = proto.TransactionBody.decode(
                    proto.SignedTransaction.decode(childEnvelopes[0]).bodyBytes,
                );
                await expectRejected(
                    batchWithChildBody(
                        proto.TransactionBody.encode({
                            ...child,
                            [field]: null,
                        }).finish(),
                    ),
                );
            });
        }

        it("ignores unknown signed-child envelope metadata while retaining its body", async function () {
            const baseline = batchWithWrapper(record(1, childEnvelopes[0]));
            const changed = batchWithWrapper(
                record(
                    1,
                    joinBytes(
                        childEnvelopes[0],
                        record(100, new Uint8Array([1, 2])),
                    ),
                ),
            );
            expect(
                await importFrozen(changed).getTransactionBodyHash(),
            ).toEqual(await importFrozen(baseline).getTransactionBodyHash());
        });

        for (const [name, bytes] of [
            ["empty input", new Uint8Array()],
            ["empty transaction envelope", record(1, new Uint8Array())],
            ["outer body without an operation", listWithBodies([outerBody])],
        ]) {
            it(`rejects ${name}`, async function () {
                await expectRejected(bytes);
            });
        }

        for (const operation of [{ cryptoTransfer: {} }, { fileAppend: {} }]) {
            it(`rejects repeated/conflicting outer and child ${
                Object.keys(operation)[0]
            }`, async function () {
                const extra = proto.TransactionBody.encode(operation).finish();
                await expectRejected(
                    listWithBodies([joinBytes(ordinaryBody, extra)]),
                );
                const child = proto.SignedTransaction.decode(
                    childEnvelopes[0],
                ).bodyBytes;
                await expectRejected(
                    batchWithChildBody(joinBytes(child, extra)),
                );
            });
        }

        it("rejects duplicate decoded IDs even when their wire representations differ", async function () {
            const decoded = proto.TransactionBody.decode(ordinaryBody);
            const variant = proto.TransactionBody.encode({
                ...decoded,
                nodeAccountID: { accountNum: decoded.nodeAccountID.accountNum },
            }).finish();
            expect(variant).not.toEqual(ordinaryBody);
            await expectRejected(listWithBodies([ordinaryBody, variant]));
        });

        for (const [name, change] of [
            [
                "extra node in a later chunk",
                (body) => {
                    if (body.nodeAccountID.accountNum.toString() === "3") {
                        body.nodeAccountID.accountNum = 5;
                    }
                },
            ],
            [
                "changed memo across chunks",
                (body) => {
                    body.memo = "different";
                },
            ],
            [
                "changed file ID across chunks",
                (body) => {
                    body.fileAppend.fileID.fileNum = 2000;
                },
            ],
            [
                "changed operation across chunks",
                (body) => {
                    body.fileAppend = null;
                    body.cryptoTransfer = {};
                },
            ],
        ]) {
            it(`retains existing content/chunk invariants: ${name}`, async function () {
                const bodies = bodiesIn(fixtureBytes("chunk-major"));
                for (let i = 2; i < bodies.length; i++) {
                    const body = proto.TransactionBody.decode(bodies[i]);
                    change(body);
                    bodies[i] = proto.TransactionBody.encode(body).finish();
                }
                await expectRejected(listWithBodies(bodies));
            });
        }

        it("retains same-chunk content validation when regrouping a node-major list", async function () {
            const bodies = bodiesIn(fixtureBytes("chunk-major"));
            const body = proto.TransactionBody.decode(bodies[1]);
            body.fileAppend.contents = new TextEncoder().encode("DIFF");
            bodies[1] = proto.TransactionBody.encode(body).finish();
            await expectRejected(
                listWithBodies([bodies[0], bodies[2], bodies[1], bodies[3]]),
            );
        });

        it("rejects multiple transaction IDs for an ordinary operation", async function () {
            const first = proto.TransactionBody.decode(ordinaryBody);
            const second = proto.TransactionBody.decode(ordinaryBody);
            second.transactionID.transactionValidStart.nanos++;
            await expectRejected(
                listWithBodies([
                    proto.TransactionBody.encode(first).finish(),
                    proto.TransactionBody.encode(second).finish(),
                ]),
            );
        });
    });

    it("preserves accepted later-node wire order while dispatching the reviewed node's body", async function () {
        const bytes = fixtureBytes("later-node-order-normalized");
        const tx = importFrozen(bytes);
        const before = tx.toBytes();
        expect(bodiesIn(before).map(hex.encode)).toEqual(
            bodiesIn(bytes).map(hex.encode),
        );
        await tx.getTransactionBodyHash();
        tx._transactionIds.index = 1;
        tx._nodeAccountIds.index = 0;
        const request = await tx._makeRequestAsync();
        expect(
            hex.encode(
                proto.SignedTransaction.decode(request.signedTransactionBytes)
                    .bodyBytes,
            ),
        ).toBe(hex.encode(bodiesIn(bytes)[3]));
        expect(tx.toBytes()).toEqual(before);
    });

    it("serializes every reviewed deferred chunk once without moving cursors", async function () {
        const client = offlineClient();
        client.setSignOnDemand(true);
        try {
            const tx = append().freezeWith(client);
            const key = PrivateKey.generateED25519();
            const signed = [];
            await tx.signWith(key.publicKey, (body) => {
                signed.push(hex.encode(body));
                return Promise.resolve(key.sign(body));
            });
            tx._transactionIds.index = 1;
            tx._nodeAccountIds.index = 1;
            const hash = await tx.getTransactionBodyHash();
            const reviewed = preparedBodies(tx).map(hex.encode);
            const indexes = snapshot(tx).indexes;
            const wire = await tx.toBytesAsync();
            expect(bodiesIn(wire).map(hex.encode)).toEqual(reviewed);
            expect(signed).toEqual(reviewed);
            expect(snapshot(tx).indexes).toEqual(indexes);
            expect(await tx.getTransactionBodyHash()).toEqual(hash);
            expect(await tx.toBytesAsync()).toEqual(wire);
            expect(signed).toEqual(reviewed);
        } finally {
            client.close();
        }
    });

    it("rejects execution resets after review without discarding prepared bodies", async function () {
        const client = offlineClient();
        try {
            client.setOperator("0.0.1001", PrivateKey.generateED25519());
            const tx = append().freeze();
            const hash = await tx.getTransactionBodyHash();
            const before = snapshot(tx);
            expect(() => tx._resetTransaction(client)).toThrow(/reviewed/);
            expect(snapshot(tx)).toEqual(before);
            expect(await tx.getTransactionBodyHash()).toEqual(hash);
        } finally {
            client.close();
        }
    });

    describe("reviewed batch-child and re-freeze regressions", function () {
        for (const signed of [false, true]) {
            it(`roundtrips a fresh ${
                signed ? "signed" : "unsigned"
            } standalone batch child with its explicit zero node`, async function () {
                const key = PrivateKey.generateED25519();
                const child = new TransferTransaction()
                    .setTransactionId(transactionId())
                    .setBatchKey(key.publicKey)
                    .freeze();
                if (signed) await child.sign(key);
                const hash = await child.getTransactionBodyHash();
                const wire = child.toBytes();
                const imported = Transaction.fromBytes(wire);
                expect(imported.isFrozen()).toBe(true);
                expect(await imported.getTransactionBodyHash()).toEqual(hash);
                expect(
                    imported.nodeAccountIds.map((id) => id.toString()),
                ).toEqual(["0.0.0"]);
                expect(imported.toBytes()).toEqual(wire);
                expect(preparedBodies(imported).map(hex.encode)).toEqual(
                    preparedBodies(child).map(hex.encode),
                );
                expect(
                    signedEnvelopes(imported.toBytes())[0].sigMap?.sigPair
                        ?.length ?? 0,
                ).toBe(signed ? 1 : 0);
                expect(
                    await Transaction.fromBytes(
                        imported.toBytes(),
                    ).getTransactionBodyHash(),
                ).toEqual(hash);
                await imported.sign(PrivateKey.generateED25519());
                expect(await imported.getTransactionBodyHash()).toEqual(hash);
                expect(
                    signedEnvelopes(imported.toBytes())[0].sigMap.sigPair,
                ).toHaveLength(signed ? 2 : 1);
            });

            it(`roundtrips a ${
                signed ? "signed" : "unsigned"
            } child embedded in a batch with its IDs and original body`, async function () {
                const key = PrivateKey.generateED25519();
                const child = new TransferTransaction()
                    .setTransactionId(transactionId())
                    .setBatchKey(key.publicKey)
                    .freeze();
                if (signed) await child.sign(key);
                const childHash = await child.getTransactionBodyHash();
                const childWire = child.toBytes();
                const batch = new BatchTransaction()
                    .addInnerTransaction(child)
                    .setTransactionId(transactionId(124))
                    .setNodeAccountIds(nodes)
                    .freeze();
                if (signed) await batch.sign(key);
                const hash = await batch.getTransactionBodyHash();
                const wire = batch.toBytes();
                const imported = Transaction.fromBytes(wire);
                const embedded = imported.innerTransactions[0];
                expect(embedded.isFrozen()).toBe(true);
                expect(await embedded.getTransactionBodyHash()).toEqual(
                    childHash,
                );
                expect(embedded.transactionId.toString()).toBe(
                    child.transactionId.toString(),
                );
                expect(
                    embedded.nodeAccountIds.map((id) => id.toString()),
                ).toEqual(["0.0.0"]);
                expect(embedded.toBytes()).toEqual(childWire);
                expect(
                    await Transaction.fromBytes(
                        embedded.toBytes(),
                    ).getTransactionBodyHash(),
                ).toEqual(childHash);
                expect(await imported.getTransactionBodyHash()).toEqual(hash);
                expect(imported.toBytes()).toEqual(wire);
            });
        }

        for (const [name, build] of [
            [
                "transaction ID",
                () =>
                    new TransferTransaction().setNodeAccountIds([
                        new AccountId(0),
                    ]),
            ],
            [
                "node ID",
                () =>
                    new TransferTransaction().setTransactionId(transactionId()),
            ],
        ]) {
            it(`keeps partial imports missing a ${name} unfrozen and configurable`, async function () {
                const imported = Transaction.fromBytes(build().toBytes());
                expect(imported.isFrozen()).toBe(false);
                expect(imported.nodeAccountIds).toBeNull();
                imported
                    .setTransactionId(transactionId())
                    .setNodeAccountIds(nodes)
                    .freeze();
                expect(await imported.getTransactionBodyHash()).toHaveLength(
                    48,
                );
            });
        }

        for (const [name, build, chunks] of [
            ["ordinary", transfer, 1],
            ["file append", append, 2],
            ["topic message", topic, 2],
        ]) {
            for (const method of ["freeze", "freezeWith"]) {
                it(`preserves reviewed imported ${name} IDs, chunk boundaries, original bytes and signatures on ${method}`, async function () {
                    const client = offlineClient();
                    client.setSignOnDemand(true);
                    client.setOperator(
                        "0.0.1001",
                        PrivateKey.generateED25519(),
                    );
                    try {
                        const original = preparedBodies(build().freeze()).map(
                            (body) =>
                                joinBytes(
                                    body,
                                    new Uint8Array([0xa0, 0x06, 0x80, 0x00]),
                                    record(101, new Uint8Array([0, 255])),
                                ),
                        );
                        const tx = Transaction.fromBytes(
                            listWithBodies(original),
                        );
                        await tx.sign(PrivateKey.generateED25519());
                        tx._transactionIds.index = chunks - 1;
                        tx._nodeAccountIds.index = 1;
                        const hash = await tx.getTransactionBodyHash();
                        const wire = tx.toBytes();
                        const before = snapshot(tx);
                        const signOnDemand = tx._signOnDemand;
                        const operator = tx._operator;
                        const operatorAccountId = tx._operatorAccountId;
                        expect(before.ids).toHaveLength(chunks);
                        expect(before.signed).toHaveLength(
                            chunks * nodes.length,
                        );
                        expect(preparedBodies(tx).map(hex.encode)).toEqual(
                            original.map(hex.encode),
                        );
                        expect(
                            signedEnvelopes(wire).every(
                                (entry) => entry.sigMap.sigPair.length === 1,
                            ),
                        ).toBe(true);
                        const result =
                            method === "freeze"
                                ? tx.freeze()
                                : tx.freezeWith(client);
                        expect(result).toBe(tx);
                        expect(snapshot(tx)).toEqual(before);
                        expect(tx._signOnDemand).toBe(signOnDemand);
                        expect(tx._operator).toBe(operator);
                        expect(tx._operatorAccountId).toBe(operatorAccountId);
                        expect(preparedBodies(tx).map(hex.encode)).toEqual(
                            original.map(hex.encode),
                        );
                        expect(await tx.getTransactionBodyHash()).toEqual(hash);
                        expect(tx.toBytes()).toEqual(wire);
                    } finally {
                        client.close();
                    }
                });
            }
        }

        it("keeps reviewed ordinary deferred signers registered across re-freezing", async function () {
            const client = offlineClient();
            client.setSignOnDemand(true);
            try {
                const tx = transfer().freezeWith(client);
                const key = PrivateKey.generateED25519();
                const signed = [];
                await tx.signWith(key.publicKey, (body) => {
                    signed.push(hex.encode(body));
                    return Promise.resolve(key.sign(body));
                });
                const hash = await tx.getTransactionBodyHash();
                const before = snapshot(tx);
                tx.freeze();
                expect(tx._signOnDemand).toBe(true);
                expect(snapshot(tx)).toEqual(before);
                expect(signed).toEqual([]);
                expect(await tx.getTransactionBodyHash()).toEqual(hash);
                const wire = await tx.toBytesAsync();
                expect(signed).toEqual(preparedBodies(tx).map(hex.encode));
                expect(
                    signedEnvelopes(wire).every(
                        (entry) => entry.sigMap.sigPair.length === 1,
                    ),
                ).toBe(true);
            } finally {
                client.close();
            }
        });
    });

    describe("batch node content consistency excludes child envelope metadata", function () {
        const expected =
            "841a324c41d819fbbe63282a2ffef773a50914e592df000acca1bd6b8de820d2a92558f59657b7a0787a8a1680ea56cd";

        function changeSecondNodeChildren(change) {
            const bodies = bodiesIn(fixtureBytes("batch-multi-node-unsigned"));
            const children = proto.TransactionBody.decode(bodies[1]).atomicBatch
                .transactions;
            const original = record(
                74,
                joinBytes(...children.map((child) => record(1, child))),
            );
            const prefixLength = bodies[1].length - original.length;
            // These fixtures end in field 74; preserve every other original body byte.
            expect(hex.encode(bodies[1].subarray(prefixLength))).toBe(
                hex.encode(original),
            );
            const changed = record(
                74,
                joinBytes(...change(children).map((child) => record(1, child))),
            );
            bodies[1] = joinBytes(bodies[1].subarray(0, prefixLength), changed);
            return listWithBodies(bodies);
        }

        for (const [name, change] of [
            [
                "sigMap",
                (bytes) =>
                    proto.SignedTransaction.encode({
                        ...proto.SignedTransaction.decode(bytes),
                        sigMap: {
                            sigPair: [
                                {
                                    pubKeyPrefix: new Uint8Array(32).fill(1),
                                    ed25519: new Uint8Array(64).fill(2),
                                },
                            ],
                        },
                    }).finish(),
            ],
            [
                "algorithm flag",
                (bytes) =>
                    proto.SignedTransaction.encode({
                        ...proto.SignedTransaction.decode(bytes),
                        useSerializedTxMessageHashAlgorithm: true,
                    }).finish(),
            ],
            [
                "unknown metadata",
                (bytes) =>
                    joinBytes(bytes, record(100, new Uint8Array([1, 2]))),
            ],
        ]) {
            it(`accepts child ${name} differing in only one node without changing stored bytes or network hashes`, async function () {
                const bytes = changeSecondNodeChildren((children) => [
                    change(children[0]),
                    ...children.slice(1),
                ]);
                const original = bytes.slice();
                const tx = importFrozen(bytes);
                const wire = tx.toBytes();
                const networkHash = await tx.getTransactionHash();
                const nodeHashes = (
                    await tx.getTransactionHashPerNode()
                ).toString();
                const hash = await tx.getTransactionBodyHash();
                expect(hex.encode(hash)).toBe(expected);
                expect(await tx.getTransactionBodyHash()).toEqual(hash);
                expect(tx.toBytes()).toEqual(wire);
                expect(preparedBodies(tx).map(hex.encode)).toEqual(
                    bodiesIn(bytes).map(hex.encode),
                );
                expect(await tx.getTransactionHash()).toEqual(networkHash);
                expect((await tx.getTransactionHashPerNode()).toString()).toBe(
                    nodeHashes,
                );
                expect(bytes).toEqual(original);
                await tx.sign(PrivateKey.generateED25519());
                expect(await tx.getTransactionBodyHash()).toEqual(hash);
                expect(preparedBodies(tx).map(hex.encode)).toEqual(
                    bodiesIn(bytes).map(hex.encode),
                );
                expect(
                    hex.encode(
                        await importFrozen(
                            tx.toBytes(),
                        ).getTransactionBodyHash(),
                    ),
                ).toBe(expected);
            });
        }

        for (const [name, change] of [
            [
                "changed child body",
                (children) => {
                    const child = proto.SignedTransaction.decode(children[0]);
                    return [
                        proto.SignedTransaction.encode({
                            ...child,
                            bodyBytes: joinBytes(
                                child.bodyBytes,
                                record(100, new Uint8Array([1])),
                            ),
                        }).finish(),
                        ...children.slice(1),
                    ];
                },
            ],
            [
                "different encoding of the same child memo",
                (children) => {
                    const child = proto.SignedTransaction.decode(children[0]);
                    const memo = proto.TransactionBody.decode(
                        child.bodyBytes,
                    ).memo;
                    return [
                        proto.SignedTransaction.encode({
                            ...child,
                            bodyBytes: joinBytes(
                                child.bodyBytes,
                                record(6, new TextEncoder().encode(memo)),
                            ),
                        }).finish(),
                        ...children.slice(1),
                    ];
                },
            ],
            ["changed child order", (children) => [...children].reverse()],
            ["changed child count", (children) => children.slice(1)],
        ]) {
            it(`rejects ${name} in only one node`, async function () {
                await expectRejected(changeSecondNodeChildren(change));
            });
        }

        it("retains checks for other outer fields when child signatures differ", async function () {
            const bodies = bodiesIn(
                fixtureBytes("batch-multi-node-mixed-child-signatures"),
            );
            const changed = proto.TransactionBody.decode(bodies[1]);
            changed.memo = "different outer content";
            bodies[1] = proto.TransactionBody.encode(changed).finish();
            await expectRejected(listWithBodies(bodies));
        });
    });
});
