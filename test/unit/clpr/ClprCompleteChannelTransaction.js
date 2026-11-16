// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import { Signature, SigningKey, keccak256 } from "ethers";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function channelId() {
    return new Uint8Array(hex.decode(vectors.channelId));
}

function privateKey(vector = vectors.vectors[1]) {
    return vector.signatureScheme === "ECDSA_SECP256K1"
        ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
        : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
}

function completeChannel(props) {
    expect(
        sdk.ClprCompleteChannelTransaction,
        "SDK must export ClprCompleteChannelTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprCompleteChannelTransaction(props);
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

function signedBodies(bytes) {
    return proto.TransactionList.decode(bytes).transactionList.map(
        (transaction) =>
            proto.SignedTransaction.decode(transaction.signedTransactionBytes),
    );
}

function wireBytes(completion, signed = true) {
    const bodyBytes = proto.TransactionBody.encode({
        transactionID: sdk.TransactionId.fromString(
            "0.0.5006@1596210382.0",
        )._toProtobuf(),
        nodeAccountID: new sdk.AccountId(3)._toProtobuf(),
        transactionFee: new sdk.Hbar(1).toTinybars(),
        transactionValidDuration: { seconds: 120 },
        clprCompleteChannel: completion,
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

function canonicalSignature(bytes) {
    expect(bytes).toHaveLength(64);
    // A recovery byte distinguishes r || s from compact EIP-2098 encoding.
    const signature = Signature.from(`0x${hex.encode(bytes)}1b`).getCanonical();
    return signature.r.substring(2) + signature.s.substring(2);
}

const byteFields = [
    ["channelId", "setChannelId", channelId],
    [
        "configProofBytes",
        "setConfigProofBytes",
        () => new Uint8Array([255, 0, 7]),
    ],
    [
        "endpointManifestProofBytes",
        "setEndpointManifestProofBytes",
        () => new Uint8Array([128, 0, 9, 255]),
    ],
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

describe("ClprCompleteChannelTransaction", function () {
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprCompleteChannelTransaction).toBeTypeOf("function");
        expect(entry.ClprCompleteChannelTransaction).toBe(
            sdk.ClprCompleteChannelTransaction,
        );
    });

    it.each(vectors.vectors)(
        "creates the HIP ownership proof and verifies channelDigest for $signatureScheme",
        function (vector) {
            const transaction = completeChannel().setChannelId(channelId());
            const key = privateKey(vector);

            expect(transaction.setOwnershipProof(key)).toBe(transaction);
            expect(hex.encode(transaction.publicKey)).toBe(vector.publicKey);
            expect(transaction.signatureScheme).toBe(
                sdk.ClprSignatureScheme[vector.signatureScheme],
            );
            expect(transaction.signature).toBeInstanceOf(Uint8Array);
            expect(transaction.signature).toHaveLength(64);

            if (vector.signatureScheme === "ECDSA_SECP256K1") {
                expect(canonicalSignature(transaction.signature)).toBe(
                    canonicalSignature(hex.decode(vector.channelSignature)),
                );
                const signature = Signature.from(
                    `0x${canonicalSignature(transaction.signature)}1b`,
                );
                expect(
                    [27, 28].map((v) =>
                        SigningKey.recoverPublicKey(
                            `0x${vector.channelDigest}`,
                            {
                                r: signature.r,
                                s: signature.s,
                                v,
                            },
                        ),
                    ),
                ).toContain(`0x04${vector.publicKey}`);
            } else {
                expect(hex.encode(transaction.signature)).toBe(
                    vector.channelSignature,
                );
                expect(
                    key.publicKey.verify(
                        hex.decode(vector.channelDigest),
                        transaction.signature,
                    ),
                ).toBe(true);
            }
        },
    );

    it.each(vectors.vectors)(
        "decodes signed $signatureScheme proof bytes and forwards them unchanged without the ownership key",
        function (vector) {
            completeChannel();
            // Omit the ECDSA enum field to exercise the protobuf default zero.
            const bytes = wireBytes({
                channelId: channelId(),
                publicKey: hex.decode(vector.publicKey),
                signature: hex.decode(vector.channelSignature),
                ...(vector.signatureScheme === "ED25519"
                    ? { signatureScheme: 1 }
                    : {}),
                verifierContract: {
                    shardNum: 1,
                    realmNum: 2,
                    contractNum: 345,
                },
                configProofBytes: new Uint8Array([255, 0, 7]),
                endpointManifestProofBytes: new Uint8Array([128, 0, 9, 255]),
            });
            const decoded = sdk.Transaction.fromBytes(bytes);

            expect(decoded).toBeInstanceOf(sdk.ClprCompleteChannelTransaction);
            expect(decoded.channelId).toEqual(channelId());
            expect(hex.encode(decoded.publicKey)).toBe(vector.publicKey);
            expect(hex.encode(decoded.signature)).toBe(vector.channelSignature);
            expect(decoded.signatureScheme).toBe(
                sdk.ClprSignatureScheme[vector.signatureScheme],
            );
            expect(decoded.signatureScheme.toString()).toBe(
                vector.signatureScheme,
            );
            expect(decoded.verifierContract).toBeInstanceOf(sdk.ContractId);
            expect(decoded.verifierContract.toString()).toBe("1.2.345");
            expect(decoded.configProofBytes).toEqual(
                new Uint8Array([255, 0, 7]),
            );
            expect(decoded.endpointManifestProofBytes).toEqual(
                new Uint8Array([128, 0, 9, 255]),
            );
            for (const field of [
                "channelId",
                "publicKey",
                "signature",
                "configProofBytes",
                "endpointManifestProofBytes",
            ]) {
                decoded[field].fill(0);
            }
            expect(decoded.channelId).toEqual(channelId());
            expect(hex.encode(decoded.publicKey)).toBe(vector.publicKey);
            expect(hex.encode(decoded.signature)).toBe(vector.channelSignature);
            expect(decoded.configProofBytes).toEqual(
                new Uint8Array([255, 0, 7]),
            );
            expect(decoded.endpointManifestProofBytes).toEqual(
                new Uint8Array([128, 0, 9, 255]),
            );
            expect(decoded.toBytes()).toEqual(bytes);
            expect(privateKey().publicKey.verifyTransaction(decoded)).toBe(
                true,
            );
        },
    );

    it.each(vectors.vectors)(
        "round-trips a newly built $signatureScheme completion with every node signature",
        async function (vector) {
            const transaction = offline(
                completeChannel()
                    .setChannelId(channelId())
                    .setOwnershipProof(privateKey(vector))
                    .setVerifierContract(new sdk.ContractId(1, 2, 345))
                    .setConfigProofBytes(new Uint8Array([255, 0, 7]))
                    .setEndpointManifestProofBytes(
                        new Uint8Array([128, 0, 9, 255]),
                    ),
            ).freeze();
            const keys = vectors.vectors.map((value) => privateKey(value));
            for (const key of keys) {
                await transaction.sign(key);
            }
            const bytes = transaction.toBytes();
            const decoded = sdk.Transaction.fromBytes(bytes);

            expect(decoded).toBeInstanceOf(sdk.ClprCompleteChannelTransaction);
            expect(decoded.channelId).toEqual(channelId());
            expect(decoded.publicKey).toEqual(transaction.publicKey);
            expect(decoded.signature).toEqual(transaction.signature);
            expect(decoded.signatureScheme).toBe(transaction.signatureScheme);
            expect(decoded.verifierContract.toString()).toBe("1.2.345");
            expect(decoded.configProofBytes).toEqual(
                transaction.configProofBytes,
            );
            expect(decoded.endpointManifestProofBytes).toEqual(
                transaction.endpointManifestProofBytes,
            );
            expect(decoded.nodeAccountIds.map(String)).toEqual([
                "0.0.3",
                "0.0.4",
            ]);
            expect(decoded.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            expect(decoded.toBytes()).toEqual(bytes);
            expect(decoded.getSignatures().size).toBe(2);
            for (const signed of signedBodies(bytes)) {
                expect(
                    proto.TransactionBody.decode(signed.bodyBytes).data,
                ).toBe("clprCompleteChannel");
                expect(signed.sigMap.sigPair).toHaveLength(2);
            }
            for (const key of keys) {
                expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
            }
        },
    );

    it("returns null for all proof getters until an ownership proof is set", function () {
        const transaction = completeChannel();

        expect(transaction.publicKey).toBeNull();
        expect(transaction.signature).toBeNull();
        expect(transaction.signatureScheme).toBeNull();
        transaction.setChannelId(channelId());
        expect(transaction.publicKey).toBeNull();
        expect(transaction.signature).toBeNull();
        expect(transaction.signatureScheme).toBeNull();
    });

    it("decodes an absent proof with three null getters", function () {
        completeChannel();
        const transaction = sdk.Transaction.fromBytes(
            wireBytes({ channelId: channelId() }, false),
        );

        expect(transaction.publicKey).toBeNull();
        expect(transaction.signature).toBeNull();
        expect(transaction.signatureScheme).toBeNull();
    });

    it("rejects execution preparation for signed completion bytes without a proof before any RPC", async function () {
        const transaction = sdk.Transaction.fromBytes(
            wireBytes({ channelId: channelId() }),
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
            expect(privateKey().publicKey.verifyTransaction(transaction)).toBe(
                true,
            );
            await expect(transaction._beforeExecute(client)).rejects.toThrow(
                /complete ownership proof/i,
            );
            expect(rpcCalls).toBe(0);
        } finally {
            client.close();
            globalThis.fetch = originalFetch;
        }
    });

    it.each(["same", "different"])(
        "keeps or clears the proof when setting the %s Channel ID according to byte changes",
        function (kind) {
            const transaction = offline(
                completeChannel()
                    .setChannelId(channelId())
                    .setOwnershipProof(privateKey()),
            );
            const nextId =
                kind === "same" ? channelId() : new Uint8Array(32).fill(8);
            const publicKey = transaction.publicKey;
            const signature = transaction.signature;
            const scheme = transaction.signatureScheme;

            expect(transaction.setChannelId(nextId)).toBe(transaction);
            expect(transaction.channelId).toEqual(nextId);
            if (kind === "same") {
                expect(transaction.publicKey).toEqual(publicKey);
                expect(transaction.signature).toEqual(signature);
                expect(transaction.signatureScheme).toBe(scheme);
                expect(() => transaction.freeze()).not.toThrow();
                return;
            }
            expect(transaction.publicKey).toBeNull();
            expect(transaction.signature).toBeNull();
            expect(transaction.signatureScheme).toBeNull();
            expect(() => transaction.freeze()).toThrow(/proof/i);
            expect(transaction.isFrozen()).toBe(false);
            transaction.setOwnershipProof(privateKey());
            expect(
                privateKey().publicKey.verify(
                    hex.decode(keccak256(nextId)),
                    transaction.signature,
                ),
            ).toBe(true);
            expect(() => transaction.freeze()).not.toThrow();
        },
    );

    it.each(["freeze", "freezeWith"])(
        "rejects %s without channelId before freezing and allows repair",
        function (method) {
            const transaction = offline(completeChannel());

            expect(() => transaction[method](null)).toThrow(/channelId/);
            expect(transaction.isFrozen()).toBe(false);
            transaction
                .setChannelId(channelId())
                .setOwnershipProof(privateKey());
            expect(() => transaction[method](null)).not.toThrow();
        },
    );

    it.each(["freeze", "freezeWith"])(
        "rejects %s without an ownership proof before freezing and allows repair",
        function (method) {
            const transaction = offline(
                completeChannel().setChannelId(channelId()),
            );

            expect(() => transaction[method](null)).toThrow(/proof/i);
            expect(transaction.isFrozen()).toBe(false);
            transaction.setOwnershipProof(privateKey());
            expect(() => transaction[method](null)).not.toThrow();
        },
    );

    it.each([
        ["empty key", new Uint8Array(), new Uint8Array(64)],
        ["empty signature", new Uint8Array(32), new Uint8Array()],
        ["both empty", new Uint8Array(), new Uint8Array()],
    ])(
        "rejects an incomplete decoded proof with %s",
        function (_name, publicKey, signature) {
            completeChannel();
            const transaction = sdk.Transaction.fromBytes(
                wireBytes(
                    {
                        channelId: channelId(),
                        publicKey,
                        signature,
                        signatureScheme: 1,
                    },
                    false,
                ),
            );

            expect(transaction.isFrozen()).toBe(false);
            expect(() => transaction.freeze()).toThrow(/proof/i);
            expect(transaction.isFrozen()).toBe(false);
            transaction.setOwnershipProof(privateKey());
            expect(() => transaction.freeze()).not.toThrow();
        },
    );

    it("accepts a decoded proof as complete when its key and signature are non-empty", function () {
        completeChannel();
        const transaction = sdk.Transaction.fromBytes(
            wireBytes(
                {
                    channelId: channelId(),
                    publicKey: new Uint8Array([1]),
                    signature: new Uint8Array([2]),
                    signatureScheme: 1,
                },
                false,
            ),
        );

        expect(() => transaction.freeze()).not.toThrow();
    });

    it("requires channelId before signing and leaves no partial proof on failure", function () {
        const transaction = completeChannel();

        expect(() => transaction.setOwnershipProof(privateKey())).toThrow(
            /channelId/,
        );
        expect(transaction.publicKey).toBeNull();
        expect(transaction.signature).toBeNull();
        expect(transaction.signatureScheme).toBeNull();
        transaction.setChannelId(channelId()).setOwnershipProof(privateKey());
        expect(transaction.signatureScheme).toBe(
            sdk.ClprSignatureScheme.ED25519,
        );
    });

    it.each([31, 33])(
        "rejects a %i-byte channelId before changing the ID or clearing its proof",
        function (length) {
            const transaction = offline(
                completeChannel()
                    .setChannelId(channelId())
                    .setOwnershipProof(privateKey()),
            );
            const publicKey = transaction.publicKey;
            const signature = transaction.signature;
            const scheme = transaction.signatureScheme;

            expect(() =>
                transaction.setChannelId(new Uint8Array(length)),
            ).toThrow(/channelId/);
            expect(transaction.channelId).toEqual(channelId());
            expect(transaction.publicKey).toEqual(publicKey);
            expect(transaction.signature).toEqual(signature);
            expect(transaction.signatureScheme).toBe(scheme);
            expect(() => transaction.freeze()).not.toThrow();
        },
    );

    for (const [field, setter, value] of byteFields) {
        it.each(["constructor", "setter"])(
            `copies ${field} input and output bytes through the %s`,
            function (path) {
                const input = value();
                const transaction =
                    path === "constructor"
                        ? completeChannel({ [field]: input })
                        : completeChannel()[setter](input);

                input.fill(0);
                expect(transaction[field]).toEqual(value());
                expect(transaction[field]).toBeInstanceOf(Uint8Array);
                transaction[field].fill(0);
                expect(transaction[field]).toEqual(value());
            },
        );
    }

    it("round-trips an EVM verifier in a signed completion", async function () {
        const address = "0011223344556677889900112233445577889900";
        const transaction = offline(
            completeChannel()
                .setChannelId(channelId())
                .setOwnershipProof(privateKey())
                .setVerifierContract(
                    sdk.ContractId.fromEvmAddress(0, 0, address),
                ),
        ).freeze();
        await transaction.sign(privateKey());
        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded.verifierContract.toString()).toBe(`0.0.${address}`);
        expect(decoded.verifierContract.toEvmAddress()).toBe(address);
        expect(decoded.toBytes()).toEqual(bytes);
        expect(privateKey().publicKey.verifyTransaction(decoded)).toBe(true);
    });

    it.each(["caller", "getter"])(
        "keeps verifier bytes independent from the %s ContractId",
        function (source) {
            const address = "0011223344556677889900112233445577889900";
            const verifier = sdk.ContractId.fromEvmAddress(0, 0, address);
            const transaction = offline(
                completeChannel()
                    .setChannelId(channelId())
                    .setOwnershipProof(privateKey())
                    .setVerifierContract(verifier),
            );
            const returned =
                source === "caller" ? verifier : transaction.verifierContract;

            returned.evmAddress.fill(0);

            expect(transaction.verifierContract.toEvmAddress()).toBe(address);
            transaction.freeze();
            const decoded = sdk.Transaction.fromBytes(transaction.toBytes());
            expect(decoded.verifierContract.toEvmAddress()).toBe(address);
        },
    );

    it("allows completion without a verifier or either opaque proof field", function () {
        const transaction = offline(
            completeChannel()
                .setChannelId(channelId())
                .setOwnershipProof(privateKey()),
        );

        expect(() => transaction.freeze()).not.toThrow();
        const body = proto.TransactionBody.decode(
            signedBodies(transaction.toBytes())[0].bodyBytes,
        );
        expect(body.clprCompleteChannel.verifierContract).toBeNull();
        expect(body.clprCompleteChannel.configProofBytes).toHaveLength(0);
        expect(
            body.clprCompleteChannel.endpointManifestProofBytes,
        ).toHaveLength(0);
    });

    it("keeps the ownership proof when setting opaque verifier values", function () {
        const transaction = offline(
            completeChannel()
                .setChannelId(channelId())
                .setOwnershipProof(privateKey()),
        );
        const publicKey = transaction.publicKey;
        const signature = transaction.signature;

        expect(transaction.setVerifierContract(new sdk.ContractId(345))).toBe(
            transaction,
        );
        expect(transaction.setConfigProofBytes(new Uint8Array())).toBe(
            transaction,
        );
        expect(
            transaction.setEndpointManifestProofBytes(new Uint8Array([255])),
        ).toBe(transaction);
        expect(transaction.publicKey).toEqual(publicKey);
        expect(transaction.signature).toEqual(signature);
        expect(transaction.signatureScheme).toBe(
            sdk.ClprSignatureScheme.ED25519,
        );
        expect(() => transaction.freeze()).not.toThrow();
    });

    it.each([
        ["setChannelId", () => channelId()],
        ["setVerifierContract", () => new sdk.ContractId(345)],
        ["setConfigProofBytes", () => new Uint8Array([1])],
        ["setEndpointManifestProofBytes", () => new Uint8Array([2])],
        ["setOwnershipProof", () => privateKey(vectors.vectors[0])],
    ])(
        "refuses %s after freeze and preserves signed bytes",
        async function (setter, value) {
            const transaction = offline(
                completeChannel()
                    .setChannelId(channelId())
                    .setOwnershipProof(privateKey()),
            ).freeze();
            await transaction.sign(privateKey());
            const bytes = transaction.toBytes();

            expect(() => transaction[setter](value())).toThrow(/immutable/);
            expect(transaction.toBytes()).toEqual(bytes);
        },
    );

    it.each(schedulingPaths)("refuses %s", function (_name, schedule) {
        const transaction = completeChannel()
            .setChannelId(channelId())
            .setOwnershipProof(privateKey());

        expect(() => schedule(transaction)).toThrow(
            new Error("ClprCompleteChannelTransaction cannot be scheduled"),
        );
    });

    it("exposes proof getters without raw proof setters", function () {
        const transaction = completeChannel();

        expect(transaction.setPublicKey).toBeUndefined();
        expect(transaction.setSignature).toBeUndefined();
        expect(transaction.setSignatureScheme).toBeUndefined();
    });

    it.each(vectors.vectors)(
        "serializes the $signatureScheme builder after releasing the ownership key without private material",
        function (vector) {
            const key = privateKey(vector);
            const raw = key.toBytesRaw();
            const der = key.toStringDer();
            const { proxy, revoke } = Proxy.revocable(key, {});
            const transaction = offline(
                completeChannel()
                    .setChannelId(channelId())
                    .setOwnershipProof(proxy),
            );

            revoke();
            transaction.publicKey.fill(0);
            transaction.signature.fill(0);
            const json = JSON.stringify(transaction);
            expect(json).not.toContain(vector.privateKeyOrSeed);
            expect(json).not.toContain(der);
            expect(json).not.toContain(JSON.stringify(raw));
            expect(json).not.toContain(JSON.stringify(Array.from(raw)));
            transaction.freeze();
            const bytes = transaction.toBytes();
            expect(hex.encode(bytes)).not.toContain(vector.privateKeyOrSeed);
            expect(hex.encode(bytes)).not.toContain(der);
            expect(hex.encode(transaction.publicKey)).toBe(vector.publicKey);
            if (vector.signatureScheme === "ECDSA_SECP256K1") {
                expect(canonicalSignature(transaction.signature)).toBe(
                    canonicalSignature(hex.decode(vector.channelSignature)),
                );
            } else {
                expect(hex.encode(transaction.signature)).toBe(
                    vector.channelSignature,
                );
            }
            const decoded = sdk.Transaction.fromBytes(bytes);
            expect(decoded.publicKey).toEqual(transaction.publicKey);
            expect(decoded.signature).toEqual(transaction.signature);
            expect(decoded.toBytes()).toEqual(bytes);
        },
    );
});
