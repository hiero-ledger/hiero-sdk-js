// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function commitment() {
    return new Uint8Array(hex.decode(vectors.vectors[0].connectorCommitment));
}

function privateKey(vector) {
    return vector.signatureScheme === "ECDSA_SECP256K1"
        ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
        : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
}

function registerConnector(props) {
    expect(
        sdk.ClprRegisterConnectorTransaction,
        "SDK must export ClprRegisterConnectorTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprRegisterConnectorTransaction(props);
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

describe("ClprRegisterConnectorTransaction", function () {
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprRegisterConnectorTransaction).toBeTypeOf("function");
        expect(entry.ClprRegisterConnectorTransaction).toBe(
            sdk.ClprRegisterConnectorTransaction,
        );
    });

    it.each(vectors.vectors)(
        "matches both HIP Connector statics for $signatureScheme without mutating inputs or a builder",
        function (vector) {
            const transaction = offline(
                registerConnector({ commitment: commitment() }),
            ).freeze();
            const bytes = transaction.toBytes();
            const channelId = new Uint8Array(hex.decode(vectors.channelId));
            const salt = new Uint8Array(hex.decode(vectors.salt));
            const publicKey = privateKey(vector).publicKey;
            const rawKey = new Uint8Array(publicKey.toBytesRaw());

            const connectorId =
                sdk.ClprRegisterConnectorTransaction.computeConnectorId(
                    channelId,
                    publicKey,
                    salt,
                );
            expect(connectorId).toBeInstanceOf(Uint8Array);
            expect(hex.encode(connectorId)).toBe(vector.connectorId);
            const result =
                sdk.ClprRegisterConnectorTransaction.computeOwnershipCommitment(
                    connectorId,
                    publicKey,
                );
            expect(result).toBeInstanceOf(Uint8Array);
            expect(hex.encode(result)).toBe(vector.connectorCommitment);
            connectorId.fill(0);
            result.fill(0);
            expect(hex.encode(channelId)).toBe(vectors.channelId);
            expect(hex.encode(salt)).toBe(vectors.salt);
            expect(publicKey.toBytesRaw()).toEqual(rawKey);
            expect(transaction.toBytes()).toEqual(bytes);
        },
    );

    for (const [method, field, index] of [
        ["computeConnectorId", "channelId", 0],
        ["computeConnectorId", "salt", 2],
        ["computeOwnershipCommitment", "connectorId", 0],
    ]) {
        it.each([31, 33])(
            `${method} rejects a %i-byte ${field}`,
            function (length) {
                registerConnector();
                const args =
                    method === "computeConnectorId"
                        ? [
                              hex.decode(vectors.channelId),
                              privateKey(vectors.vectors[1]).publicKey,
                              hex.decode(vectors.salt),
                          ]
                        : [
                              hex.decode(vectors.vectors[1].connectorId),
                              privateKey(vectors.vectors[1]).publicKey,
                          ];
                args[index] = new Uint8Array(length);

                expect(() =>
                    sdk.ClprRegisterConnectorTransaction[method](...args),
                ).toThrow(new RegExp(field));
            },
        );
    }

    for (const method of ["computeConnectorId", "computeOwnershipCommitment"]) {
        it.each([
            ["private key", () => privateKey(vectors.vectors[1])],
            ["key list", () => new sdk.KeyList([])],
            ["contract key", () => new sdk.ContractId(345)],
            ["base key", () => new sdk.Key()],
            ["null", () => null],
        ])(`${method} rejects an unsupported %s`, function (_name, value) {
            registerConnector();

            expect(() =>
                sdk.ClprRegisterConnectorTransaction[method](
                    hex.decode(vectors.vectors[1].connectorId),
                    value(),
                    hex.decode(vectors.salt),
                ),
            ).toThrow(/PublicKey|unsupported/);
        });
    }

    it("round-trips a commitment and every node signature through the transaction registry", async function () {
        const transaction = offline(
            registerConnector().setCommitment(commitment()),
        ).freeze();
        const keys = vectors.vectors.map(privateKey);
        for (const key of keys) {
            await transaction.sign(key);
        }
        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(sdk.ClprRegisterConnectorTransaction);
        expect(decoded.commitment).toEqual(commitment());
        expect(decoded.transactionId.toString()).toBe(
            transaction.transactionId.toString(),
        );
        expect(decoded.nodeAccountIds.map(String)).toEqual(["0.0.3", "0.0.4"]);
        expect(decoded.toBytes()).toEqual(bytes);
        expect(decoded.getSignatures().size).toBe(2);
        for (const item of proto.TransactionList.decode(bytes)
            .transactionList) {
            const signed = proto.SignedTransaction.decode(
                item.signedTransactionBytes,
            );
            const body = proto.TransactionBody.decode(signed.bodyBytes);
            expect(body.data).toBe("clprRegisterConnector");
            expect(
                new Uint8Array(body.clprRegisterConnector.commitment),
            ).toEqual(commitment());
            expect(signed.sigMap.sigPair).toHaveLength(2);
        }
        for (const key of keys) {
            expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
        }
    });

    it.each(["freeze", "freezeWith"])(
        "rejects %s without a commitment before freezing and allows repair",
        function (method) {
            const transaction = offline(registerConnector());

            expect(transaction.commitment).toBeNull();
            expect(() => transaction[method](null)).toThrow(/commitment/);
            expect(transaction.isFrozen()).toBe(false);
            expect(transaction.setCommitment(commitment())).toBe(transaction);
            expect(() => transaction[method](null)).not.toThrow();
        },
    );

    it.each([31, 33])(
        "rejects a %i-byte commitment before changing existing state",
        function (length) {
            const transaction = registerConnector({ commitment: commitment() });

            expect(() =>
                transaction.setCommitment(new Uint8Array(length)),
            ).toThrow(/commitment/);
            expect(transaction.commitment).toEqual(commitment());
            expect(() =>
                registerConnector({ commitment: new Uint8Array(length) }),
            ).toThrow(/commitment/);
        },
    );

    it.each([null, undefined, "00".repeat(32), Array(32).fill(0)])(
        "rejects a non-byte commitment (%j)",
        function (value) {
            const transaction = registerConnector({ commitment: commitment() });

            expect(() => transaction.setCommitment(value)).toThrow(
                /commitment/,
            );
            expect(transaction.commitment).toEqual(commitment());
        },
    );

    it.each(["constructor", "setter"])(
        "copies commitment input and output bytes through the %s",
        function (path) {
            const input = commitment();
            const transaction =
                path === "constructor"
                    ? registerConnector({ commitment: input })
                    : registerConnector().setCommitment(input);

            input.fill(0);
            expect(transaction.commitment).toEqual(commitment());
            transaction.commitment.fill(0);
            expect(transaction.commitment).toEqual(commitment());
        },
    );

    it("rejects the commitment setter after freeze and preserves signed bytes", async function () {
        const transaction = offline(
            registerConnector({ commitment: commitment() }),
        ).freeze();
        await transaction.sign(privateKey(vectors.vectors[1]));
        const bytes = transaction.toBytes();

        expect(() => transaction.setCommitment(new Uint8Array(32))).toThrow(
            /immutable/,
        );
        expect(transaction.toBytes()).toEqual(bytes);
    });

    it.each([
        ["schedule()", (transaction) => transaction.schedule()],
        [
            "setScheduledTransaction()",
            (transaction) =>
                new sdk.ScheduleCreateTransaction().setScheduledTransaction(
                    transaction,
                ),
        ],
        [
            "_getScheduledTransactionBody()",
            (transaction) => transaction._getScheduledTransactionBody(),
        ],
    ])("refuses %s", function (_name, schedule) {
        const transaction = registerConnector({ commitment: commitment() });

        expect(() => schedule(transaction)).toThrow(
            new Error("ClprRegisterConnectorTransaction cannot be scheduled"),
        );
    });
});
