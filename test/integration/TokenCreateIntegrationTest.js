import {
    Hbar,
    PrivateKey,
    Status,
    Timestamp,
    TokenCreateTransaction,
    TokenDeleteTransaction,
    TokenInfoQuery,
    TokenSupplyType,
    TokenType,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { DEFAULT_AUTO_RENEW_PERIOD } from "../../src/transaction/Transaction.js";

describe("TokenCreate", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();
        const key4 = PrivateKey.generateED25519();

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setDecimals(3)
            .setInitialSupply(1000000)
            .setTreasuryAccountId(operatorId)
            .setAdminKey(operatorKey)
            .setKycKey(key1)
            .setFreezeKey(key2)
            .setWipeKey(key3)
            .setSupplyKey(key4)
            .setFreezeDefault(false)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const tokenId = (await response.getReceipt(env.client)).tokenId;

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
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            operatorId.toString(),
        );
        expect(info.autoRenewPeriod.seconds.toInt()).to.eql(
            DEFAULT_AUTO_RENEW_PERIOD.toInt(),
        );
        expect(info.defaultFreezeStatus).to.be.false;
        expect(info.defaultKycStatus).to.be.false;
        expect(info.isDeleted).to.be.false;
        expect(info.expirationTime).to.be.not.null;
    });

    it("should be executable with minimal properties set", async function () {
        const operatorId = env.operatorId;

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setTreasuryAccountId(operatorId)
            .execute(env.client);

        const tokenId = (await response.getReceipt(env.client)).tokenId;

        const info = await new TokenInfoQuery()
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
        expect(info.autoRenewAccountId.toString()).to.be.equal(
            operatorId.toString(),
        );
        expect(info.autoRenewPeriod.seconds.toInt()).to.eql(
            DEFAULT_AUTO_RENEW_PERIOD.toInt(),
        );
        expect(info.kycKey).to.be.null;
        expect(info.freezeKey).to.be.null;
        expect(info.wipeKey).to.be.null;
        expect(info.supplyKey).to.be.null;
        expect(info.defaultFreezeStatus).to.be.null;
        expect(info.defaultKycStatus).to.be.null;
        expect(info.isDeleted).to.be.false;
        expect(info.expirationTime).to.be.not.null;

        let err = false;

        try {
            await (
                await new TokenDeleteTransaction()
                    .setTokenId(tokenId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.TokenIsImmutable);
        }

        if (!err) {
            throw new Error("token deletion did not error");
        }
    });

    it("when autoRenewAccountId is set", async function () {
        const operatorId = env.operatorId;

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setTreasuryAccountId(operatorId)
            .execute(env.client);

        const tokenId = (await response.getReceipt(env.client)).tokenId;

        const info = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(env.client);
        expect(info.autoRenewAccountId).to.be.not.null;
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            operatorId.toString(),
        );
    });

    it("when expirationTime is set", async function () {
        const operatorId = env.operatorId;
        const DAYS_45_IN_SECONDS = 3888000;
        const expirationTime = new Timestamp(
            Math.floor(Date.now() / 1000 + DAYS_45_IN_SECONDS),
            0,
        );

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setTreasuryAccountId(operatorId)
            .setExpirationTime(expirationTime)
            .execute(env.client);

        const tokenId = (await response.getReceipt(env.client)).tokenId;

        const info = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(env.client);

        expect(info.expirationTime).to.be.not.null;
        expect(info.expirationTime.toString()).to.be.eql(
            expirationTime.toString(),
        );
    });

    it("expirationTime should override autoRenewPeriod", async function () {
        const operatorId = env.operatorId;
        const DAYS_90_IN_SECONDS = 7776000;
        const expirationTime = new Timestamp(
            Math.floor(Date.now() / 1000 + DAYS_90_IN_SECONDS),
            0,
        );

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setTreasuryAccountId(operatorId)
            .setExpirationTime(expirationTime)
            .execute(env.client);

        const tokenId = (await response.getReceipt(env.client)).tokenId;

        const info = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(env.client);

        expect(info.autoRenewAccountId).to.be.eql(null);
        expect(info.autoRenewPeriod).to.equal(null);
        expect(info.expirationTime.seconds.toInt()).to.equal(
            expirationTime.seconds.toInt(),
        );
    });

    it("should error when token name is not set", async function () {
        const env = await IntegrationTestEnv.new();
        const operatorId = env.operatorId;

        let err = false;

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(operatorId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.MissingTokenName);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }
    });

    it("should error when token symbol is not set", async function () {
        const operatorId = env.operatorId;

        let err = false;

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTreasuryAccountId(operatorId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.MissingTokenSymbol);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }
    });

    it("should error when treasury account ID is not set", async function () {
        let err = false;

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.InvalidTreasuryAccountForToken);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }
    });

    it("should error when admin key does not sign transaction", async function () {
        const operatorId = env.operatorId;

        let err = false;

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(PrivateKey.generateED25519())
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }
    });

    it("should create a token when autoRenewPeriod is null", async function () {
        let tokenTransaction = new TokenCreateTransaction()
            .setTokenName("TEST")
            .setTokenSymbol("TEST")
            .setTokenType(TokenType.FungibleCommon)
            .setSupplyType(TokenSupplyType.Infinite)
            .setAutoRenewAccountId(env.operatorId)
            .setInitialSupply(1)
            .setMaxTransactionFee(new Hbar(100))
            .setTreasuryAccountId(env.operatorId)
            .setExpirationTime(
                new Timestamp(
                    Math.floor(Date.now() / 1000 + 90 * 24 * 60 * 60),
                    0,
                ),
            )
            .setDecimals(0);

        let tx = await tokenTransaction.execute(env.client);
        let receipt = await tx.getReceipt(env.client);

        expect(receipt.status.toString()).to.eql(Status.Success.toString());
    });

    afterAll(async function () {
        await env.close();
    });
});
