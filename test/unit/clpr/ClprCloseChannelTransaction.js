// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function channelId() {
    return new Uint8Array(hex.decode(vectors.channelId));
}

function commitment() {
    return new Uint8Array(hex.decode(vectors.vectors[0].channelCommitment));
}

function closeChannel(props) {
    expect(
        sdk.ClprCloseChannelTransaction,
        "SDK must export ClprCloseChannelTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprCloseChannelTransaction(props);
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

const byteFields = [
    ["channelId", "setChannelId", channelId],
    ["ownershipCommitment", "setOwnershipCommitment", commitment],
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

describe("ClprCloseChannelTransaction", function () {
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprCloseChannelTransaction).toBeTypeOf("function");
        expect(entry.ClprCloseChannelTransaction).toBe(
            sdk.ClprCloseChannelTransaction,
        );
    });

    it.each([false, true])(
        "round-trips fields and identifiers with ownershipCommitment set to %s",
        function (withCommitment) {
            const transaction = offline(
                closeChannel({
                    channelId: channelId(),
                    ownershipCommitment: withCommitment
                        ? commitment()
                        : undefined,
                }),
            );
            const bytes = transaction.toBytes();
            const decoded = sdk.Transaction.fromBytes(bytes);

            expect(decoded).toBeInstanceOf(sdk.ClprCloseChannelTransaction);
            expect(decoded.channelId).toEqual(channelId());
            expect(decoded.ownershipCommitment).toEqual(
                withCommitment ? commitment() : null,
            );
            expect(decoded.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            expect(decoded.nodeAccountIds.map(String)).toEqual([
                "0.0.3",
                "0.0.4",
            ]);
            expect(decoded.toBytes()).toEqual(bytes);
        },
    );

    it.each([false, true])(
        "preserves both signing schemes and every node signature with ownershipCommitment set to %s",
        async function (withCommitment) {
            const transaction = offline(
                closeChannel().setChannelId(channelId()),
            );
            if (withCommitment) {
                transaction.setOwnershipCommitment(commitment());
            }
            transaction.freeze();
            const keys = [
                sdk.PrivateKey.fromStringECDSA(
                    vectors.vectors[0].privateKeyOrSeed,
                ),
                sdk.PrivateKey.fromStringED25519(
                    vectors.vectors[1].privateKeyOrSeed,
                ),
            ];
            for (const key of keys) {
                await transaction.sign(key);
            }

            const bytes = transaction.toBytes();
            const decoded = sdk.Transaction.fromBytes(bytes);

            expect(decoded).toBeInstanceOf(sdk.ClprCloseChannelTransaction);
            expect(decoded.channelId).toEqual(channelId());
            expect(decoded.ownershipCommitment).toEqual(
                withCommitment ? commitment() : null,
            );
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
        },
    );

    it.each(["freeze", "freezeWith"])(
        "rejects %s without channelId before freezing",
        function (method) {
            const transaction = offline(
                closeChannel().setOwnershipCommitment(commitment()),
            );

            expect(transaction.channelId).toBeNull();
            expect(() => transaction[method](null)).toThrow(/channelId/);
            expect(transaction.isFrozen()).toBe(false);
            transaction.setChannelId(channelId());
            expect(() => transaction[method](null)).not.toThrow();
        },
    );

    it("allows closing an existing Channel without an ownership commitment", function () {
        const transaction = offline(closeChannel().setChannelId(channelId()));

        expect(transaction.ownershipCommitment).toBeNull();
        expect(() => transaction.freeze()).not.toThrow();
        const list = proto.TransactionList.decode(transaction.toBytes());
        const signed = proto.SignedTransaction.decode(
            list.transactionList[0].signedTransactionBytes,
        );
        const body = proto.TransactionBody.decode(signed.bodyBytes);
        expect(body.data).toBe("clprCloseChannel");
        expect(
            Object.hasOwn(body.clprCloseChannel, "ownershipCommitment"),
        ).toBe(false);
    });

    describe.each(byteFields)("%s", function (field, setter, value) {
        it("returns the builder from its setter", function () {
            const transaction = closeChannel();
            expect(transaction[setter](value())).toBe(transaction);
        });

        it.each([31, 33])(
            "rejects %i bytes without changing any builder fields",
            function (length) {
                const transaction = offline(
                    closeChannel({
                        channelId: channelId(),
                        ownershipCommitment: commitment(),
                    }),
                );
                const bytes = transaction.toBytes();

                expect(() =>
                    transaction[setter](new Uint8Array(length)),
                ).toThrow(new RegExp(field));
                expect(transaction.channelId).toEqual(channelId());
                expect(transaction.ownershipCommitment).toEqual(commitment());
                expect(transaction.isFrozen()).toBe(false);
                expect(transaction.toBytes()).toEqual(bytes);
            },
        );

        it.each([31, 33])(
            "rejects %i bytes in the constructor",
            function (length) {
                closeChannel();
                expect(() =>
                    closeChannel({ [field]: new Uint8Array(length) }),
                ).toThrow(new RegExp(field));
            },
        );

        it.each(["constructor", "setter"])(
            "copies bytes on input and output through the %s",
            function (path) {
                const input = value();
                const transaction =
                    path === "constructor"
                        ? closeChannel({ [field]: input })
                        : closeChannel()[setter](input);

                input.fill(255);
                expect(transaction[field]).toEqual(value());
                transaction[field].fill(255);
                expect(transaction[field]).toEqual(value());
            },
        );

        it("rejects its setter after freeze and preserves signed bytes", async function () {
            const transaction = offline(
                closeChannel({
                    channelId: channelId(),
                    ownershipCommitment: commitment(),
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

    it.each(schedulingPaths)("refuses %s", function (_name, schedule) {
        const transaction = closeChannel().setChannelId(channelId());

        expect(() => schedule(transaction)).toThrow(
            new Error("ClprCloseChannelTransaction cannot be scheduled"),
        );
    });
});
