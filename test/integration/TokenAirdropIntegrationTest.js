import {
    TokenAirdropTransaction,
    TokenMintTransaction,
    PrivateKey,
    NftId,
    AccountBalanceQuery,
    CustomFixedFee,
    TokenAssociateTransaction,
    TransferTransaction,
    Hbar,
    AccountId,
    TokenId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createAccount,
    createFungibleToken,
    createNonFungibleToken,
} from "./utils/Fixtures.js";

describe("TokenAirdropIntegrationTest", function () {
    let env;
    const INITIAL_SUPPLY = 1000;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should transfer tokens when the account is associated", async function () {
        const ftTokenId = await createFungibleToken(env.client, (transaction) =>
            transaction
                .setTokenName("ffff")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY),
        );

        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction.setTokenName("FFFFF").setTokenSymbol("FFF"),
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const { accountId: receiverId } = await createAccount(
            env.client,
            (transaction) => transaction.setMaxAutomaticTokenAssociations(-1),
        );

        // airdrop the tokens
        const transactionResponse = await new TokenAirdropTransaction()
            .addNftTransfer(
                new NftId(nftTokenId, serials[0]),
                env.operatorId,
                receiverId,
            )
            .addTokenTransfer(ftTokenId, receiverId, INITIAL_SUPPLY)
            .addTokenTransfer(ftTokenId, env.operatorId, -INITIAL_SUPPLY)
            .execute(env.client);

        const { newPendingAirdrops } = await transactionResponse.getRecord(
            env.client,
        );
        expect(newPendingAirdrops.length).to.be.eq(0);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        expect(operatorBalance.tokens.get(ftTokenId).toInt()).to.be.eq(0);
        expect(receiverBalance.tokens.get(ftTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );

        expect(operatorBalance.tokens.get(nftTokenId).toInt()).to.be.eq(0);
        expect(receiverBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
    });

    it("tokens should be in pending state when no automatic association", async function () {
        const ftTokenId = await createFungibleToken(env.client, (transaction) =>
            transaction
                .setTokenName("ffff")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY),
        );

        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction.setTokenName("FFFFF").setTokenSymbol("FFF"),
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const { accountId: receiverId } = await createAccount(env.client);

        const airdropTokenResponse = await new TokenAirdropTransaction()
            .addTokenTransfer(ftTokenId, receiverId, INITIAL_SUPPLY)
            .addTokenTransfer(ftTokenId, env.operatorId, -INITIAL_SUPPLY)
            .addNftTransfer(nftTokenId, serials[0], env.operatorId, receiverId)
            .execute(env.client);

        const airdropTokenRecord = await airdropTokenResponse.getRecord(
            env.client,
        );

        const { newPendingAirdrops } = airdropTokenRecord;

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);
        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        // FT checks
        expect(operatorBalance.tokens.get(ftTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );
        expect(receiverBalance.tokens.get(ftTokenId)).to.be.eq(null);

        // NFT checks
        expect(operatorBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
        expect(receiverBalance.tokens.get(nftTokenId)).to.be.eq(null);

        // record check
        expect(newPendingAirdrops.length).to.be.eq(2);
        expect(newPendingAirdrops[0].airdropId.senderId).deep.equal(
            env.operatorId,
        );
        expect(newPendingAirdrops[0].airdropId.receiverId).deep.equal(
            receiverId,
        );
        expect(newPendingAirdrops[0].airdropId.tokenId).deep.equal(ftTokenId);
        expect(newPendingAirdrops[0].airdropId.nftId).to.equal(null);

        expect(newPendingAirdrops[1].airdropId.senderId).deep.equal(
            env.operatorId,
        );
        expect(newPendingAirdrops[1].airdropId.receiverId).deep.equal(
            receiverId,
        );
        expect(newPendingAirdrops[1].airdropId.tokenId).deep.equal(null);
        expect(newPendingAirdrops[1].airdropId.nftId.tokenId).to.deep.equal(
            nftTokenId,
        );

        expect(
            newPendingAirdrops[1].airdropId.nftId.serial.toString(),
        ).to.deep.equal(serials[0].toString());
    });

    it("should create hollow account when airdropping tokens and transfers them", async function () {
        const ftTokenId = await createFungibleToken(env.client, (transaction) =>
            transaction
                .setTokenName("ffff")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY),
        );

        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction.setTokenName("FFFFF").setTokenSymbol("FFF"),
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("metadata"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const receiverPrivateKey = PrivateKey.generateED25519();
        const aliasAccountId = receiverPrivateKey.publicKey.toAccountId(0, 0);

        const airdropTokenResponse = await new TokenAirdropTransaction()
            .addTokenTransfer(ftTokenId, aliasAccountId, INITIAL_SUPPLY)
            .addTokenTransfer(ftTokenId, env.operatorId, -INITIAL_SUPPLY)
            .addNftTransfer(
                nftTokenId,
                serials[0],
                env.operatorId,
                aliasAccountId,
            )
            .execute(env.client);

        await airdropTokenResponse.getReceipt(env.client);

        const aliasBalance = await new AccountBalanceQuery()
            .setAccountId(aliasAccountId)
            .execute(env.client);
        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(aliasBalance.tokens.get(ftTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );
        expect(operatorBalance.tokens.get(ftTokenId).toInt()).to.be.eq(0);

        expect(aliasBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
        expect(operatorBalance.tokens.get(nftTokenId).toInt()).to.be.eq(0);
    });

    it("should airdrop with custom fees", async function () {
        const FEE_AMOUNT = 1;

        const { accountId: receiverId } = await createAccount(
            env.client,
            (transaction) => transaction.setMaxAutomaticTokenAssociations(-1),
        );

        const feeTokenId = await createFungibleToken(
            env.client,
            (transaction) =>
                transaction
                    .setTokenName("fee")
                    .setTokenSymbol("FEE")
                    .setInitialSupply(INITIAL_SUPPLY),
        );

        let customFixedFee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(feeTokenId)
            .setAmount(FEE_AMOUNT)
            .setAllCollectorsAreExempt(true);

        const tokenWithFeeId = await createFungibleToken(
            env.client,
            (transaction) =>
                transaction
                    .setTokenName("tokenWithFee")
                    .setTokenSymbol("TWF")
                    .setInitialSupply(INITIAL_SUPPLY)
                    .setCustomFees([customFixedFee]),
        );

        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction
                    .setTokenName("tokenWithFee")
                    .setTokenSymbol("TWF")
                    .setCustomFees([customFixedFee]),
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const { accountId: senderAccountId, newKey: senderPrivateKey } =
            await createAccount(env.client, (transaction) =>
                transaction
                    .setMaxAutomaticTokenAssociations(-1)
                    .setInitialBalance(new Hbar(10)),
            );

        await (
            await (
                await new TokenAssociateTransaction()
                    .setAccountId(senderAccountId)
                    .setTokenIds([tokenWithFeeId, feeTokenId, nftTokenId])
                    .freezeWith(env.client)
                    .sign(senderPrivateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(
                    tokenWithFeeId,
                    env.operatorId,
                    -INITIAL_SUPPLY,
                )
                .addTokenTransfer(
                    tokenWithFeeId,
                    senderAccountId,
                    INITIAL_SUPPLY,
                )
                .addNftTransfer(
                    nftTokenId,
                    serials[0],
                    env.operatorId,
                    senderAccountId,
                )
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(feeTokenId, env.operatorId, -INITIAL_SUPPLY)
                .addTokenTransfer(feeTokenId, senderAccountId, INITIAL_SUPPLY)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAirdropTransaction()
                    .addTokenTransfer(
                        tokenWithFeeId,
                        receiverId,
                        INITIAL_SUPPLY,
                    )
                    .addTokenTransfer(
                        tokenWithFeeId,
                        senderAccountId,
                        -INITIAL_SUPPLY,
                    )
                    .addNftTransfer(
                        nftTokenId,
                        serials[0],
                        senderAccountId,
                        receiverId,
                    )
                    .freezeWith(env.client)
                    .sign(senderPrivateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        // check if fees are collected
        const DISTINCT_TRANSACTIONS = 2;
        expect(operatorBalance.tokens.get(tokenWithFeeId).toInt()).to.be.eq(0);
        expect(operatorBalance.tokens.get(feeTokenId).toInt()).to.be.eq(
            DISTINCT_TRANSACTIONS,
        );

        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);
        expect(receiverBalance.tokens.get(tokenWithFeeId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );

        const senderBalance = await new AccountBalanceQuery()
            .setAccountId(senderAccountId)
            .execute(env.client);
        expect(senderBalance.tokens.get(tokenWithFeeId).toInt()).to.be.eq(0);
        expect(senderBalance.tokens.get(feeTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY - DISTINCT_TRANSACTIONS * FEE_AMOUNT,
        );
        expect(senderBalance.tokens.get(nftTokenId).toInt()).to.be.eq(0);
        expect(receiverBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
    });

    it("should airdrop with receiver sig set to true", async function () {
        const tokenId = await createFungibleToken(env.client, (transaction) =>
            transaction
                .setTokenName("FFFFFFFFFF")
                .setTokenSymbol("FFF")
                .setInitialSupply(INITIAL_SUPPLY),
        );

        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction.setTokenName("FFFFFFFFFF").setTokenSymbol("FFF"),
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const receiverPrivateKey = PrivateKey.generateECDSA();

        const { accountId: receiverId } = await createAccount(
            env.client,
            (transaction) => {
                transaction
                    .setInitialBalance(new Hbar(10))
                    .setKeyWithoutAlias(receiverPrivateKey.publicKey)
                    .setReceiverSignatureRequired(true)
                    .freezeWith(env.client)
                    .sign(receiverPrivateKey);
            },
        );

        let err = false;
        try {
            const airdropTokenResponse = await new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
                .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
                .addNftTransfer(
                    nftTokenId,
                    serials[0],
                    env.operatorId,
                    receiverId,
                )
                .execute(env.client);

            await airdropTokenResponse.getReceipt(env.client);
        } catch (error) {
            if (error.message.includes("INVALID_SIGNATURE")) {
                err = true;
            }
        }

        expect(err).to.be.eq(false);
    });

    it("should not airdrop with invalid tx body", async function () {
        let err = false;
        const tokenId = new TokenId(1);
        const accountId = new AccountId(1);

        try {
            await (
                await new TokenAirdropTransaction().execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            if (error.message.includes("EMPTY_TOKEN_TRANSFER_BODY")) {
                err = true;
            }
        }
        expect(err).to.be.eq(true);

        err = false;
        try {
            await (
                await new TokenAirdropTransaction()
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addNftTransfer(new NftId(tokenId, 1), accountId, accountId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            if (error.message.includes("INVALID_TRANSACTION_BODY")) {
                err = true;
            }
        }
        expect(err).to.be.eq(true);
    });
});
