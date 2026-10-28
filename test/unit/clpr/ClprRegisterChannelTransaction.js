// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function commitment() {
    return new Uint8Array(hex.decode(vectors.vectors[0].channelCommitment));
}

function privateKey(vector) {
    return vector.signatureScheme === "ECDSA_SECP256K1"
        ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
        : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
}

function registerChannel(props) {
    expect(
        sdk.ClprRegisterChannelTransaction,
        "SDK must export ClprRegisterChannelTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprRegisterChannelTransaction(props);
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

describe("ClprRegisterChannelTransaction", function () {
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprRegisterChannelTransaction).toBeTypeOf("function");
        expect(entry.ClprRegisterChannelTransaction).toBe(
            sdk.ClprRegisterChannelTransaction,
        );
    });

    it("round-trips an unsigned commitment and transaction identifiers", function () {
        const transaction = offline(
            registerChannel().setOwnershipCommitment(commitment()),
        );
        const decoded = sdk.Transaction.fromBytes(transaction.toBytes());

        expect(decoded).toBeInstanceOf(sdk.ClprRegisterChannelTransaction);
        expect(decoded.ownershipCommitment).toEqual(commitment());
        expect(decoded.transactionId.toString()).toBe(
            transaction.transactionId.toString(),
        );
        expect(decoded.nodeAccountIds.map(String)).toEqual(["0.0.3", "0.0.4"]);
        expect(decoded.toBytes()).toEqual(transaction.toBytes());
    });

    it("keeps both signing schemes and every node signature through bytes", async function () {
        const transaction = offline(
            registerChannel().setOwnershipCommitment(commitment()),
        ).freeze();
        const keys = vectors.vectors.map(privateKey);
        for (const key of keys) {
            await transaction.sign(key);
        }

        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(sdk.ClprRegisterChannelTransaction);
        expect(decoded.ownershipCommitment).toEqual(commitment());
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

    it("decodes a signed registerChannel wire body through the transaction registry", function () {
        const key = privateKey(vectors.vectors[1]);
        const bodyBytes = proto.TransactionBody.encode({
            transactionID: sdk.TransactionId.fromString(
                "0.0.5006@1596210382.0",
            )._toProtobuf(),
            nodeAccountID: new sdk.AccountId(3)._toProtobuf(),
            transactionFee: new sdk.Hbar(1).toTinybars(),
            transactionValidDuration: { seconds: 120 },
            clprRegisterChannel: { ownershipCommitment: commitment() },
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

        expect(decoded).toBeInstanceOf(sdk.ClprRegisterChannelTransaction);
        expect(decoded.ownershipCommitment).toEqual(commitment());
        expect(decoded.toBytes()).toEqual(bytes);
        expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
    });

    it.each(["freeze", "freezeWith"])(
        "rejects %s without an ownership commitment before freezing",
        function (method) {
            const transaction = offline(registerChannel());

            expect(transaction.ownershipCommitment).toBeNull();
            expect(() => transaction[method](null)).toThrow(
                /ownershipCommitment/,
            );
            expect(transaction.isFrozen()).toBe(false);
            transaction.setOwnershipCommitment(commitment());
            expect(() => transaction[method](null)).not.toThrow();
        },
    );

    it("returns the builder from the commitment setter", function () {
        const transaction = registerChannel();
        expect(transaction.setOwnershipCommitment(commitment())).toBe(
            transaction,
        );
    });

    it.each([31, 33])(
        "rejects a %i-byte commitment without changing an existing commitment",
        function (length) {
            const transaction = registerChannel().setOwnershipCommitment(
                commitment(),
            );

            expect(() =>
                transaction.setOwnershipCommitment(new Uint8Array(length)),
            ).toThrow(/ownershipCommitment/);
            expect(transaction.ownershipCommitment).toEqual(commitment());
        },
    );

    it.each([31, 33])(
        "rejects a %i-byte commitment in the constructor",
        function (length) {
            // Check the API first so a missing class cannot satisfy toThrow.
            registerChannel();
            expect(() =>
                registerChannel({
                    ownershipCommitment: new Uint8Array(length),
                }),
            ).toThrow(/ownershipCommitment/);
        },
    );

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["hex string", "00".repeat(32)],
        ["plain array", Array(32).fill(0)],
    ])(
        "rejects a non-byte commitment without changing the builder (%s)",
        function (_name, value) {
            const transaction = registerChannel().setOwnershipCommitment(
                commitment(),
            );

            expect(() => transaction.setOwnershipCommitment(value)).toThrow(
                /ownershipCommitment/,
            );
            expect(transaction.ownershipCommitment).toEqual(commitment());
        },
    );

    it.each(["constructor", "setter"])(
        "copies commitment bytes on input and output through the %s",
        function (path) {
            const input = commitment();
            const transaction =
                path === "constructor"
                    ? registerChannel({ ownershipCommitment: input })
                    : registerChannel().setOwnershipCommitment(input);

            input.fill(0);
            expect(transaction.ownershipCommitment).toEqual(commitment());
            const returned = transaction.ownershipCommitment;
            expect(returned).toBeInstanceOf(Uint8Array);
            returned.fill(0);
            expect(transaction.ownershipCommitment).toEqual(commitment());
        },
    );

    it("rejects the commitment setter after freeze and keeps signed bytes unchanged", async function () {
        const transaction = offline(
            registerChannel().setOwnershipCommitment(commitment()),
        ).freeze();
        await transaction.sign(privateKey(vectors.vectors[1]));
        const bytes = transaction.toBytes();

        expect(() =>
            transaction.setOwnershipCommitment(new Uint8Array(32)),
        ).toThrow(/immutable/);
        expect(transaction.toBytes()).toEqual(bytes);
        expect(transaction.ownershipCommitment).toEqual(commitment());
    });

    it.each(vectors.vectors)(
        "matches the HIP channelCommitment for $signatureScheme without changing inputs or a builder",
        function (vector) {
            const transaction = offline(
                registerChannel().setOwnershipCommitment(commitment()),
            ).freeze();
            const bytes = transaction.toBytes();
            const channelId = new Uint8Array(hex.decode(vectors.channelId));
            const publicKey = privateKey(vector).publicKey;
            const rawKey = new Uint8Array(publicKey.toBytesRaw());

            const result =
                sdk.ClprRegisterChannelTransaction.computeOwnershipCommitment(
                    channelId,
                    publicKey,
                );

            expect(result).toBeInstanceOf(Uint8Array);
            expect(hex.encode(result)).toBe(vector.channelCommitment);
            expect(hex.encode(channelId)).toBe(vectors.channelId);
            expect(publicKey.toBytesRaw()).toEqual(rawKey);
            expect(transaction.toBytes()).toEqual(bytes);
        },
    );

    it.each([31, 33])(
        "rejects a %i-byte Channel ID in the static helper",
        function (length) {
            registerChannel();
            expect(() =>
                sdk.ClprRegisterChannelTransaction.computeOwnershipCommitment(
                    new Uint8Array(length),
                    privateKey(vectors.vectors[1]).publicKey,
                ),
            ).toThrow(/channelId/);
        },
    );

    it("rejects a non-PublicKey in the static helper", function () {
        registerChannel();
        expect(() =>
            sdk.ClprRegisterChannelTransaction.computeOwnershipCommitment(
                new Uint8Array(hex.decode(vectors.channelId)),
                privateKey(vectors.vectors[1]),
            ),
        ).toThrow(/PublicKey/);
    });

    it.each(schedulingPaths)("refuses %s", function (_name, schedule) {
        const transaction = registerChannel().setOwnershipCommitment(
            commitment(),
        );

        expect(() => schedule(transaction)).toThrow(
            new Error("ClprRegisterChannelTransaction cannot be scheduled"),
        );
    });
});

describe("Transaction schedulability option", function () {
    class NonSchedulableTransferTransaction extends sdk.TransferTransaction {
        _isSchedulable() {
            return false;
        }
    }

    it.each(schedulingPaths)(
        "enforces the shared opt-out through %s",
        function (_name, schedule) {
            const transaction = new NonSchedulableTransferTransaction();

            expect(() => schedule(transaction)).toThrow(
                new Error(
                    "NonSchedulableTransferTransaction cannot be scheduled",
                ),
            );
        },
    );

    it.each(schedulingPaths)(
        "keeps existing transfers schedulable through %s by default",
        function (_name, schedule) {
            const transaction = new sdk.TransferTransaction()
                .addHbarTransfer("0.0.5", -1)
                .addHbarTransfer("0.0.6", 1);

            expect(() => schedule(transaction)).not.toThrow();
        },
    );
});
