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
} from "../../src/exports.js";
import * as hex from "../../src/encoding/hex.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

import { Client } from "./client/NodeIntegrationTestEnv.js";
import {
    deleteAccount,
    createFungibleToken,
    createAccount,
} from "./utils/Fixtures.js";

describe("TransactionIntegration", function () {
    it("should be executable", async function () {
        const env = await IntegrationTestEnv.new();
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateECDSA();

        const accountCreateTx = new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1));

        await accountCreateTx
            .freezeWith(env.client)
            .signWithOperator(env.client);

        const expectedHash = await accountCreateTx.getTransactionHash();

        const response = await accountCreateTx.execute(env.client);

        const record = await response.getRecord(env.client);

        expect(hex.encode(expectedHash)).to.be.equal(
            hex.encode(record.transactionHash),
        );

        const receipt = await response.getReceipt(env.client);
        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        await deleteAccount(env.client, key, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId);
        });

        await env.close();
    });

    it("signs on demand", async function () {
        const env = await IntegrationTestEnv.new();
        env.client.setSignOnDemand(true);

        const fileId = (
            await (
                await new FileCreateTransaction()
                    .setContents("test")
                    .execute(env.client)
            ).getReceipt(env.client)
        ).fileId;

        expect(fileId.num).to.not.be.equal(0);

        await env.close();
    });

    it("signs correctly", async function () {
        const env = await IntegrationTestEnv.new();
        const key = PrivateKey.generateED25519();

        await createFungibleToken(env.client, async (transaction) => {
            await (
                await transaction
                    .setAdminKey(key.publicKey)
                    .freezeWith(env.client)
                    .sign(key)
            ).signWithOperator(env.client);
            expect(
                transaction._signedTransactions.list[0].sigMap.sigPair.length,
            ).to.eql(2);
        });

        await createFungibleToken(env.client, async (transaction) => {
            await (
                await transaction
                    .setAdminKey(key.publicKey)
                    .freezeWith(env.client)
                    .sign(key)
            ).signWithOperator(env.client);
            expect(
                transaction._signedTransactions.list[0].sigMap.sigPair.length,
            ).to.eql(2);
        });

        await env.close();
    });

    it("issue-327", async function () {
        const env = await IntegrationTestEnv.new();
        const privateKey1 = PrivateKey.generateED25519();
        const privateKey2 = PrivateKey.generateED25519();
        const privateKey3 = PrivateKey.generateED25519();
        const privateKey4 = PrivateKey.generateED25519();
        const publicKey1 = privateKey1.publicKey;
        const publicKey2 = privateKey2.publicKey;
        const publicKey3 = privateKey3.publicKey;
        const publicKey4 = privateKey4.publicKey;

        const nodeAccountId = Object.values(env.client.network)[0];

        const transaction = new TransferTransaction()
            .setNodeAccountIds([nodeAccountId])
            .addHbarTransfer(
                env.client.operatorAccountId,
                new Hbar(1).negated(),
            )
            .addHbarTransfer(new AccountId(3), new Hbar(1))
            .freezeWith(env.client);

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

        await env.close();
    });

    describe("HIP-745 - create incomplete transaction", function () {
        let env, operatorId, recipientKey, recipientId, client, wallet;

        beforeEach(async function () {
            env = await IntegrationTestEnv.new();
            operatorId = env.operatorId;
            recipientKey = PrivateKey.generateECDSA();
            recipientId = recipientKey.publicKey.toAccountId(0, 0);
            client = env.client;
            wallet = env.wallet;
        });

        afterEach(function () {
            client.close();
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

    describe("Transaction Signature Manipulation Flow", function () {
        let env, user1Key, user2Key, createdAccountId, keyList;

        // Setting up the environment and creating a new account with a key list
        beforeAll(async function () {
            env = await IntegrationTestEnv.new();

            user1Key = PrivateKey.generate();
            user2Key = PrivateKey.generate();
            keyList = new KeyList([user1Key.publicKey, user2Key.publicKey]);

            // Create account
            const { accountId } = await createAccount(
                env.client,
                (transaction) => {
                    transaction.setKeyWithoutAlias(keyList);
                },
            );

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
                .freezeWith(env.client);

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
            const result = await signedTransaction.execute(env.client);
            const receipt = await result.getReceipt(env.client);

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
                .freezeWith(env.client);

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
                const result = await signedTransaction.execute(env.client);
                await result.getReceipt(env.client);

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
        let env, operatorId, operatorKey, client;

        // Setting up the environment and creating a new account with a key list
        beforeAll(async function () {
            env = await IntegrationTestEnv.new();

            operatorId = env.operatorId;
            operatorKey = env.operatorKey;
            client = env.client;
        });

        it("Creating, Signing, and Submitting a Transaction Using the Client with a Known Address Book", async function () {
            // For simplicity, sending back to the operator
            const recipientAccountId = env.operatorId;

            // Create, sign, and execute the transfer transaction
            const transferTx = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) // Sender
                .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1)) // Recipient
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
            // For simplicity, sending back to the operator
            const recipientAccountId = env.operatorId;

            const transaction = new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) // Sender
                .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1)) // Recipient
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
            // For simplicity, sending back to the operator
            const recipientAccountId = env.operatorId;

            // Create a transfer transaction and point it to an unknown node account ID (10000)
            const signTransferTransaction = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
                .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1))
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
            // For simplicity, sending back to the operator
            const recipientAccountId = env.operatorId;

            const signTransferTransaction = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
                .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1))
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
});
