// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function channelId() {
    return new Uint8Array(hex.decode(vectors.channelId));
}

function bundlePayload() {
    return new Uint8Array([0, 255, 128, 0, 13, 10, 195, 40, 1]);
}

function submitBundle(props) {
    expect(
        sdk.ClprSubmitBundleTransaction,
        "SDK must export ClprSubmitBundleTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprSubmitBundleTransaction(props);
}

function offline(transaction) {
    return transaction
        .setNodeAccountIds([new sdk.AccountId(3), new sdk.AccountId(4)])
        .setTransactionId(
            sdk.TransactionId.withValidStart(
                new sdk.AccountId(5006),
                new sdk.Timestamp(1596210382, 0),
            ),
        )
        .setMaxTransactionFee(new sdk.Hbar(1));
}

function expectNoDeprecatedAccessors(transaction) {
    for (const name of [
        "endpointNodeId",
        "endpointSignature",
        "getEndpointNodeId",
        "setEndpointNodeId",
        "getEndpointSignature",
        "setEndpointSignature",
    ]) {
        expect(name in transaction, `${name} must not be public`).toBe(false);
    }
}

const byteFields = [
    ["channelId", "setChannelId", channelId],
    ["bundlePayload", "setBundlePayload", bundlePayload],
];

const schedulingPaths = [
    ["schedule()", (transaction) => transaction.schedule()],
    [
        "ScheduleCreateTransaction.setScheduledTransaction()",
        (transaction) =>
            new sdk.ScheduleCreateTransaction().setScheduledTransaction(
                transaction,
            ),
    ],
    [
        "_getScheduledTransactionBody()",
        (transaction) => transaction._getScheduledTransactionBody(),
    ],
];

describe("ClprSubmitBundleTransaction", function () {
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprSubmitBundleTransaction).toBeTypeOf("function");
        expect(entry.ClprSubmitBundleTransaction).toBe(
            sdk.ClprSubmitBundleTransaction,
        );
    });

    it.each([
        ["empty bytes", new Uint8Array()],
        ["opaque non-text bytes", bundlePayload()],
    ])("round-trips %s and transaction identifiers", function (_name, payload) {
        const transaction = offline(
            submitBundle({ channelId: channelId(), bundlePayload: payload }),
        );
        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(sdk.ClprSubmitBundleTransaction);
        expect(decoded.channelId).toEqual(channelId());
        expect(decoded.bundlePayload).toEqual(payload);
        expect(decoded.transactionId.toString()).toBe(
            transaction.transactionId.toString(),
        );
        expect(decoded.nodeAccountIds.map(String)).toEqual(["0.0.3", "0.0.4"]);
        expect(decoded.toBytes()).toEqual(bytes);
    });

    it("preserves opaque bytes, both signing schemes and every node signature", async function () {
        const transaction = offline(
            submitBundle()
                .setChannelId(channelId())
                .setBundlePayload(bundlePayload()),
        ).freeze();
        const keys = [
            sdk.PrivateKey.fromStringECDSA(vectors.vectors[0].privateKeyOrSeed),
            sdk.PrivateKey.fromStringED25519(
                vectors.vectors[1].privateKeyOrSeed,
            ),
        ];
        for (const key of keys) {
            await transaction.sign(key);
        }

        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(sdk.ClprSubmitBundleTransaction);
        expect(decoded.channelId).toEqual(channelId());
        expect(decoded.bundlePayload).toEqual(bundlePayload());
        expect(decoded.toBytes()).toEqual(bytes);
        expect(decoded.getSignatures().size).toBe(2);
        for (const [, nodeSignatures] of decoded.getSignatures()) {
            const signatures = nodeSignatures.get(decoded.transactionId);
            expect(signatures.size).toBe(2);
            for (const key of keys) {
                expect(signatures.get(key.publicKey)).toBeInstanceOf(
                    Uint8Array,
                );
                expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
            }
        }
    });

    it.each(["freeze", "freezeWith"])(
        "rejects %s without channelId before freezing",
        function (method) {
            const transaction = offline(
                submitBundle().setBundlePayload(bundlePayload()),
            );

            expect(transaction.channelId).toBeNull();
            expect(() => transaction[method](null)).toThrow(/channelId/);
            expect(transaction.isFrozen()).toBe(false);
            transaction.setChannelId(channelId());
            expect(() => transaction[method](null)).not.toThrow();
        },
    );

    it("requires only channelId locally without interpreting the payload", function () {
        const transaction = offline(submitBundle().setChannelId(channelId()));

        expect(() => transaction.freeze()).not.toThrow();
    });

    it.each([31, 33])(
        "rejects a %i-byte channelId without changing any builder fields",
        function (length) {
            const transaction = offline(
                submitBundle({
                    channelId: channelId(),
                    bundlePayload: bundlePayload(),
                }),
            );
            const bytes = transaction.toBytes();

            expect(() =>
                transaction.setChannelId(new Uint8Array(length)),
            ).toThrow(/channelId/);
            expect(transaction.channelId).toEqual(channelId());
            expect(transaction.bundlePayload).toEqual(bundlePayload());
            expect(transaction.isFrozen()).toBe(false);
            expect(transaction.toBytes()).toEqual(bytes);
        },
    );

    it.each([31, 33])(
        "rejects a %i-byte channelId in the constructor",
        function (length) {
            submitBundle();
            expect(() =>
                submitBundle({ channelId: new Uint8Array(length) }),
            ).toThrow(/channelId/);
        },
    );

    describe.each(byteFields)("%s", function (field, setter, value) {
        it("returns the builder from its setter", function () {
            const transaction = submitBundle();
            expect(transaction[setter](value())).toBe(transaction);
        });

        it.each(["constructor", "setter"])(
            "copies bytes on input and output through the %s",
            function (path) {
                const input = value();
                const transaction =
                    path === "constructor"
                        ? submitBundle({ [field]: input })
                        : submitBundle()[setter](input);

                input.fill(127);
                expect(transaction[field]).toEqual(value());
                transaction[field].fill(127);
                expect(transaction[field]).toEqual(value());
            },
        );

        it("rejects its setter after freeze and preserves signed bytes", async function () {
            const transaction = offline(
                submitBundle({
                    channelId: channelId(),
                    bundlePayload: bundlePayload(),
                }),
            ).freeze();
            const key = sdk.PrivateKey.fromStringED25519(
                vectors.vectors[1].privateKeyOrSeed,
            );
            await transaction.sign(key);
            const bytes = transaction.toBytes();

            expect(() => transaction[setter](new Uint8Array(32))).toThrow(
                /immutable/,
            );
            expect(transaction[field]).toEqual(value());
            expect(transaction.toBytes()).toEqual(bytes);
            expect(key.publicKey.verifyTransaction(transaction)).toBe(true);
        });
    });

    it("builds only channelId and bundlePayload and exposes no deprecated accessors", function () {
        const transaction = offline(
            submitBundle({
                channelId: channelId(),
                bundlePayload: bundlePayload(),
            }),
        ).freeze();
        const list = proto.TransactionList.decode(transaction.toBytes());
        const signed = proto.SignedTransaction.decode(
            list.transactionList[0].signedTransactionBytes,
        );
        const body = proto.TransactionBody.decode(signed.bodyBytes);

        expect(body.data).toBe("clprSubmitBundle");
        expect(Object.keys(body.clprSubmitBundle).sort()).toEqual([
            "bundlePayload",
            "channelId",
        ]);
        expect(Uint8Array.from(body.clprSubmitBundle.channelId)).toEqual(
            channelId(),
        );
        expect(Uint8Array.from(body.clprSubmitBundle.bundlePayload)).toEqual(
            bundlePayload(),
        );
        expectNoDeprecatedAccessors(transaction);
    });

    it("keeps decoded signed bytes with deprecated wire fields without exposing them", function () {
        expect(sdk.ClprSubmitBundleTransaction).toBeTypeOf("function");
        const key = sdk.PrivateKey.fromStringED25519(
            vectors.vectors[1].privateKeyOrSeed,
        );
        const endpointSignature = new Uint8Array(65).fill(17);
        const bodyBytes = proto.TransactionBody.encode({
            transactionID: sdk.TransactionId.fromString(
                "0.0.5006@1596210382.0",
            )._toProtobuf(),
            nodeAccountID: new sdk.AccountId(3)._toProtobuf(),
            transactionFee: new sdk.Hbar(1).toTinybars(),
            transactionValidDuration: { seconds: 120 },
            clprSubmitBundle: {
                channelId: channelId(),
                bundlePayload: bundlePayload(),
                endpointNodeId: Long.fromString("9007199254740993", true),
                endpointSignature,
            },
        }).finish();
        const bytes = proto.TransactionList.encode({
            transactionList: [
                {
                    signedTransactionBytes: proto.SignedTransaction.encode({
                        bodyBytes,
                        sigMap: {
                            sigPair: [
                                {
                                    pubKeyPrefix: key.publicKey.toBytesRaw(),
                                    ed25519: key.sign(bodyBytes),
                                },
                            ],
                        },
                    }).finish(),
                },
            ],
        }).finish();

        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(sdk.ClprSubmitBundleTransaction);
        expect(decoded.channelId).toEqual(channelId());
        expect(decoded.bundlePayload).toEqual(bundlePayload());
        expectNoDeprecatedAccessors(decoded);
        // Signed body bytes are preserved under the binding notes decision.
        expect(decoded.toBytes()).toEqual(bytes);
        expect(key.publicKey.verifyTransaction(decoded)).toBe(true);

        const rebuilt = offline(
            submitBundle({
                channelId: decoded.channelId,
                bundlePayload: decoded.bundlePayload,
            }),
        ).freeze();
        const list = proto.TransactionList.decode(rebuilt.toBytes());
        const signed = proto.SignedTransaction.decode(
            list.transactionList[0].signedTransactionBytes,
        );
        const body = proto.TransactionBody.decode(signed.bodyBytes);
        expect(Object.hasOwn(body.clprSubmitBundle, "endpointNodeId")).toBe(
            false,
        );
        expect(Object.hasOwn(body.clprSubmitBundle, "endpointSignature")).toBe(
            false,
        );
    });

    it.each(schedulingPaths)("refuses %s", function (_name, schedule) {
        const transaction = submitBundle().setChannelId(channelId());

        expect(() => schedule(transaction)).toThrow(
            new Error("ClprSubmitBundleTransaction cannot be scheduled"),
        );
    });
});
