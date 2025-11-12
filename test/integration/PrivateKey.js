import {
    PrivateKey,
    Hbar,
    AccountId,
    KeyList,
    Status,
    FileAppendTransaction,
    FileCreateTransaction,
    TransactionId,
    Mnemonic,
    AccountUpdateTransaction,
    AccountCreateTransaction,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount } from "./utils/Fixtures.js";
import SignatureMap from "../../src/transaction/SignatureMap.js";

import { proto } from "@hiero-ledger/proto";

describe("PrivateKey signTransaction", function () {
    let env, user1Key, user2Key, keyList;

    // Setting up the environment and creating a new account with a key list
    beforeAll(async function () {
        env = await IntegrationTestEnv.new();

        user1Key = PrivateKey.generate();
        user2Key = PrivateKey.generate();
        keyList = new KeyList([user1Key.publicKey, user2Key.publicKey]);

        // Create account
        const { accountId } = await createAccount(env.client, (transaction) => {
            return transaction.setKeyWithoutAlias(keyList);
        });

        expect(accountId).to.exist;
    });

    it("should be able to sign tx with priv key that is <32 bytes from mnemonic", async function () {
        const MNEMONIC_SHORT_PRIVATE_KEY_STRING =
            "marriage bounce fiscal express wink wire trick allow faith mandate base bone";
        const mnemonic = await Mnemonic.fromString(
            MNEMONIC_SHORT_PRIVATE_KEY_STRING,
        );
        const privateKey = await mnemonic.toStandardECDSAsecp256k1PrivateKey();

        const { accountId } = await createAccount(env.client, (transaction) => {
            return transaction.setKeyWithoutAlias(privateKey);
        });

        const { status } = await (
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .setAccountMemo("test")
                    .freezeWith(env.client)
                    .sign(privateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        expect(status).to.be.equal(Status.Success);
    });

    // this skip is temporary before we add SOLO for the CI tests
    // as currently its unable to run the test with multiple nodes
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("File Append Transaction Execution with Multiple Nodes", async function () {
        // Create file
        let response = await new FileCreateTransaction()
            .setKeys([env.operatorKey])
            .setContents("[e2e::FileCreateTransaction]")
            .execute(env.client);

        let createTxReceipt = await response.getReceipt(env.client);
        const file = createTxReceipt.fileId;

        // Append content to the file
        const fileAppendTx = new FileAppendTransaction()
            .setFileId(file)
            .setContents("test")
            .setChunkSize(1)
            .setNodeAccountIds([
                new AccountId(3),
                new AccountId(4),
                new AccountId(5),
            ])
            .freezeWith(env.client);

        const sigMap = new SignatureMap();
        fileAppendTx._signedTransactions.list.forEach((signedTx) => {
            const sig = env.operatorKey.sign(signedTx.bodyBytes);
            const decodedTx = proto.TransactionBody.decode(signedTx.bodyBytes);
            const nodeId = AccountId._fromProtobuf(decodedTx.nodeAccountID);
            const transactionId = TransactionId._fromProtobuf(
                decodedTx.transactionID,
            );

            sigMap.addSignature(
                nodeId,
                transactionId,
                env.operatorKey.publicKey,
                sig,
            );
        });

        //console.log(sigMap);

        fileAppendTx.addSignature(env.operatorKey.publicKey, sigMap);

        // Execute the signed transaction
        const receipt = await (
            await fileAppendTx.execute(env.client)
        ).getReceipt(env.client);

        expect(receipt.status).to.be.equal(Status.Success);
    });

    it("should create, sign, and execute a transaction with multiple signatures", async function () {
        // Step 1: Generate private keys
        const THRESHOLD = 2;
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();
        const key4 = PrivateKey.generateED25519();
        const key5 = PrivateKey.generateED25519();
        const recipient = PrivateKey.generateED25519().publicKey;

        const keyList = new KeyList(
            [
                key1.publicKey,
                key2.publicKey,
                key3.publicKey,
                key4.publicKey,
                key5.publicKey,
            ],
            THRESHOLD,
        );

        // Step 2: Create account with key list
        const { accountId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(keyList)
                .setInitialBalance(new Hbar(1))
                .freezeWith(env.client)
                .execute(env.client)
        ).getReceipt(env.client);

        const { accountId: recipientId2 } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(recipient)
                .freezeWith(env.client)
                .execute(env.client)
        ).getReceipt(env.client);

        // Step 3: Create and freeze transfer transaction
        const transferTx = new TransferTransaction()
            .addHbarTransfer(accountId, new Hbar(-1))
            .addHbarTransfer(recipientId2, new Hbar(1))
            .freezeWith(env.client);

        // Step 4: Sign transaction
        const signatureBytes = key1.signTransaction(transferTx, true);
        const signatureSigMap = key2.signTransaction(transferTx);

        // Step 5: Add signatures and execute transaction
        const { status } = await (
            await transferTx
                .addSignature(key1.publicKey, signatureBytes)
                .addSignature(key2.publicKey, signatureSigMap)
                .execute(env.client)
        ).getReceipt(env.client);

        // Step 6: Verify transaction status
        expect(status.toString()).to.be.equal("SUCCESS");
    });

    afterAll(async function () {
        await env.close();
    });
});
