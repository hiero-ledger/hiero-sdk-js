// SPDX-License-Identifier: Apache-2.0

import { proto } from "@hiero-ledger/proto";
import { getBytes, keccak256 } from "ethers";
import {
    AccountId,
    ClprCreateChannelTransaction,
    ClprCreateConnectorTransaction,
    ClprDeleteChannelTransaction,
    ClprDeleteConnectorTransaction,
    Hbar,
    PrivateKey,
    Transaction,
    TransactionId,
} from "../../../src/exports.js";
import vectors from "../utils/ClprOwnershipVectors.js";

const expectedId = new Uint8Array(32).fill(1);
const salt = new Uint8Array(32).fill(2);
const transactionId = TransactionId.fromString("0.0.5006@1596210382.0");

function freeze(transaction) {
    return transaction
        .setNodeAccountIds([new AccountId(3)])
        .setTransactionId(transactionId)
        .freeze();
}

function rawTransactionWithData(data) {
    const prefix = proto.TransactionBody.encode({
        nodeAccountID: new AccountId(3)._toProtobuf(),
        transactionID: transactionId._toProtobuf(),
    }).finish();
    return proto.TransactionList.encode({
        transactionList: [
            {
                signedTransactionBytes: proto.SignedTransaction.encode({
                    bodyBytes: Uint8Array.from([...prefix, ...data]),
                }).finish(),
            },
        ],
    }).finish();
}

describe("RC3 CLPR lifecycle", function () {
    it("round-trips the expected ID, verifier and opaque Channel proofs", function () {
        const proof = Uint8Array.of(0xff, 0x00, 0x80);
        const transaction = new ClprCreateChannelTransaction({
            channelId: expectedId,
            salt,
            verifierContract: "1.2.3",
            peerVerifier: Uint8Array.of(0xff),
            configProofBytes: proof,
            endpointManifestProofBytes: new Uint8Array(),
        });
        proof.fill(0);
        transaction.salt.fill(0);
        const encoded = freeze(transaction).toBytes();
        const decoded = Transaction.fromBytes(encoded);
        expect(decoded).toBeInstanceOf(ClprCreateChannelTransaction);
        expect(decoded.channelId).to.deep.equal(expectedId);
        expect(decoded.salt).to.deep.equal(salt);
        expect(decoded.verifierContract.toString()).to.equal("1.2.3");
        expect(decoded.peerVerifier).to.deep.equal(Uint8Array.of(0xff));
        expect(decoded.configProofBytes).to.deep.equal(
            Uint8Array.of(0xff, 0x00, 0x80),
        );
        expect(decoded.endpointManifestProofBytes).to.deep.equal(
            new Uint8Array(),
        );
        expect(decoded.toBytes()).to.deep.equal(encoded);
        expect(() => decoded.setSalt(salt)).to.throw(/frozen/i);
    });

    it("derives Channel IDs matching the Consensus Node vectors from either ledger", function () {
        // ClprCreateChannelHandlerTest at hiero-consensus-node bbd86c90.
        const hiero = {
            chainId: "hedera:testnet",
            service: getBytes("0x000000000000000000000000000000000000016e"),
            verifier: getBytes("0x0000000000000000000000000000000000001389"),
        };
        const evm = {
            chainId: "eip155:1",
            service: Uint8Array.of(1, 2, 3),
            verifier: getBytes("0x00112233445566778899aabbccddeeff00112233"),
        };
        const derive = (local, peer) =>
            ClprCreateChannelTransaction.computeChannelId({
                localChainId: local.chainId,
                localService: local.service,
                localVerifier: local.verifier,
                peerChainId: peer.chainId,
                peerService: peer.service,
                peerVerifier: peer.verifier,
                salt: new Uint8Array(32),
            });
        const expected = getBytes(
            "0xbb082a20892923291a09d2402beeedc74d1077bf44ba67d4b33cede9495688a2",
        );
        expect(derive(hiero, evm)).to.deep.equal(expected);
        expect(derive(evm, hiero)).to.deep.equal(expected);

        // Equal chain and service: the verifier hashes break the tie.
        const other = { ...hiero, verifier: Uint8Array.of(0xff) };
        const tie = getBytes(
            "0x63c19f9211fb8e9c2d094a1bde7992e39fa80892666b644451fab75be8077710",
        );
        expect(derive(hiero, other)).to.deep.equal(tie);
        expect(derive(other, hiero)).to.deep.equal(tie);

        expect(() => derive({ ...hiero, chainId: "" }, evm)).to.throw(
            /chain IDs/,
        );
    });

    it("rejects empty configuration proofs and a missing salt", function () {
        expect(() =>
            new ClprCreateChannelTransaction().setConfigProofBytes(
                new Uint8Array(),
            ),
        ).to.throw(/empty/);
        expect(() =>
            new ClprCreateChannelTransaction({
                channelId: expectedId,
            }).freeze(),
        ).to.throw(/salt/);
    });

    it.each(vectors.vectors)(
        "creates a Connector with a $signatureScheme identity and normal transaction signature",
        async function (vector) {
            const privateKey =
                vector.signatureScheme === "ED25519"
                    ? PrivateKey.fromStringED25519(vector.privateKeyOrSeed)
                    : PrivateKey.fromStringECDSA(vector.privateKeyOrSeed);
            const identityKey = privateKey.publicKey;
            const connectorId = getBytes(
                keccak256(`0x${vector.publicKey}${vectors.salt}`),
            );
            const connectorSalt = getBytes(`0x${vectors.salt}`);
            expect(
                ClprCreateConnectorTransaction.computeConnectorId(
                    identityKey,
                    connectorSalt,
                ),
            ).to.deep.equal(connectorId);
            const transaction = new ClprCreateConnectorTransaction({
                channelId: expectedId,
                connectorId,
                identityKey,
                salt: connectorSalt,
                connectorContract: "1.2.4",
                adminKey: identityKey,
                lockedStake: Hbar.fromTinybars("9007199254740993"),
            });
            connectorSalt.fill(0);
            transaction.connectorId.fill(0);
            await freeze(transaction).sign(privateKey);
            const encoded = transaction.toBytes();
            const decoded = Transaction.fromBytes(encoded);
            expect(decoded).toBeInstanceOf(ClprCreateConnectorTransaction);
            expect(decoded.identityKey.toStringDer()).to.equal(
                identityKey.toStringDer(),
            );
            expect(decoded.lockedStake.toTinybars().toString()).to.equal(
                "9007199254740993",
            );
            expect(decoded.getSignatures().size).to.equal(1);
            expect(decoded.toBytes()).to.deep.equal(encoded);

            const wrong = new ClprCreateConnectorTransaction({
                channelId: expectedId,
                connectorId: new Uint8Array(32),
                identityKey,
                salt,
                connectorContract: "1.2.4",
                adminKey: identityKey,
            });
            expect(() => freeze(wrong)).to.throw(/connectorId does not match/);
        },
    );

    it("decodes the wire-compatible legacy close and deregister tags as deletes", function () {
        const account = Array.from(
            proto.AccountID.encode({ accountNum: 3 }).finish(),
        );
        const channel = [10, 32, ...expectedId];
        const connector = [
            ...channel,
            18,
            32,
            ...salt,
            26,
            account.length,
            ...account,
        ];
        for (const [tag, body, expected] of [
            [170, channel, ClprDeleteChannelTransaction],
            [202, connector, ClprDeleteConnectorTransaction],
        ]) {
            const wire = rawTransactionWithData([tag, 5, body.length, ...body]);
            expect(Transaction.fromBytes(wire)).toBeInstanceOf(expected);
            expect(Transaction.fromBytes(wire).toBytes()).to.deep.equal(wire);
        }
    });

    it("refuses legacy two-step data instead of interpreting it as an RC3 request", function () {
        const legacyRegisterConnector = [
            10,
            32,
            ...salt,
            18,
            32,
            ...expectedId,
        ];
        for (const body of [
            [154, 5, 0],
            [162, 5, 0],
            [
                194,
                5,
                legacyRegisterConnector.length,
                ...legacyRegisterConnector,
            ],
            [210, 5, 0],
        ]) {
            expect(() =>
                Transaction.fromBytes(rawTransactionWithData(body)),
            ).to.throw(/two-step CLPR/);
        }
    });
});
