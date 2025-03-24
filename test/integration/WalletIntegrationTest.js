import { expect } from "chai";
import { Hbar, PrivateKey, TransferTransaction } from "../../src/exports.js";
import { Wallet, LocalProvider } from "../../src/index.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount } from "./utils/Fixtures.js";

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
        const { accountId: receiverId, newKey: receiverKey } =
            await createAccount(env.client, (transaction) => {
                transaction
                    .setKeyWithoutAlias(receiverKey)
                    .setInitialBalance(new Hbar(10));
            });

        // Set the client operator to the receiver account
        env.client.setOperator(receiverId, receiverKey);

        // Generate a key for the signer
        const signerKey = PrivateKey.generateED25519();

        // Create account for the signer
        const { accountId: signerId } = await createAccount(
            env.client,
            (transaction) => {
                transaction
                    .setKeyWithoutAlias(signerKey)
                    .setInitialBalance(new Hbar(5));
            },
        );

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
