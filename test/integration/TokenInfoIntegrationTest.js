import {
    Hbar,
    PrivateKey,
    Status,
    TokenInfoQuery,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, createFungibleToken } from "./utils/Fixtures.js";

describe("TokenInfo", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();
        const key4 = PrivateKey.generateED25519();
        const key5 = PrivateKey.generateED25519();

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setKycKey(key1)
                .setFreezeKey(key2)
                .setWipeKey(key3)
                .setSupplyKey(key4)
                .setMetadataKey(key5)
                .setDecimals(3);
        });

        const info = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(env.client);

        expect(info.tokenId.toString()).to.eql(tokenId.toString());
        expect(info.name).to.eql("ffff");
        expect(info.symbol).to.eql("F");
        expect(info.decimals).to.eql(3);
        expect(info.totalSupply.toInt()).to.eql(1000000);
        expect(info.treasuryAccountId.toString()).to.be.equal(
            operatorId.toString(),
        );
        expect(info.adminKey.toString()).to.eql(operatorKey.toString());
        expect(info.kycKey.toString()).to.eql(key1.publicKey.toString());
        expect(info.freezeKey.toString()).to.eql(key2.publicKey.toString());
        expect(info.wipeKey.toString()).to.eql(key3.publicKey.toString());
        expect(info.supplyKey.toString()).to.eql(key4.publicKey.toString());
        expect(info.metadataKey.toString()).to.eql(key5.publicKey.toString());
        expect(info.autoRenewAccountId.toString()).to.eql(
            operatorId.toString(),
        );
        expect(info.defaultFreezeStatus).to.be.false;
        expect(info.defaultKycStatus).to.be.false;
        expect(info.isDeleted).to.be.false;
        expect(info.autoRenewPeriod).to.be.not.null;
        expect(info.expirationTime).to.be.not.null;
    });

    it("should be executable with minimal properties set", async function () {
        const operatorId = env.operatorId;

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setAdminKey(null)
                .setKycKey(null)
                .setFreezeKey(null)
                .setWipeKey(null)
                .setSupplyKey(null)
                .setMetadataKey(null)
                .setAutoRenewAccountId(operatorId)
                .setInitialSupply(0)
                .setDecimals(0);
        });

        let info = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(env.client);

        expect(info.tokenId.toString()).to.eql(tokenId.toString());
        expect(info.name).to.eql("ffff");
        expect(info.symbol).to.eql("F");
        expect(info.decimals).to.eql(0);
        expect(info.totalSupply.toInt()).to.eql(0);
        expect(info.treasuryAccountId.toString()).to.be.equal(
            operatorId.toString(),
        );
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            operatorId.toString(),
        );
        expect(info.adminKey).to.be.null;
        expect(info.kycKey).to.be.null;
        expect(info.freezeKey).to.be.null;
        expect(info.wipeKey).to.be.null;
        expect(info.supplyKey).to.be.null;
        expect(info.metadataKey).to.be.null;
        expect(info.defaultFreezeStatus).to.be.null;
        expect(info.defaultKycStatus).to.be.null;
        expect(info.isDeleted).to.be.false;
        expect(info.autoRenewPeriod).to.be.not.null;
        expect(info.expirationTime).to.be.not.null;
    });

    it("should be able to query cost", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();
        const key4 = PrivateKey.generateED25519();

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setKycKey(key1)
                .setFreezeKey(key2)
                .setWipeKey(key3)
                .setSupplyKey(key4);
        });

        const cost = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .getCost(env.client);

        expect(cost.toTinybars().toInt()).to.be.at.least(1);
    });

    it("should error when token ID is not set", async function () {
        let err = false;

        try {
            await new TokenInfoQuery().execute(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token info query did not error");
        }
    });

    it("should set autorenew account from transaction ID", async function () {
        // Create a new account with 10 Hbar

        const { accountId, newKey: accountKey } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setInitialBalance(new Hbar(20));
            },
        );

        // Create transaction ID with the new account
        const txId = TransactionId.generate(accountId);

        const tokenId = await createFungibleToken(
            env.client,
            async (transaction) => {
                await transaction
                    .setTreasuryAccountId(accountId)
                    .setTransactionId(txId)
                    .freezeWith(env.client)
                    .sign(accountKey);
            },
        );

        // Query token info
        const info = await new TokenInfoQuery()

            .setTokenId(tokenId)
            .execute(env.client);

        // Verify autoRenewAccountId matches the account that created the token
        expect(info.autoRenewAccountId.toString()).to.equal(
            accountId.toString(),
        );
    });

    after(async function () {
        await env.close();
    });
});
