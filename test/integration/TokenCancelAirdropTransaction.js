import { expect } from "chai";
import {
    AccountCreateTransaction,
    TokenCreateTransaction,
    TokenType,
    PrivateKey,
    TokenAirdropTransaction,
    TokenMintTransaction,
    TokenCancelAirdropTransaction,
    AccountBalanceQuery,
    TokenFreezeTransaction,
    TokenAssociateTransaction,
    TokenPauseTransaction,
    TokenDeleteTransaction,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TokenCancelAirdropIntegrationTest", function () {
    let env;
    const INITIAL_SUPPLY = 1000;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should cancel the tokens when they are in pending state", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFFFFF")
                .setTokenSymbol("FFF")
                .setTreasuryAccountId(env.operatorId)
                .setInitialSupply(INITIAL_SUPPLY)
                .execute(env.client)
        ).getReceipt(env.client);

        const { tokenId: nftId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFFFFF")
                .setTokenSymbol("FFF")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setSupplyKey(env.operatorKey)
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
                .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
                .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
                .addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                .execute(env.client)
        ).getRecord(env.client);

        const [airdrop] = newPendingAirdrops;
        const { airdropId } = airdrop;
        await new TokenCancelAirdropTransaction()
            .addPendingAirdropId(airdropId)
            .execute(env.client);

        const ownerBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(ownerBalance.tokens.get(tokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );
        expect(ownerBalance.tokens.get(nftId).toInt()).to.be.eq(1);
    });

    it("should cancel the token when token's frozen", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFFFFF")
                .setTokenSymbol("FFF")
                .setTreasuryAccountId(env.operatorId)
                .setInitialSupply(INITIAL_SUPPLY)
                .setFreezeKey(env.operatorKey)
                .execute(env.client)
        ).getReceipt(env.client);

        const { tokenId: nftId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFFFFF")
                .setTokenSymbol("FFF")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setSupplyKey(env.operatorKey)
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
                .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
                .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
                .addNftTransfer(nftId, serials[0], env.operatorId, receiverId)
                .execute(env.client)
        ).getRecord(env.client);

        await (
            await new TokenAssociateTransaction()
                .setAccountId(receiverId)
                .setTokenIds([nftId])
                .freezeWith(env.client)
                .sign(receiverKey)
        ).execute(env.client);

        await (
            await new TokenFreezeTransaction()
                .setTokenId(tokenId)
                .setAccountId(env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const [airdrop] = newPendingAirdrops;
        const { airdropId } = airdrop;
        await new TokenCancelAirdropTransaction()
            .addPendingAirdropId(airdropId)
            .execute(env.client);

        const ownerBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(ownerBalance.tokens.get(tokenId).toInt()).to.equal(
            INITIAL_SUPPLY,
        );
        expect(ownerBalance.tokens.get(nftId).toInt()).to.equal(1);
    });

    it("should cancel the token if paused", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFFFFF")
                .setTokenSymbol("FFF")
                .setTreasuryAccountId(env.operatorId)
                .setInitialSupply(INITIAL_SUPPLY)
                .setPauseKey(env.operatorKey)
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

        await (
            await new TokenPauseTransaction()
                .setTokenId(tokenId)
                .execute(env.client)
        ).getReceipt(env.client);

        const [airdrop] = newPendingAirdrops;
        const { airdropId } = airdrop;
        await new TokenCancelAirdropTransaction()
            .addPendingAirdropId(airdropId)
            .execute(env.client);

        const ownerBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(ownerBalance.tokens.get(tokenId).toInt()).to.equal(
            INITIAL_SUPPLY,
        );
    });

    it("should cancel the token if token is deleted", async function () {
        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("FFFFFFFFF")
                .setTokenSymbol("FFF")
                .setTreasuryAccountId(env.operatorId)
                .setInitialSupply(INITIAL_SUPPLY)
                .setAdminKey(env.operatorKey)
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

        await (
            await new TokenDeleteTransaction()
                .setTokenId(tokenId)
                .execute(env.client)
        ).getReceipt(env.client);

        const [airdrop] = newPendingAirdrops;
        const { airdropId } = airdrop;
        await new TokenCancelAirdropTransaction()
            .addPendingAirdropId(airdropId)
            .execute(env.client);

        const ownerBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(ownerBalance.tokens.get(tokenId).toInt()).to.equal(
            INITIAL_SUPPLY,
        );
    });

    it("should cancel the tokens to multiple receivers when they are in pending state", async function () {
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
        let tx = await new TokenAirdropTransaction()
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
            await new TokenCancelAirdropTransaction()
                .setPendingAirdropIds(pendingAirdropIds)
                .freezeWith(env.client)
                .execute(env.client)
        ).getReceipt(env.client);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(operatorBalance.tokens.get(tokenId).toInt()).to.be.equal(
            INITIAL_SUPPLY,
        );
        expect(operatorBalance.tokens.get(nftId).toInt()).to.be.equal(2);
    });

    it("should cancel the tokens when they are in pending state with multiple airdrop ids", async function () {
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
            await new TokenCancelAirdropTransaction()
                .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                .addPendingAirdropId(newPendingAirdrops2[0].airdropId)
                .addPendingAirdropId(newPendingAirdrops2[1].airdropId)
                .execute(env.client)
        ).getReceipt(env.client);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(operatorBalance.tokens.get(tokenId).toInt()).to.be.equal(
            INITIAL_SUPPLY,
        );
        expect(operatorBalance.tokens.get(nftId).toInt()).to.be.equal(2);
    });

    it("should not be able to cancel the tokens when they are not airdropped", async function () {
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
                await new TokenCancelAirdropTransaction()
                    .setTransactionId(TransactionId.generate(randomAccountId))
                    .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes("INVALID_SIGNATURE");
        }

        expect(err).to.be.true;
    });

    it("should not be able to cancel the tokens when they are already canceled", async function () {
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
            await new TokenCancelAirdropTransaction()
                .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                .execute(env.client)
        ).getReceipt(env.client);

        // recancel already canceled airdrop
        let err = false;
        try {
            await (
                await new TokenCancelAirdropTransaction()
                    .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes("INVALID_PENDING_AIRDROP_ID");
        }
        expect(err).to.be.true;
    });

    it("should not be able to cancel the tokens with empty list", async function () {
        let err = false;
        try {
            await new TokenCancelAirdropTransaction().execute(env.client);
        } catch (error) {
            err = error.message.includes("EMPTY_PENDING_AIRDROP_ID_LIST");
        }
        expect(err).to.be.true;
    });

    it("cannot cancel the tokens with duplicate entries", async function () {
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
            await new TokenCancelAirdropTransaction()
                .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                .execute(env.client);
        } catch (error) {
            err = error.message.includes("PENDING_AIRDROP_ID_REPEATED");
        }

        expect(err).to.be.true;
    });

    after(async function () {
        await env.close();
    });
});
