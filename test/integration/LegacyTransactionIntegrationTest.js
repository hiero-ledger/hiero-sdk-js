import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    AccountId,
    FileCreateTransaction,
    Hbar,
    TokenCreateTransaction,
    TransferTransaction,
} from "../../src/exports.js";
import PrivateKey from "../../src/PrivateKey.js";
import * as hex from "../../src/encoding/hex.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TransactionIntegration Legacy", function () {
    it("should be executable", async function () {
        const env = await IntegrationTestEnv.new();
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const transaction = await new AccountCreateTransaction()
            .setKey(key.publicKey)
            .freezeWith(env.client)
            .signWithOperator(env.client);

        const expectedHash = await transaction.getTransactionHash();

        const response = await transaction.execute(env.client);

        const record = await response.getRecord(env.client);

        expect(hex.encode(expectedHash)).to.be.equal(
            hex.encode(record.transactionHash),
        );

        const account = record.receipt.accountId;
        expect(account).to.not.be.null;

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

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

        let transaction = await (
            await new TokenCreateTransaction()
                .setAdminKey(key.publicKey)
                .freezeWith(env.client)
                .sign(key)
        ).signWithOperator(env.client);

        expect(
            transaction._signedTransactions.list[0].sigMap.sigPair.length,
        ).to.eql(2);

        transaction = await (
            await new TokenCreateTransaction()
                .setAdminKey(key.publicKey)
                .freezeWith(env.client)
                .signWithOperator(env.client)
        ).sign(key);

        expect(
            transaction._signedTransactions.list[0].sigMap.sigPair.length,
        ).to.eql(2);

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

        const signature1 = privateKey1.signTransaction(transaction, true);
        const signature2 = privateKey2.signTransaction(transaction, true);
        const signature3 = privateKey3.signTransaction(transaction, true);

        transaction
            .addSignature(publicKey1, signature1)
            .addSignature(publicKey2, signature2)
            .addSignature(publicKey3, signature3);

        const signatures = transaction.getSignatures(true);

        const nodeSignatures = signatures.get(nodeAccountId);

        const publicKey1Signature = nodeSignatures.get(publicKey1);
        const publicKey2Signature = nodeSignatures.get(publicKey2);
        const publicKey3Signature = nodeSignatures.get(publicKey3);
        const publicKey4Signature = nodeSignatures.get(publicKey4);

        expect(publicKey1Signature).to.be.not.null;
        expect(publicKey2Signature).to.be.not.null;
        expect(publicKey3Signature).to.be.not.null;
        expect(publicKey4Signature).to.be.null;

        await env.close();
    });
});
