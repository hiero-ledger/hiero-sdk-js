// SPDX-License-Identifier: Apache-2.0

import { concat, getBytes, keccak256 } from "ethers";
import { proto } from "@hiero-ledger/proto";
import * as sdk from "../../../src/exports.js";
import { contractBytes, keyBytes } from "../../../src/clpr/ownership.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprPhase2OwnershipVectors.js";

const address = "0011223344556677889900112233445577889900";
const evmContract = () => sdk.ContractId.fromEvmAddress(0, 0, address);
const channelId = () => hex.decode(vectors.channelId);
const key = (vector) =>
    vector.signatureScheme === "ECDSA_SECP256K1"
        ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
        : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
const digest = (bytes) => getBytes(keccak256(bytes));
const canonicalEvm = () => hex.decode(`2214${address}`);
const adminKey = () =>
    new sdk.KeyList([
        new sdk.KeyList([key(vectors.vectors[1]).publicKey, evmContract()], 1),
        new sdk.DelegateContractId(0, 0, 0, hex.decode(address)),
    ]);

// PBJ ContractID has one selected contract field and omits zero scalar defaults.
function canonicalAdmin() {
    const contract = { evmAddress: hex.decode(address) };
    return proto.Key.encode({
        keyList: {
            keys: [
                {
                    thresholdKey: {
                        threshold: 1,
                        keys: {
                            keys: [
                                {
                                    ed25519: hex.decode(
                                        vectors.vectors[1].publicKey,
                                    ),
                                },
                                { contractID: contract },
                            ],
                        },
                    },
                },
                { delegatableContractId: contract },
            ],
        },
    }).finish();
}

function channelPreimage(id, contract, config, manifest) {
    return getBytes(
        concat([
            new TextEncoder().encode("hiero.clpr.complete-channel.v1"),
            id,
            digest(contract),
            digest(config),
            digest(manifest),
        ]),
    );
}

function connectorPreimage(id, connectorId, contract, admin) {
    return getBytes(
        concat([
            new TextEncoder().encode("hiero.clpr.complete-connector.v1"),
            id,
            connectorId,
            hex.decode(vectors.clprServiceAddress),
            digest(contract),
            digest(admin),
        ]),
    );
}

function verifies(vector, signature, preimage) {
    return key(vector).publicKey.verify(
        vector.signatureScheme === "ED25519" ? digest(preimage) : preimage,
        signature,
    );
}

describe("provisional CLPR Phase 2 signing", function () {
    it("matches PBJ ContractID/key oneofs for numeric, EVM and nested delegate keys", function () {
        expect(hex.encode(contractBytes(new sdk.ContractId(366)))).toBe(
            "18ee02",
        );
        expect(hex.encode(contractBytes(evmContract()))).toBe(`2214${address}`);
        expect(keyBytes(adminKey())).toEqual(canonicalAdmin());
        expect(hex.encode(contractBytes(new sdk.ContractId(0)))).toBe("1800");
    });

    it.each(["channel", "connector"])(
        "detaches mutable numeric ContractID fields before signing %s",
        function (kind) {
            const original = new sdk.ContractId(1, 2, 345);
            const transaction =
                kind === "channel"
                    ? new sdk.ClprCompleteChannelTransaction({
                          channelId: channelId(),
                          verifierContract: original,
                          configProofBytes: new Uint8Array([1]),
                          endpointManifestProofBytes: new Uint8Array(),
                      })
                    : new sdk.ClprCompleteConnectorTransaction({
                          channelId: channelId(),
                          connectorId: hex.decode(
                              vectors.vectors[1].connectorId,
                          ),
                          salt: hex.decode(vectors.salt),
                          connectorContract: original,
                          adminKey: key(vectors.vectors[1]).publicKey,
                      });
            transaction.setOwnershipProof(key(vectors.vectors[1]));
            const signature = transaction.signature;
            const field =
                kind === "channel" ? "verifierContract" : "connectorContract";
            original.num.low = 999;
            original.shard.low = 999;
            original.realm.low = 999;
            const returned = transaction[field];
            returned.num.low = 888;
            returned.shard.low = 888;
            returned.realm.low = 888;
            expect(transaction[field].toString()).toBe("1.2.345");
            expect(transaction.signature).toEqual(signature);
            const wire = transaction._makeTransactionData();
            expect(sdk.ContractId._fromProtobuf(wire[field]).toString()).toBe(
                "1.2.345",
            );
        },
    );

    it("detaches mutable ContractID fields nested in an administrative key", function () {
        const original = new sdk.ContractId(1, 2, 345);
        const administrativeKey = new sdk.KeyList([
            new sdk.KeyList([original], 1),
        ]);
        const transaction = new sdk.ClprCompleteConnectorTransaction({
            channelId: channelId(),
            connectorId: hex.decode(vectors.vectors[1].connectorId),
            salt: hex.decode(vectors.salt),
            connectorContract: "1.2.345",
            adminKey: administrativeKey,
        }).setOwnershipProof(key(vectors.vectors[1]));
        const signature = transaction.signature;
        original.num.low = 999;
        original.shard.low = 999;
        transaction.adminKey.toArray()[0].toArray()[0].num.low = 888;
        expect(transaction.adminKey.toArray()[0].toArray()[0].toString()).toBe(
            "1.2.345",
        );
        expect(transaction.signature).toEqual(signature);
        const wireKey = sdk.Key._fromProtobufKey(
            transaction._makeTransactionData().adminKey,
        );
        expect(wireKey.toArray()[0].toArray()[0].toString()).toBe("1.2.345");
    });

    it.each(vectors.vectors)(
        "binds every Channel completion input for $signatureScheme with an EVM verifier",
        function (vector) {
            const config = hex.decode(vectors.configProofBytes);
            const manifest = hex.decode(vectors.endpointManifestProofBytes);
            const transaction = new sdk.ClprCompleteChannelTransaction({
                channelId: channelId(),
                verifierContract: evmContract(),
                configProofBytes: config,
                endpointManifestProofBytes: manifest,
            }).setOwnershipProof(key(vector));
            const inputs = [channelId(), canonicalEvm(), config, manifest];
            expect(
                verifies(
                    vector,
                    transaction.signature,
                    channelPreimage(...inputs),
                ),
            ).toBe(true);
            for (let i = 0; i < inputs.length; i++) {
                const changed = inputs.map((bytes) => new Uint8Array(bytes));
                changed[i][changed[i].length - 1] ^= 1;
                expect(
                    verifies(
                        vector,
                        transaction.signature,
                        channelPreimage(...changed),
                    ),
                ).toBe(false);
            }
        },
    );

    it.each(vectors.vectors)(
        "binds every Connector completion input for $signatureScheme with nested contract keys",
        function (vector) {
            const connectorId = hex.decode(vector.connectorId);
            const transaction = new sdk.ClprCompleteConnectorTransaction({
                channelId: channelId(),
                connectorId,
                salt: hex.decode(vectors.salt),
                connectorContract: evmContract(),
                adminKey: adminKey(),
            }).setOwnershipProof(key(vector));
            const inputs = [
                channelId(),
                connectorId,
                canonicalEvm(),
                canonicalAdmin(),
            ];
            expect(
                verifies(
                    vector,
                    transaction.signature,
                    connectorPreimage(...inputs),
                ),
            ).toBe(true);
            for (let i = 0; i < inputs.length; i++) {
                const changed = inputs.map((bytes) => new Uint8Array(bytes));
                changed[i][changed[i].length - 1] ^= 1;
                expect(
                    verifies(
                        vector,
                        transaction.signature,
                        connectorPreimage(...changed),
                    ),
                ).toBe(false);
            }
            const signature = transaction.signature;
            transaction
                .setConnectorContract(evmContract())
                .setAdminKey(adminKey());
            expect(transaction.signature).toEqual(signature);
        },
    );
});
