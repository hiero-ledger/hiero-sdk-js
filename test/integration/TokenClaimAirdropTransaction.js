import { expect } from "chai";
import {
    AccountBalanceQuery,
    AccountCreateTransaction,
    TokenAirdropTransaction,
    PrivateKey,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenDeleteTransaction,
    TokenFreezeTransaction,
    TokenMintTransaction,
    TokenPauseTransaction,
    TokenType,
    TokenClaimAirdropTransaction,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TokenClaimAirdropIntegrationTest", function () {
    let env, tx;
    const INITIAL_SUPPLY = 1000;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should claim the tokens when they are in pending state", async function () {
        // create nft and ft tokens
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY)
                .setTreasuryAccountId(env.operatorId)
                .setSupplyKey(env.operatorPublicKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { tokenId: nftId } = await (
            await new TokenCreateTransaction()
                .setTokenName("nft")
                .setTokenSymbol("NFT")
                .setTokenType(TokenType.NonFungibleUnique)
                .setSupplyKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        // mint nfts
        const tokenMintResponse = await new TokenMintTransaction()
            .setTokenId(nftId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await tokenMintResponse.getReceipt(env.client);

        // generate accounts
        const receiverPrivateKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverPrivateKey)
                .execute(env.client)
        ).getReceipt(env.client);

        // airdrop ft and nft
        tx = await new TokenAirdropTransaction()
            .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
            .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
            .addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
            .execute(env.client);

        // get airdrop ids for both FT and NFTs
        const { newPendingAirdrops } = await tx.getRecord(env.client);
        const [pendingAirdrop, pendingAirdropNft] = newPendingAirdrops;
        const { airdropId } = pendingAirdrop;
        const { airdropId: airdropNftId } = pendingAirdropNft;

        // claim airdrop
        await (
            await (
                await new TokenClaimAirdropTransaction()
                    .addPendingAirdropId(airdropId)
                    .addPendingAirdropId(airdropNftId)
                    .freezeWith(env.client)
                    .sign(receiverPrivateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        // check balances
        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        expect(receiverBalance.tokens.get(tokenId).toInt()).to.be.equal(
            INITIAL_SUPPLY,
        );
        expect(receiverBalance.tokens.get(nftId).toInt()).to.be.equal(1);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(operatorBalance.tokens.get(tokenId).toInt()).to.be.equal(0);
        expect(operatorBalance.tokens.get(nftId).toInt()).to.be.equal(0);
    });

    it("should claim the tokens to multiple receivers when they are in pending state", async function () {
        // create nft and ft tokens
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY)
                .setTreasuryAccountId(env.operatorId)
                .setSupplyKey(env.operatorPublicKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { tokenId: nftId } = await (
            await new TokenCreateTransaction()
                .setTokenName("nft")
                .setTokenSymbol("NFT")
                .setTokenType(TokenType.NonFungibleUnique)
                .setSupplyKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        // mint nfts
        const tokenMintResponse = await new TokenMintTransaction()
            .addMetadata(Buffer.from("-"))
            .setTokenId(nftId)
            .execute(env.client);

        const { serials } = await tokenMintResponse.getReceipt(env.client);

        const tokenMintResponse2 = await new TokenMintTransaction()
            .addMetadata(Buffer.from("-"))
            .setTokenId(nftId)
            .execute(env.client);

        const { serials: serials2 } = await tokenMintResponse2.getReceipt(
            env.client,
        );

        // generate accounts
        const receiverPrivateKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverPrivateKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const receiverPrivateKey2 = PrivateKey.generateED25519();
        const { accountId: receiverId2 } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverPrivateKey2)
                .execute(env.client)
        ).getReceipt(env.client);

        // airdrop ft and nft
        tx = await new TokenAirdropTransaction()
            .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
            .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY / 2)
            .addTokenTransfer(tokenId, receiverId2, INITIAL_SUPPLY / 2)
            .addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
            .addNftTransfer(nftId, serials2[0], env.operatorId, receiverId2)
            .execute(env.client);

        // get airdrop ids for both FT and NFTs
        const { newPendingAirdrops } = await tx.getRecord(env.client);
        const pendingAirdropIds = newPendingAirdrops.map(
            (pendingAirdrop) => pendingAirdrop.airdropId,
        );

        await (
            await (
                await (
                    await new TokenClaimAirdropTransaction()
                        .setPendingAirdropIds(pendingAirdropIds)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).sign(receiverPrivateKey2)
            ).execute(env.client)
        ).getReceipt(env.client);

        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        const receiverBalance2 = await new AccountBalanceQuery()
            .setAccountId(receiverId2)
            .execute(env.client);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(receiverBalance.tokens.get(tokenId).toInt()).to.be.equal(
            INITIAL_SUPPLY / 2,
        );

        expect(receiverBalance.tokens.get(nftId).toInt()).to.be.equal(1);

        expect(receiverBalance2.tokens.get(tokenId).toInt()).to.be.equal(
            INITIAL_SUPPLY / 2,
        );
        expect(receiverBalance2.tokens.get(nftId).toInt()).to.be.equal(1);

        expect(operatorBalance.tokens.get(tokenId).toInt()).to.be.equal(0);
        expect(operatorBalance.tokens.get(nftId).toInt()).to.be.equal(0);
    });

    it("should claim the tokens when they are in pending state with multiple airdrop ids", async function () {
        // create nft and ft tokens
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY)
                .setTreasuryAccountId(env.operatorId)
                .setSupplyKey(env.operatorPublicKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { tokenId: nftId } = await (
            await new TokenCreateTransaction()
                .setTokenName("nft")
                .setTokenSymbol("NFT")
                .setTokenType(TokenType.NonFungibleUnique)
                .setSupplyKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        // mint nfts
        const tokenMintResponse = await new TokenMintTransaction()
            .addMetadata(Buffer.from("-"))
            .setTokenId(nftId)
            .execute(env.client);
        const { serials } = await tokenMintResponse.getReceipt(env.client);

        const tokenMintResponse2 = await new TokenMintTransaction()
            .addMetadata(Buffer.from("-"))
            .setTokenId(nftId)
            .execute(env.client);

        const { serials: serials2 } = await tokenMintResponse2.getReceipt(
            env.client,
        );

        const receiverKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { newPendingAirdrops } = await (
            await new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
                .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
                .execute(env.client)
        ).getRecord(env.client);

        const { newPendingAirdrops: newPendingAirdrops2 } = await (
            await new TokenAirdropTransaction()
                .addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                .addNftTransfer(nftId, serials2[0], env.operatorId, receiverId)
                .execute(env.client)
        ).getRecord(env.client);

        await (
            await (
                await new TokenClaimAirdropTransaction()
                    .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                    .addPendingAirdropId(newPendingAirdrops2[0].airdropId)
                    .addPendingAirdropId(newPendingAirdrops2[1].airdropId)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        expect(receiverBalance.tokens.get(tokenId).toInt()).to.be.equal(
            INITIAL_SUPPLY,
        );
        expect(receiverBalance.tokens.get(nftId).toInt()).to.be.equal(2);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(operatorBalance.tokens.get(tokenId).toInt()).to.be.equal(0);
        expect(operatorBalance.tokens.get(nftId).toInt()).to.be.equal(0);
    });

    it("should not be able to claim the tokens when they are not airdropped", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const receiverKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { newPendingAirdrops } = await (
            await new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
                .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
                .execute(env.client)
        ).getRecord(env.client);

        const randomAccountKey = PrivateKey.generateED25519();
        const { accountId: randomAccountId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(randomAccountKey)
                .execute(env.client)
        ).getReceipt(env.client);

        let err = false;
        try {
            await (
                await new TokenClaimAirdropTransaction()
                    .setTransactionId(TransactionId.generate(randomAccountId))
                    .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes("INVALID_SIGNATURE");
        }
        expect(err).to.be.true;
    });

    it("should not be able to claim the tokens when they are already claimed", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const { tokenId: nftId } = await (
            await new TokenCreateTransaction()
                .setTokenName("nft")
                .setTokenSymbol("NFT")
                .setTokenType(TokenType.NonFungibleUnique)
                .setSupplyKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const { serials } = await (
            await new TokenMintTransaction()
                .setTokenId(nftId)
                .addMetadata(Buffer.from("-"))
                .execute(env.client)
        ).getReceipt(env.client);

        const receiverKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { newPendingAirdrops } = await (
            await new TokenAirdropTransaction()
                .addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
                .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
                .execute(env.client)
        ).getRecord(env.client);

        await (
            await (
                await new TokenClaimAirdropTransaction()
                    .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        // reclaim already claimed airdrop
        let err = false;
        try {
            await (
                await (
                    await new TokenClaimAirdropTransaction()
                        .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                        .freezeWith(env.client)
                        .sign(receiverKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes("INVALID_PENDING_AIRDROP_ID");
        }
        expect(err).to.be.true;
    });

    it("should not be able to claim the tokens with empty list", async function () {
        let err = false;
        try {
            await new TokenClaimAirdropTransaction().execute(env.client);
        } catch (error) {
            err = error.message.includes("EMPTY_PENDING_AIRDROP_ID_LIST");
        }
        expect(err).to.be.true;
    });

    it("should not claim the tokens with duplicate entries", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(100)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const receiverKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { newPendingAirdrops } = await (
            await new TokenAirdropTransaction()
                //.addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                .addTokenTransfer(tokenId, env.operatorId, -100)
                .addTokenTransfer(tokenId, receiverId, 100)
                .execute(env.client)
        ).getRecord(env.client);

        let err = false;
        try {
            await new TokenClaimAirdropTransaction()
                .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                .execute(env.client);
        } catch (error) {
            err = error.message.includes("PENDING_AIRDROP_ID_REPEATED");
        }

        expect(err).to.be.true;
    });

    it("should not be able to claim tokens when token is paused", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(100)
                .setPauseKey(env.operatorKey)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TokenPauseTransaction()
                .setTokenId(tokenId)
                .execute(env.client)
        ).getReceipt(env.client);

        const receiverKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverKey)
                .execute(env.client)
        ).getReceipt(env.client);

        let err = false;
        try {
            await (
                await new TokenAirdropTransaction()
                    //.addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                    .addTokenTransfer(tokenId, env.operatorId, -100)
                    .addTokenTransfer(tokenId, receiverId, 100)
                    .execute(env.client)
            ).getRecord(env.client);
        } catch (error) {
            err = error.message.includes("TOKEN_IS_PAUSED");
        }
        expect(err).to.be.true;
    });

    it("should not be able to claim tokens when token is deleted", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(100)
                .setAdminKey(env.operatorKey)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TokenDeleteTransaction()
                .setTokenId(tokenId)
                .execute(env.client)
        ).getReceipt(env.client);

        const receiverKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverKey)
                .execute(env.client)
        ).getReceipt(env.client);

        let err = false;
        try {
            await (
                await new TokenAirdropTransaction()
                    //.addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                    .addTokenTransfer(tokenId, env.operatorId, -100)
                    .addTokenTransfer(tokenId, receiverId, 100)
                    .execute(env.client)
            ).getRecord(env.client);
        } catch (error) {
            err = error.message.includes("TOKEN_WAS_DELETED");
        }
        expect(err).to.be.true;
    });

    it("should not be able to claim tokens when token is frozen", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(100)
                .setFreezeKey(env.operatorKey)
                .setTreasuryAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const receiverKey = PrivateKey.generateED25519();
        const { accountId: receiverId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverKey)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TokenAssociateTransaction()
                .setAccountId(receiverId)
                .setTokenIds([tokenId])
                .freezeWith(env.client)
                .sign(receiverKey)
        ).execute(env.client);

        await (
            await new TokenFreezeTransaction()
                .setAccountId(receiverId)
                .setTokenId(tokenId)
                .execute(env.client)
        ).getReceipt(env.client);

        let err = false;
        try {
            await (
                await new TokenAirdropTransaction()
                    //.addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                    .addTokenTransfer(tokenId, env.operatorId, -100)
                    .addTokenTransfer(tokenId, receiverId, 100)
                    .execute(env.client)
            ).getRecord(env.client);
        } catch (error) {
            err = error.message.includes("ACCOUNT_FROZEN_FOR_TOKEN");
        }
        expect(err).to.be.true;
    });

    after(async function () {
        await env.close();
    });
});
