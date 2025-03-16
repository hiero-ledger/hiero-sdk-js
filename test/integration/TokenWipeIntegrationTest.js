import {
    AccountCreateTransaction,
    AccountInfoQuery,
    Hbar,
    PrivateKey,
    Status,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenGrantKycTransaction,
    TokenWipeTransaction,
    TransferTransaction,
    Transaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import Long from "long";

describe("TokenWipe", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(2))
            .execute(env.client);

        const account = (await response.getReceipt(env.client)).accountId;

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setDecimals(3)
                    .setInitialSupply(1000000)
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(operatorKey)
                    .setKycKey(operatorKey)
                    .setFreezeKey(operatorKey)
                    .setWipeKey(operatorKey)
                    .setSupplyKey(operatorKey)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token])
                    .setAccountId(account)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(token)
                    .setAccountId(account)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(token, account, 10)
                .addTokenTransfer(token, env.operatorId, -10)
                .execute(env.client)
        ).getReceipt(env.client);

        let info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        let relationship = info.tokenRelationships.get(token);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(token.toString());
        expect(relationship.balance.toInt()).to.be.equal(10);
        expect(relationship.isKycGranted).to.be.true;
        expect(relationship.isFrozen).to.be.false;

        await (
            await new TokenWipeTransaction()
                .setTokenId(token)
                .setAccountId(account)
                .setAmount(10)
                .execute(env.client)
        ).getReceipt(env.client);

        info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        relationship = info.tokenRelationships.get(token);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(token.toString());
        expect(relationship.balance.toInt()).to.be.equal(0);
        expect(relationship.isKycGranted).to.be.true;
        expect(relationship.isFrozen).to.be.false;
    });

    it("should error when token ID is not set", async function () {
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(2))
            .execute(env.client);

        const account = (await response.getReceipt(env.client)).accountId;

        let err = false;

        try {
            await (
                await (
                    await new TokenWipeTransaction()
                        .setAccountId(account)
                        .setAmount(10)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token wipe did not error");
        }
    });

    it("should error when account ID is not set", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setDecimals(3)
            .setInitialSupply(1000000)
            .setTreasuryAccountId(operatorId)
            .setAdminKey(operatorKey)
            .setKycKey(operatorKey)
            .setFreezeKey(operatorKey)
            .setWipeKey(operatorKey)
            .setSupplyKey(operatorKey)
            .setFreezeDefault(false)
            .execute(env.client);

        const token = (await response.getReceipt(env.client)).tokenId;

        let err = false;

        try {
            await (
                await new TokenWipeTransaction()
                    .setTokenId(token)
                    .setAmount(10)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountId);
        }

        if (!err) {
            throw new Error("token wipe did not error");
        }
    });

    it("should not error when amount is not set", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(2))
            .execute(env.client);

        const account = (await response.getReceipt(env.client)).accountId;

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setDecimals(3)
                    .setInitialSupply(1000000)
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(operatorKey)
                    .setKycKey(operatorKey)
                    .setFreezeKey(operatorKey)
                    .setWipeKey(operatorKey)
                    .setSupplyKey(operatorKey)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token])
                    .setAccountId(account)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(token)
                    .setAccountId(account)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        let err = false;

        try {
            await (
                await new TokenWipeTransaction()
                    .setTokenId(token)
                    .setAccountId(account)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error;
        }

        if (err) {
            throw new Error("token wipe did error");
        }
    });

    it("should convert fromBytes", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(2))
            .execute(env.client);

        const account = (await response.getReceipt(env.client)).accountId;
        const serials = [1, 2, 3];

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setDecimals(3)
                    .setInitialSupply(1000000)
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(operatorKey)
                    .setKycKey(operatorKey)
                    .setFreezeKey(operatorKey)
                    .setWipeKey(operatorKey)
                    .setSupplyKey(operatorKey)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;
        const transaction = new TokenWipeTransaction()
            .setTokenId(token)
            .setAccountId(account)
            .setSerials(serials)
            .freezeWith(env.client)
            .toBytes();

        const restoredTransaction = Transaction.fromBytes(transaction);

        expect(restoredTransaction.serials).to.be.an("array");
        expect(restoredTransaction.serials).to.have.length(3);
        expect(restoredTransaction.serials.toString()).to.deep.eql(
            serials.map((number) => Long.fromNumber(number)).toString(),
        );
    });

    after(async function () {
        await env.close();
    });
});
