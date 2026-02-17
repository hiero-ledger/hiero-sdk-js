import {
    AccountId,
    FileCreateTransaction,
    Hbar,
    PrivateKey,
    TransferTransaction,
    TransactionReceipt,
    TransactionResponse,
    Transaction,
    TransactionId,
    Timestamp,
    AccountUpdateTransaction,
    KeyList,
    Status,
    AccountCreateTransaction,
    FileAppendTransaction,
    FileContentsQuery,
    SignatureMap,
} from "../../src/exports.js";
import * as hex from "../../src/encoding/hex.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import SignableNodeTransactionBodyBytes from "../../src/transaction/SignableNodeTransactionBodyBytes.js";
import * as HieroProto from "@hiero-ledger/proto";

import { Client } from "./client/NodeIntegrationTestEnv.js";
import {
    deleteAccount,
    createFungibleToken,
    createAccount,
} from "./utils/Fixtures.js";
import NodeClient from "../../src/client/NodeClient.js";

describe("TransactionIntegration", function () {
    let env;
    let client;
    let operatorId;
    let operatorKey;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
        client = env.client;
        operatorId = env.operatorId;
        operatorKey = env.operatorKey;
    });

    it("should be executable", async function () {
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateECDSA();

        const accountCreateTx = new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1));

        await accountCreateTx.freezeWith(client).signWithOperator(client);

        const expectedHash = await accountCreateTx.getTransactionHash();

        const response = await accountCreateTx.execute(client);

        const record = await response.getRecord(client);

        expect(hex.encode(expectedHash)).to.be.equal(
            hex.encode(record.transactionHash),
        );

        const receipt = await response.getReceipt(client);
        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        await deleteAccount(client, key, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId);
        });
    });

    it("signs on demand", async function () {
        client.setSignOnDemand(true);

        const fileId = (
            await (
                await new FileCreateTransaction()
                    .setContents("test")
                    .execute(client)
            ).getReceipt(client)
        ).fileId;

        expect(fileId.num).to.not.be.equal(0);
    });

    it("signs correctly", async function () {
        const key = PrivateKey.generateED25519();

        await createFungibleToken(client, async (transaction) => {
            await (
                await transaction
                    .setAdminKey(key.publicKey)
                    .freezeWith(client)
                    .sign(key)
            ).signWithOperator(client);
            expect(
                transaction._signedTransactions.list[0].sigMap.sigPair.length,
            ).to.eql(2);
        });

        await createFungibleToken(client, async (transaction) => {
            await (
                await transaction
                    .setAdminKey(key.publicKey)
                    .freezeWith(client)
                    .sign(key)
            ).signWithOperator(client);
            expect(
                transaction._signedTransactions.list[0].sigMap.sigPair.length,
            ).to.eql(2);
        });
    });

    it("issue-327", async function () {
        const privateKey1 = PrivateKey.generateED25519();
        const privateKey2 = PrivateKey.generateED25519();
        const privateKey3 = PrivateKey.generateED25519();
        const privateKey4 = PrivateKey.generateED25519();
        const publicKey1 = privateKey1.publicKey;
        const publicKey2 = privateKey2.publicKey;
        const publicKey3 = privateKey3.publicKey;
        const publicKey4 = privateKey4.publicKey;

        const nodeAccountId = Object.values(client.network)[0];

        const transaction = new TransferTransaction()
            .setNodeAccountIds([nodeAccountId])
            .addHbarTransfer(client.operatorAccountId, new Hbar(1).negated())
            .addHbarTransfer(new AccountId(3), new Hbar(1))
            .freezeWith(client);

        const signature1 = privateKey1.signTransaction(transaction);
        const signature2 = privateKey2.signTransaction(transaction);
        const signature3 = privateKey3.signTransaction(transaction);

        transaction
            .addSignature(publicKey1, signature1)
            .addSignature(publicKey2, signature2)
            .addSignature(publicKey3, signature3);

        const signatures = transaction.getSignatures();

        const nodeSignatures = signatures.get(nodeAccountId);

        const publicKey1Signature = nodeSignatures
            .get(transaction.transactionId)
            .get(publicKey1);
        const publicKey2Signature = nodeSignatures
            .get(transaction.transactionId)
            .get(publicKey2);
        const publicKey3Signature = nodeSignatures
            .get(transaction.transactionId)
            .get(publicKey3);
        const publicKey4Signature = nodeSignatures
            .get(transaction.transactionId)
            .get(publicKey4);

        expect(publicKey1Signature).to.be.not.null;
        expect(publicKey2Signature).to.be.not.null;
        expect(publicKey3Signature).to.be.not.null;
        expect(publicKey4Signature).to.be.null;
    });

    describe("HIP-745 - create incomplete transaction", function () {
        let recipientKey, recipientId, wallet;

        beforeEach(async function () {
            recipientKey = PrivateKey.generateECDSA();
            recipientId = recipientKey.publicKey.toAccountId(0, 0);
            wallet = env.wallet;
        });

        /** @description: example serialize-deserialize-1.js */
        it("should serialize and deserialize the so-called signed transaction, and execute it", async function () {
            try {
                // 1. Create transaction and freeze it
                const transaction = new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(-1))
                    .addHbarTransfer(recipientId, new Hbar(1))
                    .freezeWith(client);

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);

                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );

                // 4. Sign and execute transaction
                const response = await (
                    await transactionFromBytes.sign(recipientKey)
                ).execute(client);
                expect(response).to.be.instanceof(TransactionResponse);
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(false);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(false);

                // 5. Get a receipt
                const receipt = await response.getReceipt(client);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-2.js */
        it("should serialize and deserialize the so-called signed transaction after being signed, and execute it", async function () {
            try {
                // 1. Create transaction and freeze it
                let transaction = new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(-1))
                    .addHbarTransfer(recipientId, new Hbar(1))
                    .freezeWith(client);

                // 2. Sign transaction
                await transaction.sign(recipientKey);

                // 3. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 4. Deserialize transaction from bytes
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);

                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(false);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(false);

                // 5. Execute transaction
                const response = await transactionFromBytes.execute(client);
                expect(response).to.be.instanceof(TransactionResponse);

                // 6. Get a receipt
                const receipt = await response.getReceipt(client);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-3.js */
        it("should serialize and deserialize so-called incomplete transaction, and execute it", async function () {
            try {
                // 1. Create transaction
                const transaction = new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(-1))
                    .addHbarTransfer(recipientId, new Hbar(1));

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);

                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);

                // 4. Freeze, sign and execute transaction
                const response = await (
                    await transactionFromBytes
                        .freezeWith(client)
                        .sign(recipientKey)
                ).execute(client);
                expect(response).to.be.instanceof(TransactionResponse);

                // 5. Get a receipt
                const receipt = await response.getReceipt(client);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-4.js */
        it("should serialize and deserialize so-called incomplete transaction, set node account ids and execute it", async function () {
            try {
                // 1. Create transaction
                const transaction = new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(-1))
                    .addHbarTransfer(recipientId, new Hbar(1));

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                let transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);

                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);

                // 4. Set node account ids
                const nodeAccountId = new AccountId(3);
                transactionFromBytes.setNodeAccountIds([nodeAccountId]);

                expect(
                    transactionFromBytes._nodeAccountIds.get(0).toString(),
                ).to.be.equal(nodeAccountId.toString());

                // 5. Freeze, sign and execute transaction
                const response = await (
                    await transactionFromBytes
                        .freezeWith(client)
                        .sign(recipientKey)
                ).execute(client);
                expect(response).to.be.instanceof(TransactionResponse);

                // 6. Get a receipt
                const receipt = await response.getReceipt(client);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-5.js */
        it("should serialize and deserialize so-called incomplete transaction, set transaction id and execute it", async function () {
            try {
                // 1. Create transaction
                const transaction = new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(-1))
                    .addHbarTransfer(recipientId, new Hbar(1));

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                let transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);

                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);

                // 4. Set transaction id
                const validStart = new Timestamp(
                    Math.floor(Date.now() / 1000),
                    0,
                );
                const transactionId = new TransactionId(operatorId, validStart);
                transactionFromBytes.setTransactionId(transactionId);

                expect(
                    transactionFromBytes._transactionIds.get(0).toString(),
                ).to.be.equal(transactionId.toString());

                // 5. Freeze, sign and execute transaction
                const response = await (
                    await transactionFromBytes
                        .freezeWith(client)
                        .sign(recipientKey)
                ).execute(client);
                expect(response).to.be.instanceof(TransactionResponse);

                // 6. Get a receipt
                const receipt = await response.getReceipt(client);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-6.js */
        it("should serialize and deserialize so-called incomplete transaction, update and execute it", async function () {
            const amount = new Hbar(1);
            try {
                // 1. Create transaction
                const transaction = new TransferTransaction().addHbarTransfer(
                    operatorId,
                    amount.negated(),
                );

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);

                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);
                expect(transactionFromBytes._hbarTransfers.length).to.be.equal(
                    1,
                );

                // 4. Check the transaction type and use particular method of
                // the corresponding class in order to update the transaction
                if (transactionFromBytes instanceof TransferTransaction) {
                    transactionFromBytes.addHbarTransfer(recipientId, amount);
                }

                expect(transactionFromBytes._hbarTransfers.length).to.be.equal(
                    2,
                );
                expect(
                    transactionFromBytes._hbarTransfers[1].accountId.toString(),
                ).to.be.equal(recipientId.toString());
                expect(
                    transactionFromBytes._hbarTransfers[1].amount.toString(),
                ).to.be.equal(amount.toString());

                // 4. Freeze, sign and execute transaction
                const response = await (
                    await transactionFromBytes
                        .freezeWith(client)
                        .sign(recipientKey)
                ).execute(client);
                expect(response).to.be.instanceof(TransactionResponse);

                // 5. Get a receipt
                const receipt = await response.getReceipt(client);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-7.js */
        it("should serialize and deserialize so-called signed transaction (chunked), and execute it", async function () {
            try {
                // 1. Create transaction and freeze it
                const transaction = await new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents("[e2e::FileCreateTransaction]")
                    .freezeWithSigner(wallet);

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);

                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );

                // 4. Sign and execute transaction
                const response = await (
                    await transactionFromBytes.signWithSigner(wallet)
                ).executeWithSigner(wallet);
                expect(response).to.be.instanceof(TransactionResponse);

                // 5. Get a receipt
                const receipt = await response.getReceiptWithSigner(wallet);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-8.js */
        it("should serialize and deserialize so-called incomplete transaction (chunked), and execute it", async function () {
            try {
                // 1. Create transaction
                const transaction = new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents("[e2e::FileCreateTransaction]");

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);
                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);

                // 4. Freeze, sign and execute transaction
                const response = await (
                    await (
                        await transactionFromBytes.freezeWithSigner(wallet)
                    ).signWithSigner(wallet)
                ).executeWithSigner(wallet);
                expect(response).to.be.instanceof(TransactionResponse);

                // 5. Get a receipt
                const receipt = await response.getReceiptWithSigner(wallet);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-9.js */
        it("should serialize and deserialize so-called incomplete transaction (chunked), update and execute it", async function () {
            try {
                // 1. Create transaction
                const transaction = new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents("[e2e::FileCreateTransaction]");

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);
                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);

                // 4. Check the transaction type and use particular method of
                // the corresponding class in order to update the transaction
                if (transactionFromBytes instanceof FileCreateTransaction) {
                    transactionFromBytes.setFileMemo("Test");
                }
                expect(transactionFromBytes.fileMemo).to.be.equal("Test");

                // 5. Freeze, sign and execute transaction
                const response = await (
                    await (
                        await transactionFromBytes.freezeWithSigner(wallet)
                    ).signWithSigner(wallet)
                ).executeWithSigner(wallet);
                expect(response).to.be.instanceof(TransactionResponse);

                // 6. Get a receipt
                const receipt = await response.getReceiptWithSigner(wallet);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-10.js */
        it("should serialize and deserialize so-called incomplete transaction (chunked), set transaction id and execute it", async function () {
            try {
                // 1. Create transaction
                const transaction = new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents("[e2e::FileCreateTransaction]");

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                let transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);
                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);

                // 4. Set transaction id
                const validStart = new Timestamp(
                    Math.floor(Date.now() / 1000),
                    0,
                );
                const transactionId = new TransactionId(operatorId, validStart);
                transactionFromBytes.setTransactionId(transactionId);
                expect(
                    transactionFromBytes._transactionIds.get(0).toString(),
                ).to.be.equal(transactionId.toString());

                // 5. Freeze, sign and execute transaction
                const response = await (
                    await (
                        await transactionFromBytes.freezeWithSigner(wallet)
                    ).signWithSigner(wallet)
                ).executeWithSigner(wallet);
                expect(response).to.be.instanceof(TransactionResponse);

                // 6. Get a receipt
                const receipt = await response.getReceiptWithSigner(wallet);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-11.js */
        it("should serialize and deserialize so-called incomplete transaction (chunked), set node account ids and execute it", async function () {
            try {
                // 1. Create transaction
                const transaction = new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents("[e2e::FileCreateTransaction]");

                // 2. Serialize transaction into bytes
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction from bytes
                let transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);
                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(true);

                // 4. Set node accoutn ids
                const nodeAccountId = new AccountId(3);
                transactionFromBytes.setNodeAccountIds([nodeAccountId]);
                expect(
                    transactionFromBytes._nodeAccountIds.get(0).toString(),
                ).to.be.equal(nodeAccountId.toString());

                // 5. Freeze, sign and execute transaction
                const response = await (
                    await (
                        await transactionFromBytes.freezeWithSigner(wallet)
                    ).signWithSigner(wallet)
                ).executeWithSigner(wallet);
                expect(response).to.be.instanceof(TransactionResponse);

                // 6. Get a receipt
                const receipt = await response.getReceiptWithSigner(wallet);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });

        /** @description: example serialize-deserialize-12.js */
        it("should create, serialize and deserialize so-called incomplete transaction, then freeze it, serialize and deserialize it again, and execute it", async function () {
            try {
                // Create transaction id
                const transactionId = new TransactionId(
                    operatorId,
                    Timestamp.fromDate(new Date()),
                );
                expect(transactionId).to.be.instanceof(TransactionId);

                // 1. Create a transaction
                const transaction = new AccountUpdateTransaction()
                    .setTransactionId(transactionId)
                    .setAccountId(operatorId)
                    .setAccountMemo("Hello");

                // 2. Serialize transaction
                const transactionBytes = transaction.toBytes();

                // 3. Deserialize transaction
                const transactionFromBytes =
                    Transaction.fromBytes(transactionBytes);
                expect(hex.encode(transactionBytes)).to.be.equal(
                    hex.encode(transactionFromBytes.toBytes()),
                );
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(true);
                expect(transactionFromBytes._transactionIds.length).to.be.equal(
                    1,
                );

                // 4. Freeze transaction
                transactionFromBytes.freezeWith(client);

                // 5. Serialize transaction after being frozen
                const transactionBytesAfterBeingFrozen =
                    transactionFromBytes.toBytes();

                // 6. Deserialize transaction again
                const transactionFromBytesAfterBeingFrozen =
                    Transaction.fromBytes(transactionBytesAfterBeingFrozen);
                expect(
                    transactionFromBytes._nodeAccountIds.isEmpty,
                ).to.be.equal(false);
                expect(
                    transactionFromBytes._transactionIds.isEmpty,
                ).to.be.equal(false);

                // 7. Execute transaction
                const response =
                    await transactionFromBytesAfterBeingFrozen.execute(client);
                expect(response).to.be.instanceof(TransactionResponse);

                // 8. Get a receipt
                const receipt = await response.getReceipt(client);
                expect(receipt).to.be.an.instanceof(TransactionReceipt);
                expect(receipt.status.toString()).to.be.equal("SUCCESS");
            } catch (error) {
                console.log(error);
            }
        });
    });

    describe("HIP-1300", function () {
        const MAXIMUM_TRANSACTION_SIZE = 130000;

        it("should create a transaction with more than 6kbs of data with signatures", async function () {
            const client = NodeClient.forLocalNode();
            client.setOperator(env.genesisOperatorId, env.genesisOperatorKey);

            let transaction = new AccountCreateTransaction()
                .setKeyWithoutAlias(PrivateKey.generate())
                .freezeWith(client);

            while ((await transaction.size) < MAXIMUM_TRANSACTION_SIZE) {
                transaction = await transaction.sign(PrivateKey.generate());
            }

            await (await transaction.execute(client)).getReceipt(client);
        });

        it("should create a transaction with more than 6kbs of data in a file", async function () {
            const client = NodeClient.forLocalNode();
            client.setOperator(env.genesisOperatorId, env.genesisOperatorKey);
            const file = await new FileCreateTransaction()
                .setContents(new Uint8Array(1024 * 10).fill(1))
                .freezeWith(client);
            await (await file.execute(client)).getReceipt(client);
        });

        it("should not create a transaction with more than 6kbs of data in a file if normal account is used", async function () {
            let transaction = new FileCreateTransaction()
                .setContents(new Uint8Array(1024 * 10).fill(1))
                .freezeWith(client);

            let err;
            try {
                await (await transaction.execute(client)).getReceipt(client);
            } catch (error) {
                err = error.status.toString().includes("TRANSACTION_OVERSIZE");
            }

            expect(err).to.be.true;
        });

        it("should not create a transaction with more than 6kbs of data with signatures without system account", async function () {
            const regularUserKey = PrivateKey.generate();

            let transaction = new AccountCreateTransaction()
                .setKeyWithoutAlias(regularUserKey)
                .freezeWith(client);

            while ((await transaction.size) < MAXIMUM_TRANSACTION_SIZE) {
                transaction = await transaction.sign(PrivateKey.generate());
            }

            let err;
            try {
                await (await transaction.execute(client)).getReceipt(client);
            } catch (error) {
                err = error.status.toString().includes("TRANSACTION_OVERSIZE");
            }

            expect(err).to.be.true;
        });
    });

    describe("Transaction Signature Manipulation Flow", function () {
        let user1Key, user2Key, createdAccountId, keyList;

        // Setting up the environment and creating a new account with a key list
        beforeAll(async function () {
            user1Key = PrivateKey.generate();
            user2Key = PrivateKey.generate();
            keyList = new KeyList([user1Key.publicKey, user2Key.publicKey]);

            // Create account
            const { accountId } = await createAccount(client, (transaction) => {
                transaction.setKeyWithoutAlias(keyList);
            });

            createdAccountId = accountId;
            expect(createdAccountId).to.exist;
        });

        /** @description: example multi-node-multi-signature-remove.js */
        it("Transaction with Signature Removal and Re-addition", async function () {
            // Step 1: Create and sign transfer transaction
            const transferTransaction = new TransferTransaction()
                .addHbarTransfer(createdAccountId, new Hbar(-1))
                .addHbarTransfer("0.0.3", new Hbar(1))
                .setNodeAccountIds([
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                ])
                .freezeWith(client);

            // Step 2: Serialize and sign the transaction
            const transferTransactionBytes = transferTransaction.toBytes();
            const user1Signatures =
                user1Key.signTransaction(transferTransaction);
            const user2Signatures =
                user2Key.signTransaction(transferTransaction);

            // Step 3: Deserialize the transaction and add signatures
            const signedTransaction = Transaction.fromBytes(
                transferTransactionBytes,
            );
            signedTransaction.addSignature(user1Key.publicKey, user1Signatures);
            signedTransaction.addSignature(user2Key.publicKey, user2Signatures);

            const getSignaturesNumberPerNode = () =>
                signedTransaction._signedTransactions.list[0].sigMap.sigPair
                    .length;

            // Test if the transaction for a node has 2 signatures
            expect(getSignaturesNumberPerNode()).to.be.equal(2);

            // Step 4: Remove the signature for user1 from the transaction
            signedTransaction.removeSignature(user1Key.publicKey);

            // Test if the transaction for a node has 1 signature after removal
            expect(getSignaturesNumberPerNode()).to.be.equal(1);

            // Step 5: Re-add the removed signature
            signedTransaction.addSignature(user1Key.publicKey, user1Signatures);

            // Test if the transaction for a node has 2 signatures after adding back the signature
            expect(getSignaturesNumberPerNode()).to.be.equal(2);

            // Step 6: Execute the signed transaction
            const result = await signedTransaction.execute(client);
            const receipt = await result.getReceipt(client);

            // Step 7: Verify the transaction status
            expect(receipt.status).to.be.equal(Status.Success);
        });

        /** @description: example multi-node-multi-signature-removeAll.js */
        it("Transaction with All Signature Removal", async function () {
            // Step 1: Create and sign transfer transaction
            const transferTransaction = new TransferTransaction()
                .addHbarTransfer(createdAccountId, new Hbar(-1))
                .addHbarTransfer("0.0.3", new Hbar(1))
                .setNodeAccountIds([
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                ])
                .freezeWith(client);

            // Step 2: Serialize and sign the transaction
            const transferTransactionBytes = transferTransaction.toBytes();
            const user1Signatures =
                user1Key.signTransaction(transferTransaction);
            const user2Signatures =
                user2Key.signTransaction(transferTransaction);

            // Step 3: Deserialize the transaction and add signatures
            const signedTransaction = Transaction.fromBytes(
                transferTransactionBytes,
            );
            signedTransaction.addSignature(user1Key.publicKey, user1Signatures);
            signedTransaction.addSignature(user2Key.publicKey, user2Signatures);

            const getSignaturesNumberPerNode = () =>
                signedTransaction._signedTransactions.list[0].sigMap.sigPair
                    .length;

            // Test if the transaction for a node has 2 signatures
            expect(getSignaturesNumberPerNode()).to.be.equal(2);

            // Step 4: Remove the signature for user1 from the transaction
            signedTransaction.removeAllSignatures();

            // Test if the transaction for a node has 0 signatures after removal
            expect(getSignaturesNumberPerNode()).to.be.equal(0);

            // Step 5: Try to execute the transaction without any signatures and expect it to fail
            try {
                const result = await signedTransaction.execute(client);
                await result.getReceipt(client);

                // If we get here, the transaction did not fail as expected
                throw new Error(
                    "Transaction should have failed due to missing signatures",
                );
            } catch (error) {
                // Expect the error to be due to an invalid signature
                expect(error.message).to.include("INVALID_SIGNATURE");
            }
        });
    });

    describe("Transaction flows", function () {
        it("Creating, Signing, and Submitting a Transaction Using the Client with a Known Address Book", async function () {
            // Create, sign, and execute the transfer transaction
            const transferTx = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) // Sender
                .addHbarTransfer(operatorId, Hbar.fromTinybars(1)) // Recipient
                .freezeWith(client)
                .sign(operatorKey);

            const response = await transferTx.execute(client);

            // Get and validate receipt
            const receipt = await response.getReceipt(client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");

            // Get and validate record
            const record = await response.getRecord(client);
            expect(record.transactionId.accountId.toString()).to.be.equal(
                operatorId.toString(),
            );
        });

        it(`Creating, Signing, and Submitting a Transaction Using the Client with a Known Address Book.
          In Addition, Serialize and Deserialize the Signed Transaction`, async function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) // Sender
                .addHbarTransfer(operatorId, Hbar.fromTinybars(1)) // Recipient
                .freezeWith(client);

            // Sign the transaction
            await transaction.sign(operatorKey);

            // Serialize the transaction to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize the transaction from bytes
            const transactionFromBytes =
                Transaction.fromBytes(transactionBytes);

            // Execute the transaction
            const executedTransaction =
                await transactionFromBytes.execute(client);

            const record = await executedTransaction.getRecord(client);
            expect(record.transactionId.accountId.toString()).to.equal(
                operatorId.toString(),
            );
        });

        it("Creating, Signing, and Executing a Transaction with a Non-Existent Node Account ID", async function () {
            // Create a transfer transaction and point it to an unknown node account ID (10000)
            const signTransferTransaction = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
                .addHbarTransfer(operatorId, Hbar.fromTinybars(1))
                .setNodeAccountIds([
                    new AccountId(10000),
                    new AccountId(10001),
                    new AccountId(10002),
                ]) // Non-existent node account IDs
                .freezeWith(client)
                .sign(operatorKey);

            try {
                await signTransferTransaction.execute(client);
            } catch (error) {
                expect(error.message).to.be.equal(
                    // Attempting to execute the transaction with a node that is not in the client's node list
                    "Attempting to execute a transaction against nodes 0.0.10000, 0.0.10001 ..., which are not included in the Client's node list. Please review your Client configuration.",
                );
            }
        });

        it("Creating, Signing, and Executing a Transaction with a Non-Existent Node Account ID and an Existent one", async function () {
            const signTransferTransaction = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
                .addHbarTransfer(operatorId, Hbar.fromTinybars(1))
                .setNodeAccountIds([new AccountId(10000), new AccountId(3)])
                .freezeWith(client)
                .sign(operatorKey);

            const transferTransactionReceipt = await (
                await signTransferTransaction.execute(client)
            ).getReceipt(client);

            expect(transferTransactionReceipt.status.toString()).to.be.equal(
                "SUCCESS",
            );
        });

        it("Creating transaction with clientTwo and executing it with clientOne which nodes aren't the same", async function () {
            // For simplicity, sending back to the operator
            const recipientAccountId = operatorId;
            const clientOne = client;

            const clientTwoNodes = {
                "54.176.199.109:50211": new AccountId(7),
                "35.155.49.147:50211": new AccountId(8),
                "127.0.0.1:50211": new AccountId(3),
                "34.106.102.218:50211": new AccountId(8),
            };

            // Create clientTwo with different nodes, most of them incorrect
            const clientTwo = Client.forNetwork(clientTwoNodes).setOperator(
                operatorId,
                operatorKey,
            );

            // Construct the transaction with clientTwo
            const signTransferTransaction = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) //Sending account
                .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1)) //Receiving account
                .freezeWith(clientTwo)
                .sign(operatorKey);

            // Execute the transaction with clientOne
            const signTransferTxExecution =
                await signTransferTransaction.execute(clientOne);

            // Get the receipt
            const signTransferTxReceipt =
                await signTransferTxExecution.getReceipt(clientOne);

            expect(signTransferTxReceipt.status.toString()).to.be.equal(
                "SUCCESS",
            );
        });
    });

    describe("HSM signing of signable transaction body bytes integration tests", function () {
        let senderId, senderKey, receiverId;

        const bigContents = Array(1000)
            .fill("Lorem ipsum dolor sit amet. ")
            .join("");

        /**
         * Signs the provided data using a Hardware Security Module (HSM).
         * This is a placeholder function that should be replaced with actual HSM SDK logic.
         * @param {PrivateKey} key - Private key for signing
         * @param {Uint8Array} bodyBytes - The data to be signed
         * @returns {Promise<Uint8Array>} - The generated signature
         */
        function hsmSign(key, bodyBytes) {
            // This is a placeholder function that resembles the HSM signing process.
            const signature = key.sign(bodyBytes);
            return Promise.resolve(signature);
        }

        beforeAll(async function () {
            // Create test accounts
            senderKey = PrivateKey.generateECDSA();
            const receiverKey = PrivateKey.generateECDSA();

            senderId = (
                await (
                    await new AccountCreateTransaction()
                        .setECDSAKeyWithAlias(senderKey)
                        .setInitialBalance(new Hbar(10))
                        .freezeWith(client)
                        .execute(client)
                ).getReceipt(client)
            ).accountId;

            receiverId = (
                await (
                    await new AccountCreateTransaction()
                        .setECDSAKeyWithAlias(receiverKey)
                        .setInitialBalance(new Hbar(1))
                        .freezeWith(client)
                        .execute(client)
                ).getReceipt(client)
            ).accountId;
        });

        it("should accept external HSM signature for the transaction body bytes for a single-node transfer transaction", async function () {
            // Get a single node account ID from the network
            const nodeAccountId = Object.values(client.network)[0];

            // Create and freeze a transfer transaction
            const transferTx = new TransferTransaction()
                .addHbarTransfer(senderId, new Hbar(-1))
                .addHbarTransfer(receiverId, new Hbar(1))
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(TransactionId.generate(senderId))
                .freezeWith(client);

            // Get the signable node body bytes
            const signableBytesList = transferTx.signableNodeBodyBytesList;

            // Verify we have exactly one signable bytes object
            expect(signableBytesList).to.be.an("array");
            expect(signableBytesList.length).to.equal(1);

            // Verify the signable bytes object
            const signableBytes = signableBytesList[0];
            expect(signableBytes).to.be.instanceOf(
                SignableNodeTransactionBodyBytes,
            );
            expect(signableBytes.nodeAccountId.toString()).to.equal(
                nodeAccountId.toString(),
            );
            expect(signableBytes.transactionId.accountId.toString()).to.equal(
                senderId.toString(),
            );
            expect(signableBytes.signableTransactionBodyBytes).to.be.instanceOf(
                Uint8Array,
            );

            // Verify the transaction body can be decoded and contains transfer data
            const body = HieroProto.proto.TransactionBody.decode(
                signableBytes.signableTransactionBodyBytes,
            );

            expect(body).to.have.property("cryptoTransfer");

            // Sign the transaction body bytes using HSM
            const signature = await hsmSign(
                senderKey,
                signableBytes.signableTransactionBodyBytes,
            );

            // Verify the signature was generated
            expect(signature).to.be.instanceOf(Uint8Array);
            expect(signature.length).to.be.greaterThan(0);

            // Add the signature to signature map
            const signatureMap = new SignatureMap();

            signatureMap.addSignature(
                nodeAccountId,
                transferTx.transactionId,
                senderKey.publicKey,
                signature,
            );

            // Add the signature map to the transaction
            transferTx.addSignature(senderKey.publicKey, signatureMap);

            // Execute the transaction
            const response = await transferTx.execute(client);
            const receipt = await response.getReceipt(client);

            // Verify the transaction was successful
            expect(receipt.status.toString()).to.equal("SUCCESS");
        });

        it("should accept external HSM signature for the transaction body bytes for a single-node file append chunked transaction", async function () {
            // Get a single node account ID from the network
            const nodeAccountId = Object.values(client.network)[0];

            // Create a file first
            const fileId = (
                await (
                    await (
                        await new FileCreateTransaction()
                            .setKeys([senderKey.publicKey])
                            .setContents("[e2e::FileCreateTransaction]")
                            .setMaxTransactionFee(new Hbar(5))
                            .freezeWith(client)
                            .sign(senderKey)
                    ).execute(client)
                ).getReceipt(client)
            ).fileId;

            // Create and freeze a file append transaction
            const fileAppendTx = new FileAppendTransaction()
                .setFileId(fileId)
                .setContents(bigContents)
                .setNodeAccountIds([nodeAccountId])
                .setMaxTransactionFee(new Hbar(5))
                .setTransactionId(TransactionId.generate(senderId))
                .freezeWith(client);

            // Get the transaction body bytes for signing
            const multiNodeSignableBodyBytesList =
                fileAppendTx.signableNodeBodyBytesList;

            // Verify the signable bytes object
            multiNodeSignableBodyBytesList.forEach((signableBytes) => {
                expect(signableBytes).to.be.instanceOf(
                    SignableNodeTransactionBodyBytes,
                );
                expect(signableBytes.nodeAccountId.toString()).to.equal(
                    nodeAccountId.toString(),
                );
                expect(
                    signableBytes.transactionId.accountId.toString(),
                ).to.equal(senderId.toString());

                // Verify the transaction body can be decoded and contains file append data
                const body = HieroProto.proto.TransactionBody.decode(
                    signableBytes.signableTransactionBodyBytes,
                );

                expect(body).to.have.property("fileAppend");
            });

            const signatureMap = new SignatureMap();

            // Sign the transaction body bytes for each node using HSM and add the signatures to the signature map
            for (const {
                nodeAccountId,
                transactionId,
                signableTransactionBodyBytes,
            } of multiNodeSignableBodyBytesList) {
                const hsmSignature = await hsmSign(
                    senderKey,
                    signableTransactionBodyBytes,
                );

                signatureMap.addSignature(
                    nodeAccountId,
                    transactionId,
                    senderKey.publicKey,
                    hsmSignature,
                );
            }

            // Add the signatures to the transaction
            fileAppendTx.addSignature(senderKey.publicKey, signatureMap);

            // Execute the transaction
            const response = await fileAppendTx.execute(client);
            const receipt = await response.getReceipt(client);

            // Verify the transaction was successful
            expect(receipt.status.toString()).to.equal("SUCCESS");

            // Verify the contents were appended
            const contents = await new FileContentsQuery()
                .setFileId(fileId)
                .execute(client);

            expect(contents.length).to.be.greaterThan(0);
        });
    });

    afterAll(async function () {
        await env.close();
    });
});
