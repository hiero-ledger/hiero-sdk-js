// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    ClprCompleteConnectorTransaction,
    DelegateContractId,
    KeyList,
    PrivateKey,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

describe("ClprCompleteConnectorTransaction delegate admin keys", function () {
    it.each(["direct", "threshold"])(
        "keeps an EVM delegate key in a signed %s adminKey through bytes",
        async function (kind) {
            const address = "0011223344556677889900112233445577889900";
            const delegate = new DelegateContractId(
                1,
                2,
                0,
                new Uint8Array(hex.decode(address)),
            );
            const vector = vectors.vectors[1];
            const payer = PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
            const adminKey =
                kind === "direct"
                    ? delegate
                    : new KeyList([payer.publicKey, delegate], 1);
            const transaction = new ClprCompleteConnectorTransaction({
                channelId: hex.decode(vectors.channelId),
                connectorId: hex.decode(vector.connectorId),
                salt: hex.decode(vectors.salt),
                adminKey,
            })
                .setOwnershipProof(payer)
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(5006),
                        new Timestamp(1596210382, 0),
                    ),
                )
                .freeze();
            await transaction.sign(payer);
            const encoded = transaction.toBytes();
            const decoded = Transaction.fromBytes(encoded);

            for (const value of [transaction.adminKey, decoded.adminKey]) {
                if (kind === "threshold") {
                    expect(value).toBeInstanceOf(KeyList);
                    expect(value.threshold).toBe(1);
                    expect(value.toArray()[0].toString()).toBe(
                        payer.publicKey.toString(),
                    );
                }
                const key = kind === "direct" ? value : value.toArray()[1];
                expect(key).toBeInstanceOf(DelegateContractId);
                expect(key.toString()).toBe(`1.2.${address}`);
                expect(key.toEvmAddress()).toBe(address);
            }
            const list = proto.TransactionList.decode(encoded);
            const signed = proto.SignedTransaction.decode(
                list.transactionList[0].signedTransactionBytes,
            );
            const body = proto.TransactionBody.decode(
                signed.bodyBytes,
            ).clprCompleteConnector;
            const key =
                kind === "direct"
                    ? body.adminKey
                    : body.adminKey.thresholdKey.keys.keys[1];
            expect(hex.encode(key.delegatableContractId.evmAddress)).toBe(
                address,
            );
            expect(decoded.toBytes()).toEqual(encoded);
            expect(payer.publicKey.verifyTransaction(decoded)).toBe(true);
        },
    );
});
