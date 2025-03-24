import { expect } from "chai";
import {
    AccountCreateTransaction,
    Hbar,
    PrivateKey,
    TransferTransaction,
} from "../../src/exports.js";
import { Wallet, LocalProvider } from "../../src/index.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("WalletIntegration", function () {
    it("should create a wallet (ECDSA)", async function () {
        const wallet = await Wallet.createRandomECDSA();
        expect(wallet.getAccountKey()).to.not.equal(null);
        expect(wallet.getAccountId()).to.not.equal(null);
    });

    it("should create a wallet (ED25519)", async function () {
        const wallet = await Wallet.createRandomED25519();
        expect(wallet.getAccountKey()).to.not.equal(null);
        expect(wallet.getAccountId()).to.not.equal(null);
    });

    it("issue-1530", async function () {
        const env = await IntegrationTestEnv.new();

        // Create receiver account
        const receiverKey = PrivateKey.generateED25519();
        const receiverCreateTx = await new AccountCreateTransaction()
            .setKeyWithoutAlias(receiverKey)
            .setInitialBalance(new Hbar(10))
            .signWithOperator(env.client);

        const receiverResponse = await receiverCreateTx.execute(env.client);
        const receiverRecord = await receiverResponse.getRecord(env.client);
        const receiverId = receiverRecord.receipt.accountId;

        // Set the client operator to the receiver account
        env.client.setOperator(receiverId, receiverKey);

        // Generate a key for the signer
        const signerKey = PrivateKey.generateED25519();

        // Create account id for the signer
        let createTransaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(signerKey)
            .setInitialBalance(new Hbar(5))
            .signWithOperator(env.client);

        const response = await createTransaction.execute(env.client);
        const record = await response.getRecord(env.client);
        const signerId = record.receipt.accountId;

        const wallet = new Wallet(signerId, signerKey, new LocalProvider());

        // The operator and the signer are different
        expect(env.client.getOperator().accountId).not.to.eql(signerId);

        let transferTx = new TransferTransaction()
            .addHbarTransfer(signerId, new Hbar(-1))
            .addHbarTransfer(receiverId, new Hbar(1));

        wallet.populateTransaction(transferTx);

        const tx = await wallet.call(transferTx);
        const transferRecord = await tx.getRecord(env.client);
        expect(transferRecord.transactionId.accountId).to.eql(signerId);

        await env.close();
    });
});
