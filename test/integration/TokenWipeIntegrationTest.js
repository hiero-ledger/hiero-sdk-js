import {
    AccountInfoQuery,
    Status,
    TokenAssociateTransaction,
    TokenGrantKycTransaction,
    TokenWipeTransaction,
    TransferTransaction,
    Transaction,
    PrivateKey,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import Long from "long";
import { createAccount, createFungibleToken } from "./utils/Fixtures.js";

describe("TokenWipe", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const key = PrivateKey.generateED25519();

        const { accountId: account } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key);
            },
        );

        const token = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setKycKey(env.operatorKey.publicKey)
                .setFreezeDefault(false);
        });

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
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

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
        const token = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setKycKey(env.operatorKey.publicKey)
                .setFreezeDefault(false);
        });

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
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

        const token = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setKycKey(env.operatorKey.publicKey)
                .setFreezeDefault(false);
        });

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
        const serials = [1, 2, 3];

        const { accountId: account } = await createAccount(env.client);

        const token = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setKycKey(env.operatorKey.publicKey)
                .setFreezeDefault(false);
        });

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

    afterAll(async function () {
        await env.close();
    });
});
