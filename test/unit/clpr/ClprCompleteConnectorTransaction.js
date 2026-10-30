// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import { Signature, SigningKey } from "ethers";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function bytes(value) {
    return new Uint8Array(hex.decode(value));
}

function privateKey(vector = vectors.vectors[1]) {
    return vector.signatureScheme === "ECDSA_SECP256K1"
        ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
        : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
}

function adminKey() {
    return new sdk.KeyList(
        vectors.vectors.map((vector) => privateKey(vector).publicKey),
        1,
    );
}

function completeConnector(props) {
    expect(
        sdk.ClprCompleteConnectorTransaction,
        "SDK must export ClprCompleteConnectorTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprCompleteConnectorTransaction(props);
}

function boundProps(vector = vectors.vectors[1]) {
    return {
        channelId: bytes(vectors.channelId),
        connectorId: bytes(vector.connectorId),
        salt: bytes(vectors.salt),
    };
}

function ready(vector = vectors.vectors[1]) {
    return completeConnector({
        ...boundProps(vector),
        adminKey: adminKey(),
    }).setOwnershipProof(privateKey(vector));
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

function wireBody(vector = vectors.vectors[1]) {
    return {
        ...boundProps(vector),
        publicKey: bytes(vector.publicKey),
        signature: bytes(vector.connectorSignature),
        // Omit ECDSA to exercise the protobuf default zero.
        ...(vector.signatureScheme === "ED25519" ? { signatureScheme: 1 } : {}),
        adminKey: adminKey()._toProtobufKey(),
        connectorContract: { shardNum: 1, realmNum: 2, contractNum: 345 },
        lockedStake: Long.fromString("9223372036854775807", true),
    };
}

function wireBytes(completion, signed = true) {
    const bodyBytes = proto.TransactionBody.encode({
        transactionID: sdk.TransactionId.fromString(
            "0.0.5006@1596210382.0",
        )._toProtobuf(),
        nodeAccountID: new sdk.AccountId(3)._toProtobuf(),
        transactionFee: new sdk.Hbar(1).toTinybars(),
        transactionValidDuration: { seconds: 120 },
        clprCompleteConnector: completion,
    }).finish();
    if (!signed) {
        return proto.TransactionList.encode({
            transactionList: [{ bodyBytes }],
        }).finish();
    }
    const payer = privateKey();
    return proto.TransactionList.encode({
        transactionList: [
            {
                signedTransactionBytes: proto.SignedTransaction.encode({
                    bodyBytes,
                    sigMap: {
                        sigPair: [
                            {
                                pubKeyPrefix: payer.publicKey.toBytesRaw(),
                                ed25519: payer.sign(bodyBytes),
                            },
                        ],
                    },
                }).finish(),
            },
        ],
    }).finish();
}

function signedBodies(encoded) {
    return proto.TransactionList.decode(encoded).transactionList.map((item) =>
        proto.SignedTransaction.decode(item.signedTransactionBytes),
    );
}

function canonicalSignature(value) {
    expect(value).toHaveLength(64);
    // A recovery byte distinguishes r || s from compact EIP-2098 encoding.
    const signature = Signature.from(`0x${hex.encode(value)}1b`).getCanonical();
    return signature.r.substring(2) + signature.s.substring(2);
}

const boundFields = [
    ["channelId", "setChannelId", vectors.channelId],
    ["connectorId", "setConnectorId", vectors.vectors[1].connectorId],
    ["salt", "setSalt", vectors.salt],
];

describe("ClprCompleteConnectorTransaction", function () {
    it.each(["9223372036854775808", "18446744073709551615"])(
        "forwards signed wire stake %s exactly without applying builder limits",
        function (stake) {
            const encoded = wireBytes({
                ...wireBody(),
                lockedStake: Long.fromString(stake, true),
            });
            const decoded = sdk.Transaction.fromBytes(encoded);

            expect(decoded.lockedStake.to(sdk.HbarUnit.Tinybar).toFixed()).toBe(
                stake,
            );
            expect(decoded.toBytes()).toEqual(encoded);
            expect(privateKey().publicKey.verifyTransaction(decoded)).toBe(
                true,
            );
            expect(() =>
                completeConnector().setLockedStake(
                    sdk.Hbar.fromTinybars(stake),
                ),
            ).toThrow(/lockedStake/);
        },
    );
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprCompleteConnectorTransaction).toBeTypeOf("function");
        expect(entry.ClprCompleteConnectorTransaction).toBe(
            sdk.ClprCompleteConnectorTransaction,
        );
    });

    it.each(vectors.vectors)(
        "creates the HIP publicKey and signature and verifies connectorDigest for $signatureScheme",
        function (vector) {
            const transaction = completeConnector(boundProps(vector));
            const key = privateKey(vector);

            expect(transaction.setOwnershipProof(key)).toBe(transaction);
            expect(hex.encode(transaction.publicKey)).toBe(vector.publicKey);
            expect(transaction.signatureScheme).toBe(
                sdk.ClprSignatureScheme[vector.signatureScheme],
            );
            expect(transaction.signature).toHaveLength(64);
            if (vector.signatureScheme === "ECDSA_SECP256K1") {
                expect(canonicalSignature(transaction.signature)).toBe(
                    canonicalSignature(bytes(vector.connectorSignature)),
                );
                const signature = Signature.from(
                    `0x${canonicalSignature(transaction.signature)}1b`,
                );
                expect(
                    [27, 28].map((v) =>
                        SigningKey.recoverPublicKey(
                            `0x${vector.connectorDigest}`,
                            { r: signature.r, s: signature.s, v },
                        ),
                    ),
                ).toContain(`0x04${vector.publicKey}`);
            } else {
                expect(hex.encode(transaction.signature)).toBe(
                    vector.connectorSignature,
                );
                expect(
                    key.publicKey.verify(
                        bytes(vector.connectorDigest),
                        transaction.signature,
                    ),
                ).toBe(true);
            }
            transaction.publicKey.fill(0);
            transaction.signature.fill(0);
            expect(hex.encode(transaction.publicKey)).toBe(vector.publicKey);
            expect(transaction.signature).not.toEqual(new Uint8Array(64));
        },
    );

    it.each(vectors.vectors)(
        "rejects a wrong salt before storing a $signatureScheme proof and allows repair",
        function (vector) {
            const transaction = completeConnector({
                ...boundProps(vector),
                salt: new Uint8Array(32),
            });

            expect(() =>
                transaction.setOwnershipProof(privateKey(vector)),
            ).toThrow(/connectorId/);
            expect(transaction.publicKey).toBeNull();
            expect(transaction.signature).toBeNull();
            expect(transaction.signatureScheme).toBeNull();
            transaction
                .setSalt(bytes(vectors.salt))
                .setOwnershipProof(privateKey(vector));
            expect(hex.encode(transaction.publicKey)).toBe(vector.publicKey);
        },
    );

    it("rejects an ID derived for a different ownership key", function () {
        const transaction = completeConnector(boundProps(vectors.vectors[0]));

        expect(() => transaction.setOwnershipProof(privateKey())).toThrow(
            /connectorId/,
        );
        expect(transaction.publicKey).toBeNull();
        expect(transaction.signature).toBeNull();
        expect(transaction.signatureScheme).toBeNull();
    });

    for (const [field, setter, value] of boundFields) {
        it(`requires ${field} before signing and stores no partial proof`, function () {
            const props = boundProps();
            delete props[field];
            const transaction = completeConnector(props);

            expect(() => transaction.setOwnershipProof(privateKey())).toThrow(
                new RegExp(field),
            );
            expect(transaction.publicKey).toBeNull();
            expect(transaction.signature).toBeNull();
            expect(transaction.signatureScheme).toBeNull();
            transaction[setter](bytes(value)).setOwnershipProof(privateKey());
            expect(hex.encode(transaction.publicKey)).toBe(
                vectors.vectors[1].publicKey,
            );
        });

        it(`clears all proof getters only when ${field} changes and requires a rebuilt proof to freeze`, function () {
            const transaction = offline(ready());

            expect(transaction[setter](new Uint8Array(32).fill(8))).toBe(
                transaction,
            );
            expect(transaction[field]).toEqual(new Uint8Array(32).fill(8));
            expect(transaction.publicKey).toBeNull();
            expect(transaction.signature).toBeNull();
            expect(transaction.signatureScheme).toBeNull();
            expect(() => transaction.freeze()).toThrow(
                /complete ownership proof/i,
            );
            expect(transaction.isFrozen()).toBe(false);
            transaction[setter](bytes(value));
            expect(() => transaction.freeze()).toThrow(
                /complete ownership proof/i,
            );
            transaction.setOwnershipProof(privateKey());
            expect(() => transaction.freeze()).not.toThrow();
        });

        it(`keeps the proof when ${field} is set to identical bytes`, function () {
            const transaction = offline(ready());
            const publicKey = transaction.publicKey;
            const signature = transaction.signature;
            const scheme = transaction.signatureScheme;

            expect(transaction[setter](bytes(value))).toBe(transaction);
            expect(transaction.publicKey).toEqual(publicKey);
            expect(transaction.signature).toEqual(signature);
            expect(transaction.signatureScheme).toBe(scheme);
            expect(() => transaction.freeze()).not.toThrow();
        });

        it.each([31, 33])(
            `rejects a %i-byte ${field} without changing its value or proof`,
            function (length) {
                const transaction = offline(ready());
                const signature = transaction.signature;
                const publicKey = transaction.publicKey;
                const scheme = transaction.signatureScheme;

                expect(() =>
                    transaction[setter](new Uint8Array(length)),
                ).toThrow(new RegExp(field));
                expect(transaction[field]).toEqual(bytes(value));
                expect(transaction.publicKey).toEqual(publicKey);
                expect(transaction.signature).toEqual(signature);
                expect(transaction.signatureScheme).toBe(scheme);
                expect(() =>
                    completeConnector({ [field]: new Uint8Array(length) }),
                ).toThrow(new RegExp(field));
                expect(() => transaction.freeze()).not.toThrow();
            },
        );

        it.each(["constructor", "setter"])(
            `copies ${field} input and output bytes through the %s`,
            function (path) {
                const input = bytes(value);
                const transaction =
                    path === "constructor"
                        ? completeConnector({ [field]: input })
                        : completeConnector()[setter](input);

                input.fill(0);
                expect(transaction[field]).toEqual(bytes(value));
                transaction[field].fill(0);
                expect(transaction[field]).toEqual(bytes(value));
            },
        );
    }

    it.each(vectors.vectors)(
        "decodes a signed $signatureScheme proof, threshold admin key, contract and stake and forwards unchanged",
        function (vector) {
            completeConnector();
            const encoded = wireBytes(wireBody(vector));
            const decoded = sdk.Transaction.fromBytes(encoded);

            expect(decoded).toBeInstanceOf(
                sdk.ClprCompleteConnectorTransaction,
            );
            expect(decoded.isFrozen()).toBe(true);
            for (const [field, value] of Object.entries(boundProps(vector))) {
                expect(decoded[field]).toEqual(value);
                decoded[field].fill(0);
                expect(decoded[field]).toEqual(value);
            }
            expect(hex.encode(decoded.publicKey)).toBe(vector.publicKey);
            expect(hex.encode(decoded.signature)).toBe(
                vector.connectorSignature,
            );
            expect(decoded.signatureScheme).toBe(
                sdk.ClprSignatureScheme[vector.signatureScheme],
            );
            expect(decoded.signatureScheme.toString()).toBe(
                vector.signatureScheme,
            );
            expect(decoded.adminKey).toBeInstanceOf(sdk.KeyList);
            expect(decoded.adminKey.threshold).toBe(1);
            expect(decoded.adminKey.toArray().map(String)).toEqual(
                adminKey().toArray().map(String),
            );
            expect(decoded.connectorContract).toBeInstanceOf(sdk.ContractId);
            expect(decoded.connectorContract.toString()).toBe("1.2.345");
            expect(decoded.lockedStake).toBeInstanceOf(sdk.Hbar);
            expect(decoded.lockedStake.to(sdk.HbarUnit.Tinybar).toFixed()).toBe(
                "9223372036854775807",
            );
            decoded.publicKey.fill(0);
            decoded.signature.fill(0);
            expect(hex.encode(decoded.publicKey)).toBe(vector.publicKey);
            expect(hex.encode(decoded.signature)).toBe(
                vector.connectorSignature,
            );
            expect(decoded.toBytes()).toEqual(encoded);
            expect(privateKey().publicKey.verifyTransaction(decoded)).toBe(
                true,
            );
        },
    );

    it.each(vectors.vectors)(
        "round-trips a new $signatureScheme completion with all node and payer signatures",
        async function (vector) {
            const transaction = offline(
                ready(vector)
                    .setConnectorContract(new sdk.ContractId(1, 2, 345))
                    .setLockedStake(sdk.Hbar.fromTinybars("9007199254740993")),
            ).freeze();
            const keys = vectors.vectors.map((value) => privateKey(value));
            for (const key of keys) {
                await transaction.sign(key);
            }
            const encoded = transaction.toBytes();
            const decoded = sdk.Transaction.fromBytes(encoded);

            expect(decoded).toBeInstanceOf(
                sdk.ClprCompleteConnectorTransaction,
            );
            expect(decoded.publicKey).toEqual(transaction.publicKey);
            expect(decoded.signature).toEqual(transaction.signature);
            expect(decoded.signatureScheme).toBe(transaction.signatureScheme);
            expect(decoded.adminKey.toString()).toBe(adminKey().toString());
            expect(decoded.connectorContract.toString()).toBe("1.2.345");
            expect(decoded.lockedStake.to(sdk.HbarUnit.Tinybar).toFixed()).toBe(
                "9007199254740993",
            );
            expect(decoded.nodeAccountIds.map(String)).toEqual([
                "0.0.3",
                "0.0.4",
            ]);
            expect(decoded.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            expect(decoded.getSignatures().size).toBe(2);
            expect(decoded.toBytes()).toEqual(encoded);
            for (const signed of signedBodies(encoded)) {
                expect(
                    proto.TransactionBody.decode(signed.bodyBytes).data,
                ).toBe("clprCompleteConnector");
                expect(signed.sigMap.sigPair).toHaveLength(2);
            }
            for (const key of keys) {
                expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
            }
        },
    );

    it("returns null for every proof getter before setting a proof and after decoding an absent proof", function () {
        const transaction = completeConnector(boundProps());
        const body = wireBody();
        delete body.publicKey;
        delete body.signature;
        const decoded = sdk.Transaction.fromBytes(wireBytes(body, false));

        for (const value of [transaction, decoded]) {
            expect(value.publicKey).toBeNull();
            expect(value.signature).toBeNull();
            expect(value.signatureScheme).toBeNull();
        }
    });

    for (const field of [
        "channelId",
        "connectorId",
        "salt",
        "adminKey",
        "proof",
    ]) {
        it.each(["freeze", "freezeWith"])(
            `rejects %s without ${field} and allows repair`,
            function (method) {
                completeConnector();
                const body = wireBody();
                if (field === "proof") {
                    delete body.publicKey;
                    delete body.signature;
                } else {
                    delete body[field];
                }
                const transaction = sdk.Transaction.fromBytes(
                    wireBytes(body, false),
                );

                expect(transaction.isFrozen()).toBe(false);
                expect(() => transaction[method](null)).toThrow(
                    field === "proof"
                        ? /complete ownership proof/i
                        : new RegExp(field),
                );
                expect(transaction.isFrozen()).toBe(false);
                if (field === "adminKey") {
                    transaction.setAdminKey(adminKey());
                } else if (field !== "proof") {
                    const [, setter, value] = boundFields.find(
                        ([name]) => name === field,
                    );
                    transaction[setter](bytes(value));
                }
                transaction.setOwnershipProof(privateKey());
                expect(() => transaction[method](null)).not.toThrow();
            },
        );
    }

    it.each([
        ["empty key", new Uint8Array(), new Uint8Array(64)],
        ["empty signature", new Uint8Array(32), new Uint8Array()],
        ["both empty", new Uint8Array(), new Uint8Array()],
    ])(
        "rejects a decoded incomplete proof with %s at freeze",
        function (_name, publicKey, signature) {
            completeConnector();
            const transaction = sdk.Transaction.fromBytes(
                wireBytes({ ...wireBody(), publicKey, signature }, false),
            );

            expect(() => transaction.freeze()).toThrow(
                /complete ownership proof/i,
            );
            expect(transaction.isFrozen()).toBe(false);
            transaction.setOwnershipProof(privateKey());
            expect(() => transaction.freeze()).not.toThrow();
        },
    );

    it("accepts a decoded proof as complete when key and signature are non-empty", function () {
        completeConnector();
        const transaction = sdk.Transaction.fromBytes(
            wireBytes(
                {
                    ...wireBody(),
                    publicKey: new Uint8Array([1]),
                    signature: new Uint8Array([2]),
                },
                false,
            ),
        );

        expect(() => transaction.freeze()).not.toThrow();
    });

    it.each([
        ["no proof", { publicKey: undefined, signature: undefined }],
        ["empty key", { publicKey: new Uint8Array() }],
        ["empty signature", { signature: new Uint8Array() }],
    ])(
        "rejects signed frozen bytes with %s before execution sends an RPC",
        async function (_name, proof) {
            completeConnector();
            const transaction = sdk.Transaction.fromBytes(
                wireBytes({ ...wireBody(), ...proof }),
            );
            const client = new sdk.WebClient({
                network: { "127.0.0.1:50211": "0.0.3" },
                scheduleNetworkUpdate: false,
            });
            const originalFetch = globalThis.fetch;
            let rpcCalls = 0;
            globalThis.fetch = () => {
                rpcCalls += 1;
                return Promise.reject(new Error("unexpected RPC"));
            };

            try {
                expect(transaction.isFrozen()).toBe(true);
                expect(
                    privateKey().publicKey.verifyTransaction(transaction),
                ).toBe(true);
                await expect(
                    transaction.setMaxAttempts(1).execute(client),
                ).rejects.toThrow(/complete ownership proof/i);
                expect(rpcCalls).toBe(0);
            } finally {
                client.close();
                globalThis.fetch = originalFetch;
            }
        },
    );

    it.each(["0", "9223372036854775807"])(
        "round-trips %s tinybars exactly as unsigned lockedStake",
        function (amount) {
            const transaction = offline(ready());
            expect(
                transaction.setLockedStake(sdk.Hbar.fromTinybars(amount)),
            ).toBe(transaction);
            transaction.freeze();
            const encoded = transaction.toBytes();
            const body = proto.TransactionBody.decode(
                signedBodies(encoded)[0].bodyBytes,
            ).clprCompleteConnector;
            const decoded = sdk.Transaction.fromBytes(encoded);

            expect(body.lockedStake.unsigned).toBe(true);
            expect(body.lockedStake.toString()).toBe(amount);
            expect(decoded.lockedStake.to(sdk.HbarUnit.Tinybar).toFixed()).toBe(
                amount,
            );
            expect(decoded.toBytes()).toEqual(encoded);
        },
    );

    it.each(["-1", "9223372036854775808"])(
        "rejects %s tinybars before changing lockedStake",
        function (amount) {
            const transaction = ready().setLockedStake(
                sdk.Hbar.fromTinybars("7"),
            );
            const stake = sdk.Hbar.fromTinybars(amount);

            expect(() => transaction.setLockedStake(stake)).toThrow(
                /lockedStake/,
            );
            expect(
                transaction.lockedStake.to(sdk.HbarUnit.Tinybar).toFixed(),
            ).toBe("7");
            expect(() => completeConnector({ lockedStake: stake })).toThrow(
                /lockedStake/,
            );
        },
    );

    it("rejects fractional tinybars through the public Hbar construction and setter chain", function () {
        const transaction = ready().setLockedStake(sdk.Hbar.fromTinybars("7"));

        expect(() =>
            transaction.setLockedStake(new sdk.Hbar("0.000000005")),
        ).toThrow(/tinybars contains decimals/);
        expect(transaction.lockedStake.to(sdk.HbarUnit.Tinybar).toFixed()).toBe(
            "7",
        );
    });

    it("defaults lockedStake to zero and allows completion without a local connector contract", function () {
        const transaction = offline(ready()).freeze();
        const decoded = sdk.Transaction.fromBytes(transaction.toBytes());

        expect(transaction.lockedStake).toBeInstanceOf(sdk.Hbar);
        expect(transaction.lockedStake.toTinybars().toString()).toBe("0");
        expect(decoded.lockedStake.toTinybars().toString()).toBe("0");
        expect(decoded.connectorContract).toBeNull();
    });

    it.each([
        ["public key", () => privateKey().publicKey],
        ["threshold key", adminKey],
        [
            "key list",
            () =>
                new sdk.KeyList(
                    vectors.vectors.map(
                        (vector) => privateKey(vector).publicKey,
                    ),
                ),
        ],
        ["contract key", () => new sdk.ContractId(345)],
    ])("round-trips a %s adminKey", function (_name, value) {
        const key = value();
        const transaction = offline(ready());
        expect(transaction.setAdminKey(key)).toBe(transaction);
        transaction.freeze();
        const decoded = sdk.Transaction.fromBytes(transaction.toBytes());

        expect(decoded.adminKey).toBeInstanceOf(sdk.Key);
        expect(decoded.adminKey.toString()).toBe(key.toString());
    });

    it("keeps the ownership proof when setting the admin key, stake or contract", function () {
        const transaction = offline(ready());
        const publicKey = transaction.publicKey;
        const signature = transaction.signature;
        const scheme = transaction.signatureScheme;

        expect(transaction.setAdminKey(privateKey().publicKey)).toBe(
            transaction,
        );
        expect(transaction.setLockedStake(new sdk.Hbar(1))).toBe(transaction);
        expect(transaction.setConnectorContract("1.2.345")).toBe(transaction);
        expect(transaction.publicKey).toEqual(publicKey);
        expect(transaction.signature).toEqual(signature);
        expect(transaction.signatureScheme).toBe(scheme);
        expect(() => transaction.freeze()).not.toThrow();
    });

    it("round-trips an EVM connector contract and copies its address on input and output", async function () {
        const address = "0011223344556677889900112233445577889900";
        const contract = sdk.ContractId.fromEvmAddress(0, 0, address);
        const transaction = offline(ready().setConnectorContract(contract));

        contract.evmAddress.fill(0);
        transaction.connectorContract.evmAddress.fill(0);
        expect(transaction.connectorContract.toEvmAddress()).toBe(address);
        transaction.freeze();
        await transaction.sign(privateKey());
        const encoded = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(encoded);

        expect(decoded.connectorContract.toString()).toBe(`0.0.${address}`);
        expect(decoded.connectorContract.toEvmAddress()).toBe(address);
        expect(decoded.toBytes()).toEqual(encoded);
        expect(privateKey().publicKey.verifyTransaction(decoded)).toBe(true);
    });

    it.each([
        ["setChannelId", () => bytes(vectors.channelId)],
        ["setConnectorId", () => bytes(vectors.vectors[1].connectorId)],
        ["setSalt", () => bytes(vectors.salt)],
        ["setAdminKey", adminKey],
        ["setConnectorContract", () => new sdk.ContractId(345)],
        ["setLockedStake", () => new sdk.Hbar(1)],
        ["setOwnershipProof", privateKey],
    ])(
        "rejects %s after freeze and preserves signed bytes",
        async function (setter, value) {
            const transaction = offline(ready()).freeze();
            await transaction.sign(privateKey());
            const encoded = transaction.toBytes();

            expect(() => transaction[setter](value())).toThrow(/immutable/);
            expect(transaction.toBytes()).toEqual(encoded);
        },
    );

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
        const transaction = ready();

        expect(() => schedule(transaction)).toThrow(
            new Error("ClprCompleteConnectorTransaction cannot be scheduled"),
        );
    });

    it("exposes nullable proof getters without raw proof setters", function () {
        const transaction = completeConnector();

        expect(transaction.publicKey).toBeNull();
        expect(transaction.signature).toBeNull();
        expect(transaction.signatureScheme).toBeNull();
        expect(transaction.setPublicKey).toBeUndefined();
        expect(transaction.setSignature).toBeUndefined();
        expect(transaction.setSignatureScheme).toBeUndefined();
    });

    it.each(vectors.vectors)(
        "serializes $signatureScheme after releasing the ownership key without private material",
        function (vector) {
            const key = privateKey(vector);
            const raw = key.toBytesRaw();
            const der = key.toStringDer();
            const { proxy, revoke } = Proxy.revocable(key, {});
            const transaction = offline(
                completeConnector({
                    ...boundProps(vector),
                    adminKey: adminKey(),
                }).setOwnershipProof(proxy),
            );

            revoke();
            const json = JSON.stringify(transaction);
            expect(json).not.toContain(vector.privateKeyOrSeed);
            expect(json).not.toContain(der);
            expect(json).not.toContain(JSON.stringify(raw));
            expect(json).not.toContain(JSON.stringify(Array.from(raw)));
            transaction.freeze();
            const encoded = transaction.toBytes();
            expect(hex.encode(encoded)).not.toContain(vector.privateKeyOrSeed);
            expect(hex.encode(encoded)).not.toContain(der);
            expect(hex.encode(transaction.publicKey)).toBe(vector.publicKey);
            const decoded = sdk.Transaction.fromBytes(encoded);
            expect(decoded.publicKey).toEqual(transaction.publicKey);
            expect(decoded.signature).toEqual(transaction.signature);
            expect(decoded.toBytes()).toEqual(encoded);
        },
    );
});
