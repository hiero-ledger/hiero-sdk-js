// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function inputs() {
    return {
        channelId: new Uint8Array(hex.decode(vectors.channelId)),
        connectorId: new Uint8Array(hex.decode(vectors.vectors[0].connectorId)),
        stakeRecipient: sdk.AccountId.fromString("2.3.9007199254740993"),
    };
}

function deleteConnector(props) {
    expect(
        sdk.ClprDeleteConnectorTransaction,
        "SDK must export ClprDeleteConnectorTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprDeleteConnectorTransaction(props);
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

function signingKeys() {
    return [
        sdk.PrivateKey.fromStringECDSA(vectors.vectors[0].privateKeyOrSeed),
        sdk.PrivateKey.fromStringED25519(vectors.vectors[1].privateKeyOrSeed),
    ];
}

function expectFields(transaction) {
    expect(transaction.channelId).toEqual(inputs().channelId);
    expect(transaction.connectorId).toEqual(inputs().connectorId);
    expect(transaction.stakeRecipient).toBeInstanceOf(sdk.AccountId);
    expect(transaction.stakeRecipient.toString()).toBe("2.3.9007199254740993");
}

function bodies(bytes) {
    return proto.TransactionList.decode(bytes).transactionList.map(
        (transaction) =>
            proto.TransactionBody.decode(
                transaction.signedTransactionBytes?.length
                    ? proto.SignedTransaction.decode(
                          transaction.signedTransactionBytes,
                      ).bodyBytes
                    : transaction.bodyBytes,
            ),
    );
}

const fields = [
    ["channelId", "setChannelId"],
    ["connectorId", "setConnectorId"],
    ["stakeRecipient", "setStakeRecipient"],
];
const idFields = fields.slice(0, 2);
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

describe("ClprDeleteConnectorTransaction", function () {
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprDeleteConnectorTransaction).toBeTypeOf("function");
        expect(entry.ClprDeleteConnectorTransaction).toBe(
            sdk.ClprDeleteConnectorTransaction,
        );
    });

    it.each(["constructor", "setter"])(
        "round-trips both IDs and the explicit stake recipient through the %s",
        function (path) {
            const values = inputs();
            const transaction = offline(
                path === "constructor"
                    ? deleteConnector(values)
                    : deleteConnector()
                          .setChannelId(values.channelId)
                          .setConnectorId(values.connectorId)
                          .setStakeRecipient(values.stakeRecipient),
            );
            const bytes = transaction.toBytes();
            const decoded = sdk.Transaction.fromBytes(bytes);

            expect(decoded).toBeInstanceOf(sdk.ClprDeleteConnectorTransaction);
            expectFields(decoded);
            expect(decoded.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            expect(decoded.nodeAccountIds.map(String)).toEqual([
                "0.0.3",
                "0.0.4",
            ]);
            expect(decoded.toBytes()).toEqual(bytes);
            for (const body of bodies(bytes)) {
                expect(body.data).toBe("clprDeleteConnector");
                expect(Object.keys(body.clprDeleteConnector).sort()).toEqual([
                    "channelId",
                    "connectorId",
                    "stakeRecipient",
                ]);
                expect(
                    Uint8Array.from(body.clprDeleteConnector.channelId),
                ).toEqual(values.channelId);
                expect(
                    Uint8Array.from(body.clprDeleteConnector.connectorId),
                ).toEqual(values.connectorId);
                expect(
                    sdk.AccountId._fromProtobuf(
                        body.clprDeleteConnector.stakeRecipient,
                    ).toString(),
                ).toBe("2.3.9007199254740993");
            }
        },
    );

    it("preserves both signatures when the admin and named recipient must sign", async function () {
        const transaction = offline(deleteConnector(inputs())).freeze();
        const [admin, recipient] = signingKeys();
        await transaction.sign(admin);
        await transaction.sign(recipient);

        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(sdk.ClprDeleteConnectorTransaction);
        expectFields(decoded);
        expect(decoded.toBytes()).toEqual(bytes);
        expect(decoded.getSignatures().size).toBe(2);
        for (const [, nodeSignatures] of decoded.getSignatures()) {
            const signatures = nodeSignatures.get(decoded.transactionId);
            expect(signatures.size).toBe(2);
            for (const key of [admin, recipient]) {
                expect(signatures.get(key.publicKey)).toBeInstanceOf(
                    Uint8Array,
                );
                expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
            }
        }
    });

    it("decodes a signed deregistration wire body through the transaction registry", function () {
        const values = inputs();
        const [admin, recipient] = signingKeys();
        const bodyBytes = proto.TransactionBody.encode({
            transactionID: sdk.TransactionId.fromString(
                "0.0.5006@1596210382.0",
            )._toProtobuf(),
            nodeAccountID: new sdk.AccountId(3)._toProtobuf(),
            transactionFee: new sdk.Hbar(1).toTinybars(),
            transactionValidDuration: { seconds: 120 },
            clprDeleteConnector: {
                channelId: values.channelId,
                connectorId: values.connectorId,
                stakeRecipient: values.stakeRecipient._toProtobuf(),
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
                                    pubKeyPrefix: admin.publicKey.toBytesRaw(),
                                    ECDSASecp256k1: admin.sign(bodyBytes),
                                },
                                {
                                    pubKeyPrefix:
                                        recipient.publicKey.toBytesRaw(),
                                    ed25519: recipient.sign(bodyBytes),
                                },
                            ],
                        },
                    }).finish(),
                },
            ],
        }).finish();

        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(sdk.ClprDeleteConnectorTransaction);
        expectFields(decoded);
        expect(decoded.isFrozen()).toBe(true);
        expect(decoded.toBytes()).toEqual(bytes);
        expect(admin.publicKey.verifyTransaction(decoded)).toBe(true);
        expect(recipient.publicKey.verifyTransaction(decoded)).toBe(true);
    });

    describe.each(["constructor", "setter"])(
        "stake recipient EVM alias copies through the %s",
        function (path) {
            it.each(["input", "getter"])(
                "keeps the recipient and signed wire alias independent of %s bytes",
                async function (target) {
                    const address = "0011223344556677889900112233445577889900";
                    const recipient = sdk.AccountId.fromString(
                        `2.3.${address}`,
                    );
                    const transaction = offline(
                        path === "constructor"
                            ? deleteConnector({
                                  ...inputs(),
                                  stakeRecipient: recipient,
                              })
                            : deleteConnector(inputs()).setStakeRecipient(
                                  recipient,
                              ),
                    );
                    const exposed =
                        target === "input"
                            ? recipient
                            : transaction.stakeRecipient;
                    exposed.evmAddress.toBytes().fill(255);

                    expect(
                        transaction.stakeRecipient.evmAddress,
                    ).toBeInstanceOf(sdk.EvmAddress);
                    expect(transaction.stakeRecipient.toString()).toBe(
                        `2.3.${address}`,
                    );
                    const [, key] = signingKeys();
                    await transaction.freeze().sign(key);
                    const bytes = transaction.toBytes();
                    transaction.stakeRecipient.evmAddress.toBytes().fill(0);

                    expect(transaction.stakeRecipient.toString()).toBe(
                        `2.3.${address}`,
                    );
                    expect(transaction.toBytes()).toEqual(bytes);
                    const decoded = sdk.Transaction.fromBytes(bytes);
                    expect(decoded.stakeRecipient.toString()).toBe(
                        `2.3.${address}`,
                    );
                    for (const body of bodies(bytes)) {
                        expect(
                            hex.encode(
                                body.clprDeleteConnector.stakeRecipient.alias,
                            ),
                        ).toBe(address);
                    }
                    expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
                },
            );
        },
    );

    it.each(fields)(
        "requires an explicit %s at freeze without changing state",
        function (field, setter) {
            for (const method of ["freeze", "freezeWith"]) {
                const values = inputs();
                delete values[field];
                const transaction = offline(deleteConnector(values));

                expect(transaction[field]).toBeNull();
                expect(() => transaction[method](null)).toThrow(
                    new RegExp(field),
                );
                expect(transaction.isFrozen()).toBe(false);
                transaction[setter](inputs()[field]);
                expect(() => transaction[method](null)).not.toThrow();
            }
        },
    );

    it.each(fields)(
        "returns the builder from %s's setter",
        function (field, setter) {
            const transaction = deleteConnector();

            expect(transaction[setter](inputs()[field])).toBe(transaction);
        },
    );

    describe.each(idFields)("%s bytes", function (field, setter) {
        it.each([31, 33])(
            "rejects a %i-byte ID without changing any field",
            function (length) {
                const transaction = deleteConnector(inputs());

                expect(() =>
                    transaction[setter](new Uint8Array(length)),
                ).toThrow(new RegExp(field));
                expectFields(transaction);
                expect(transaction.isFrozen()).toBe(false);
            },
        );

        it.each([31, 33])(
            "rejects a %i-byte ID in the constructor",
            function (length) {
                deleteConnector();
                expect(() =>
                    deleteConnector({
                        ...inputs(),
                        [field]: new Uint8Array(length),
                    }),
                ).toThrow(new RegExp(field));
            },
        );

        it.each([
            ["hex string", "00".repeat(32)],
            ["plain array", Array(32).fill(0)],
        ])(
            "rejects a non-byte ID (%s) without mutation",
            function (_name, value) {
                const transaction = deleteConnector(inputs());

                expect(() => transaction[setter](value)).toThrow(
                    new RegExp(field),
                );
                expectFields(transaction);
            },
        );

        it.each(["constructor", "setter"])(
            "copies input and output bytes through the %s",
            function (path) {
                const values = inputs();
                const input = values[field];
                const transaction =
                    path === "constructor"
                        ? deleteConnector(values)
                        : deleteConnector({
                              ...values,
                              [field]: undefined,
                          })[setter](input);

                input.fill(0);
                expectFields(transaction);
                const returned = transaction[field];
                expect(returned).toBeInstanceOf(Uint8Array);
                returned.fill(0);
                expectFields(transaction);
            },
        );
    });

    it.each(["constructor", "setter"])(
        "copies the stake recipient AccountId through the %s",
        function (path) {
            const values = inputs();
            const transaction =
                path === "constructor"
                    ? deleteConnector(values)
                    : deleteConnector({
                          ...values,
                          stakeRecipient: undefined,
                      }).setStakeRecipient(values.stakeRecipient);

            values.stakeRecipient.num = new sdk.AccountId(99).num;
            expectFields(transaction);
            transaction.stakeRecipient.num = new sdk.AccountId(100).num;
            expectFields(transaction);
            const decoded = sdk.Transaction.fromBytes(
                offline(transaction).toBytes(),
            );
            expectFields(decoded);
        },
    );

    it.each(fields)(
        "rejects the %s setter after freeze and keeps signed bytes unchanged",
        async function (field, setter) {
            const transaction = offline(deleteConnector(inputs())).freeze();
            const [, recipient] = signingKeys();
            await transaction.sign(recipient);
            const bytes = transaction.toBytes();
            const replacement =
                field === "stakeRecipient"
                    ? new sdk.AccountId(99)
                    : new Uint8Array(32).fill(255);

            expect(() => transaction[setter](replacement)).toThrow(/immutable/);
            expectFields(transaction);
            expect(transaction.toBytes()).toEqual(bytes);
            expect(recipient.publicKey.verifyTransaction(transaction)).toBe(
                true,
            );
        },
    );

    it.each(schedulingPaths)("refuses %s", function (_name, schedule) {
        const transaction = deleteConnector(inputs());

        expect(() => schedule(transaction)).toThrow(
            new Error("ClprDeleteConnectorTransaction cannot be scheduled"),
        );
    });
});
