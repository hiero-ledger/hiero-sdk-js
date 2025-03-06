import {
    AccountBalanceQuery,
    Hbar,
    NftId,
    TokenAssociateTransaction,
    TokenMintTransaction,
    TokenRejectFlow,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createFungibleToken,
    createNonFungibleToken,
    createAccount,
} from "./utils/Fixtures.js";

describe("TokenRejectIntegrationTest", function () {
    let env;

    it("can execute TokenRejectFlow for fungible tokens", async function () {
        env = await IntegrationTestEnv.new();
        const FULL_TREASURY_BALANCE = 1000000;

        // create tokens
        const tokenId1 = await createFungibleToken(
            env.client,
            (transaction) => {
                transaction
                    .setDecimals(3)
                    .setInitialSupply(FULL_TREASURY_BALANCE)
                    .setTreasuryAccountId(env.operatorId)
                    .setPauseKey(env.operatorKey)
                    .setAdminKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey);
            },
        );

        const tokenId2 = await createFungibleToken(
            env.client,
            (transaction) => {
                transaction
                    .setDecimals(3)
                    .setInitialSupply(1000000)
                    .setTreasuryAccountId(env.operatorId)
                    .setPauseKey(env.operatorKey)
                    .setAdminKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey);
            },
        );

        // create receiver account
        const { accountId: receiverId, newKey: receiverPrivateKey } =
            await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(1));
            });

        await (
            await new TokenAssociateTransaction()
                .setAccountId(receiverId)
                .setTokenIds([tokenId1, tokenId2])
                .freezeWith(env.client)
                .sign(receiverPrivateKey)
        ).execute(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(tokenId1, env.operatorId, -100)
                .addTokenTransfer(tokenId1, receiverId, 100)
                .addTokenTransfer(tokenId2, env.operatorId, -100)
                .addTokenTransfer(tokenId2, receiverId, 100)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TokenRejectFlow()
                .setOwnerId(receiverId)
                .setTokenIds([tokenId1, tokenId2])
                .freezeWith(env.client)
                .sign(receiverPrivateKey)
        ).execute(env.client);

        const receiverBalanceQuery = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        const treasuryBalanceQuery = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(receiverBalanceQuery.tokens.get(tokenId1)).to.be.eq(null);
        expect(receiverBalanceQuery.tokens.get(tokenId2)).to.be.eq(null);
        expect(treasuryBalanceQuery.tokens.get(tokenId1).toInt()).to.be.eq(
            FULL_TREASURY_BALANCE,
        );
        expect(treasuryBalanceQuery.tokens.get(tokenId2).toInt()).to.be.eq(
            FULL_TREASURY_BALANCE,
        );

        let err;
        try {
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId1, receiverId, 100)
                    .addTokenTransfer(tokenId1, env.operatorId, -100)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes("TOKEN_NOT_ASSOCIATED_TO_ACCOUNT");
        }

        if (!err) {
            throw new Error(
                "Token should not be associated with receiver account",
            );
        }
    });

    it("can execute TokenRejectFlow for non-fungible tokens", async function () {
        env = await IntegrationTestEnv.new();

        // create token
        const tokenId = await createNonFungibleToken(
            env.client,
            (transaction) => {
                transaction
                    .setTreasuryAccountId(env.operatorId)
                    .setPauseKey(env.operatorKey)
                    .setAdminKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey);
            },
        );

        // create receiver account
        const { accountId: receiverId, newKey: receiverPrivateKey } =
            await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(1));
            });

        await (
            await new TokenAssociateTransaction()
                .setAccountId(receiverId)
                .setTokenIds([tokenId])
                .freezeWith(env.client)
                .sign(receiverPrivateKey)
        ).execute(env.client);

        await new TokenMintTransaction()
            .setTokenId(tokenId)
            .addMetadata(Buffer.from("====="))
            .execute(env.client);

        const nftId = new NftId(tokenId, 1);
        await (
            await new TransferTransaction()
                .addNftTransfer(nftId, env.operatorId, receiverId)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TokenRejectFlow()
                .setOwnerId(receiverId)
                .setNftIds([nftId])
                .freezeWith(env.client)
                .sign(receiverPrivateKey)
        ).execute(env.client);

        const receiverBalanceQuery = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        const treasuryBalanceQuery = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(receiverBalanceQuery.tokens.get(tokenId)).to.eq(null);
        expect(treasuryBalanceQuery.tokens.get(tokenId).toInt()).to.be.eq(1);

        let err;
        try {
            await (
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes("TOKEN_NOT_ASSOCIATED_TO_ACCOUNT");
        }

        if (!err) {
            throw new Error(
                "Token should not be associated with receiver account",
            );
        }
    });

    after(async function () {
        await env.close();
    });
});
