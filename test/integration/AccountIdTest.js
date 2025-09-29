import {
    AccountId,
    TokenId,
    PrivateKey,
    TransferTransaction,
    Hbar,
} from "../../src/exports.js";
import IntegrationTestEnv, { Client } from "./client/NodeIntegrationTestEnv.js";

describe("AccountId", function () {
    let client;

    beforeAll(async function () {
        client = Client.forMainnet();
    });

    it("should generate checksum for account ID", function () {
        const accountId = new AccountId(123);

        expect(accountId.num.toNumber()).to.eql(123);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);

        expect(accountId.toStringWithChecksum(client)).to.be.eql(
            "0.0.123-vfmkw",
        );
    });

    it("should generate checksum for token ID", function () {
        const tokenId = new TokenId(123);

        expect(tokenId.num.toNumber()).to.eql(123);
        expect(tokenId.realm.toNumber()).to.eql(0);
        expect(tokenId.shard.toNumber()).to.eql(0);

        expect(tokenId.toStringWithChecksum(client)).to.be.eql("0.0.123-vfmkw");
    });

    it("should parse previewnet ID with checksum {0.0.123-ghaha}", function () {
        let err = false;

        try {
            AccountId.fromString("0.0.123-ghaha").validateChecksum(
                IntegrationTestEnv.forMainnet(),
            );
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error("entity parsing did not err");
        }
    });

    it.only("should populate account number from EVM address", async function () {
        // Create a new integration test environment for this test
        const env = await IntegrationTestEnv.new();

        try {
            // Generate a new ECDSA private key
            const privateKey = PrivateKey.generateECDSA();
            const publicKey = privateKey.publicKey;
            const evmAddress = publicKey.toEvmAddress();

            // Create AccountId from EVM address
            const evmAddressAccount = AccountId.fromEvmAddress(
                0,
                0,
                evmAddress,
            );

            // Transfer 1 Hbar to the EVM address account to create it
            const transferTx = await new TransferTransaction()
                .addHbarTransfer(evmAddressAccount, new Hbar(1))
                .addHbarTransfer(env.operatorId, new Hbar(-1))
                .execute(env.client);

            // Get the receipt to find the new account ID (include children to get the account creation receipt)
            const receipt = await transferTx
                .getReceiptQuery()
                .setIncludeChildren(true)
                .setValidateStatus(true)
                .execute(env.client);

            // The new account ID should be in the first child receipt
            const newAccountId = receipt.children[0].accountId;

            // Create another AccountId from the same EVM address for testing populateAccountNum
            const idMirror = AccountId.fromEvmAddress(0, 0, evmAddress);

            // Wait a bit for the account to be available on mirror node
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Populate the account number using mirror node
            const populatedAccountId = await idMirror.populateAccountNum(
                env.client,
            );

            // Verify that the account number was populated correctly
            expect(populatedAccountId.num.toString()).to.equal(
                newAccountId.num.toString(),
            );
            expect(populatedAccountId.shard.toString()).to.equal(
                newAccountId.shard.toString(),
            );
            expect(populatedAccountId.realm.toString()).to.equal(
                newAccountId.realm.toString(),
            );
        } finally {
            // Clean up the test environment
            await env.close();
        }
    });

    afterAll(async function () {
        client.close();
    });
});
