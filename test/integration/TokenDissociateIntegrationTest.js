import {
    AccountBalanceQuery,
    AccountInfoQuery,
    Status,
    TokenAssociateTransaction,
    TokenDissociateTransaction,
    TokenGrantKycTransaction,
    TokenMintTransaction,
    TransferTransaction,
    Hbar,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createAccount,
    createFungibleToken,
    createNonFungibleToken,
} from "./utils/Fixtures.js";

describe("TokenDissociate", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
            (transaction) => transaction.setInitialBalance(new Hbar(2)),
        );

        const token = await createFungibleToken(env.client, (transaction) => {
            transaction.setKycKey(env.client.operatorPublicKey);
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

        let balances = await new AccountBalanceQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(balances.tokens.get(token).toInt()).to.be.equal(0);

        let info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        const relationship = info.tokenRelationships.get(token);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(token.toString());
        expect(relationship.balance.toInt()).to.be.equal(0);
        expect(relationship.isKycGranted).to.be.false;
        expect(relationship.isFrozen).to.be.false;

        await (
            await (
                await new TokenDissociateTransaction()
                    .setTokenIds([token])
                    .setAccountId(account)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        balances = await new AccountBalanceQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(balances.tokens.get(token)).to.be.null;

        info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(info.tokenRelationships.get(token)).to.be.null;
    });

    it("should be executable even when no token IDs are set", async function () {
        const operatorId = env.operatorId;

        await (
            await new TokenDissociateTransaction()
                .setAccountId(operatorId)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error when account ID is not set", async function () {
        const env = await IntegrationTestEnv.new();

        const tokenId = await createFungibleToken(env.client);

        let err = false;

        try {
            await (
                await new TokenDissociateTransaction()
                    .setTokenIds([tokenId])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountId);
        }

        if (!err) {
            throw new Error("token association did not error");
        }
    });

    it("cannot dissociate account which owns NFTs", async function () {
        const { accountId, newKey: key } = await createAccount(env.client);

        const tokenId = await createNonFungibleToken(
            env.client,
            (transaction) => {
                transaction.setKycKey(env.client.operatorPublicKey);
            },
        );

        await (
            await new TokenMintTransaction()
                .setMetadata([Uint8Array.of([0, 1, 2])])
                .setTokenId(tokenId)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([tokenId])
                    .setAccountId(accountId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(tokenId)
                    .setAccountId(accountId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addNftTransfer(tokenId, 1, env.operatorId, accountId)
                .execute(env.client)
        ).getReceipt(env.client);

        let err = false;

        try {
            await (
                await (
                    await new TokenDissociateTransaction()
                        .setTokenIds([tokenId])
                        .setAccountId(accountId)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.AccountStillOwnsNfts);
        }

        if (!err) {
            throw new Error("token update did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
