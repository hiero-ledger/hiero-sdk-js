// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import {
    AccountId,
    Client,
    ClprDeleteChannelTransaction,
    ClprCreateChannelTransaction,
    ClprCreateConnectorTransaction,
    ClprDeleteConnectorTransaction,
    ClprSubmitBundleTransaction,
    ClprUpdateLedgerConfigurationTransaction,
    Transaction,
    TransactionId,
} from "../../../src/index.js";

function frozenTransactionBytes(kind, data) {
    const bodyBytes = proto.TransactionBody.encode({
        transactionID: TransactionId.fromString(
            "0.0.5006@1596210382.0",
        )._toProtobuf(),
        nodeAccountID: new AccountId(3)._toProtobuf(),
        transactionValidDuration: { seconds: 120 },
        [kind]: data,
    }).finish();
    return proto.TransactionList.encode({
        transactionList: [
            {
                signedTransactionBytes: proto.SignedTransaction.encode({
                    bodyBytes,
                }).finish(),
            },
        ],
    }).finish();
}

async function expectLocalExecutionError(transaction, error) {
    const client = Client.forNetwork({ "127.0.0.1:50211": "0.0.3" });
    client.setGrpcDeadline(100);
    const rpc = vi
        .spyOn(GrpcClient.prototype, "makeUnaryRequest")
        .mockImplementation(() => {
            throw new Error("RPC must not be reached");
        });
    try {
        await expect(
            transaction.setMaxAttempts(1).execute(client),
        ).rejects.toThrow(error);
        expect(rpc).not.toHaveBeenCalled();
    } finally {
        rpc.mockRestore();
        client.close();
    }
}

describe("CLPR required fields before execution", function () {
    it.each([
        ["clprDeleteChannel", "channelId", {}],
        ["clprSubmitBundle", "channelId", {}],
        [
            "clprDeleteConnector",
            "stakeRecipient",
            { channelId: new Uint8Array(32), connectorId: new Uint8Array(32) },
        ],
        ["clprUpdateLedgerConfiguration", "throttles", {}],
    ])(
        "rejects a frozen decoded %s without %s before any RPC",
        async function (kind, field, data) {
            const encoded = frozenTransactionBytes(kind, data);
            const transaction = Transaction.fromBytes(encoded);

            expect(transaction.isFrozen()).toBe(true);
            await expectLocalExecutionError(transaction, new RegExp(field));
            expect(transaction.toBytes()).toEqual(encoded);
        },
    );
});

describe.each([
    ["ClprCreateChannelTransaction", ClprCreateChannelTransaction, "channelId"],
    [
        "ClprCreateConnectorTransaction",
        ClprCreateConnectorTransaction,
        "channelId",
    ],
    ["ClprDeleteChannelTransaction", ClprDeleteChannelTransaction, "channelId"],
    ["ClprSubmitBundleTransaction", ClprSubmitBundleTransaction, "channelId"],
    [
        "ClprDeleteConnectorTransaction",
        ClprDeleteConnectorTransaction,
        "channelId",
    ],
    [
        "ClprUpdateLedgerConfigurationTransaction",
        ClprUpdateLedgerConfigurationTransaction,
        "throttles",
    ],
])(
    "%s with a minified constructor name",
    function (name, TransactionClass, field) {
        class a extends TransactionClass {}

        it("keeps the literal name in missing-field errors at freeze", function () {
            expect(() => new a().freeze()).toThrow(
                new Error(
                    `${name}: '${field}' must be explicitly set before freezing or executing.`,
                ),
            );
        });

        it("keeps the literal name in missing-field errors at execute", async function () {
            await expectLocalExecutionError(
                new a(),
                new Error(
                    `${name}: '${field}' must be explicitly set before freezing or executing.`,
                ),
            );
        });

        it.each(["schedule", "_getScheduledTransactionBody"])(
            "keeps the literal name when %s refuses scheduling",
            function (method) {
                const transaction = new a();

                expect(() => transaction[method]()).toThrow(
                    new Error(`${name} cannot be scheduled`),
                );
            },
        );
    },
);

const deregistrationValues = {
    channelId: new Uint8Array(32).fill(1),
    connectorId: new Uint8Array(32).fill(2),
    stakeRecipient: new AccountId(123),
};
const incompleteCases = [
    ...[
        [[], "channelId"],
        [["channelId"], "connectorId"],
        [["connectorId"], "channelId"],
        [["stakeRecipient"], "channelId"],
        [["channelId", "connectorId"], "stakeRecipient"],
        [["channelId", "stakeRecipient"], "connectorId"],
        [["connectorId", "stakeRecipient"], "channelId"],
    ].map(([present, missing]) => ({
        name: `deregister-connector with ${
            present.join(" and ") || "no fields"
        }`,
        TransactionClass: ClprDeleteConnectorTransaction,
        kind: "clprDeleteConnector",
        props: Object.fromEntries(
            present.map((field) => [field, deregistrationValues[field]]),
        ),
        fields: ["channelId", "connectorId", "stakeRecipient"],
        missing,
    })),
];

describe.each(incompleteCases)(
    "incomplete $name",
    function ({ TransactionClass, kind, props, fields, missing }) {
        it("round-trips builder bytes with absent fields and rejects freeze and execute locally", async function () {
            const encoded = new TransactionClass(props).toBytes();
            const transaction = Transaction.fromBytes(encoded);

            expect(transaction).toBeInstanceOf(TransactionClass);
            expect(transaction.isFrozen()).toBe(false);
            for (const field of fields) {
                expect(transaction[field]).toEqual(props[field] ?? null);
            }
            expect(transaction.toBytes()).toEqual(encoded);
            expect(() => transaction.freeze()).toThrow(
                new RegExp(`'${missing}' must be explicitly set`),
            );
            expect(transaction.isFrozen()).toBe(false);
            await expectLocalExecutionError(
                transaction,
                new RegExp(`'${missing}' must be explicitly set`),
            );
            expect(transaction.toBytes()).toEqual(encoded);
        });

        it("preserves frozen wire bytes and rejects execute before any RPC", async function () {
            const data = { ...props };
            if (data.stakeRecipient != null) {
                data.stakeRecipient = data.stakeRecipient._toProtobuf();
            }
            const encoded = frozenTransactionBytes(kind, data);
            const transaction = Transaction.fromBytes(encoded);

            expect(transaction).toBeInstanceOf(TransactionClass);
            expect(transaction.isFrozen()).toBe(true);
            for (const field of fields) {
                expect(transaction[field]).toEqual(props[field] ?? null);
            }
            expect(transaction.toBytes()).toEqual(encoded);
            await expectLocalExecutionError(
                transaction,
                new RegExp(`'${missing}' must be explicitly set`),
            );
            expect(transaction.toBytes()).toEqual(encoded);
        });
    },
);

it.each([
    ["channelId", ClprCreateChannelTransaction, "setChannelId"],
    ["salt", ClprCreateChannelTransaction, "setSalt"],
    ["channelId", ClprCreateConnectorTransaction, "setChannelId"],
    ["channelId", ClprDeleteConnectorTransaction, "setChannelId"],
    ["connectorId", ClprDeleteConnectorTransaction, "setConnectorId"],
])(
    "still rejects explicitly empty bytes for %s through constructors and setters",
    function (field, TransactionClass, setter) {
        const value = new Uint8Array(32).fill(3);
        const transaction = new TransactionClass({ [field]: value });

        expect(() => transaction[setter](new Uint8Array())).toThrow(
            new RegExp(field),
        );
        expect(transaction[field]).toEqual(value);
        expect(
            () => new TransactionClass({ [field]: new Uint8Array() }),
        ).toThrow(new RegExp(field));
    },
);

it.each([31, 33])(
    "rejects a decoded %i-byte creation channelId",
    function (length) {
        const bytes = frozenTransactionBytes("clprCreateConnector", {
            channelId: new Uint8Array(length),
        });
        expect(() => Transaction.fromBytes(bytes)).toThrow(/channelId/);
    },
);
