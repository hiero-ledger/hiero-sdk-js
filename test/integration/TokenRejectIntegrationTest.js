import { expect } from "chai";
import {
    AccountAllowanceApproveTransaction,
    AccountBalanceQuery,
    AccountCreateTransaction,
    AccountUpdateTransaction,
    Hbar,
    NftId,
    PrivateKey,
    TokenCreateTransaction,
    TokenFreezeTransaction,
    TokenMintTransaction,
    TokenPauseTransaction,
    TokenRejectTransaction,
    TokenType,
    TransactionId,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TokenRejectIntegrationTest", function () {
    let env, tokenId, receiverId, receiverPrivateKey;
    const INITIAL_SUPPLY = 1000000;

    describe("Fungible Tokens", function () {
        beforeEach(async function () {
            env = await IntegrationTestEnv.new();

            // create token
            const tokenCreateResponse = await new TokenCreateTransaction()
                .setTokenName("ffff")
                .setTokenSymbol("F")
                .setDecimals(3)
                .setInitialSupply(INITIAL_SUPPLY)
                .setTreasuryAccountId(env.operatorId)
                .setPauseKey(env.operatorKey)
                .setAdminKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .setFreezeKey(env.operatorKey)
                .execute(env.client);

            tokenId = (await tokenCreateResponse.getReceipt(env.client))
                .tokenId;

            // create receiver account
            receiverPrivateKey = await PrivateKey.generateECDSA();
            const receiverCreateAccount = await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverPrivateKey)
                .setInitialBalance(new Hbar(1))
                .setMaxAutomaticTokenAssociations(-1)
                .execute(env.client);

            receiverId = (await receiverCreateAccount.getReceipt(env.client))
                .accountId;
        });

        it("should execute TokenReject Tx", async function () {
            // create another token
            const tokenCreateResponse2 = await new TokenCreateTransaction()
                .setTokenName("ffff2")
                .setTokenSymbol("F2")
                .setDecimals(3)
                .setInitialSupply(INITIAL_SUPPLY)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .execute(env.client);

            const { tokenId: tokenId2 } = await tokenCreateResponse2.getReceipt(
                env.client,
            );

            // transfer tokens of both types to receiver
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .addTokenTransfer(tokenId2, env.operatorId, -1)
                    .addTokenTransfer(tokenId2, receiverId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            // reject tokens
            await (
                await (
                    await new TokenRejectTransaction()
                        .setTokenIds([tokenId, tokenId2])
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            const tokenBalanceReceiverQuery = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);

            const tokenBalanceReceiver = tokenBalanceReceiverQuery.tokens
                .get(tokenId)
                .toInt();
            const tokenBalanceReceiver2 = tokenBalanceReceiverQuery.tokens
                .get(tokenId2)
                .toInt();

            const tokenBalanceTreasuryQuery = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            const tokenBalanceTreasury = tokenBalanceTreasuryQuery.tokens
                .get(tokenId)
                .toInt();
            const tokenBalanceTreasury2 = tokenBalanceTreasuryQuery.tokens
                .get(tokenId)
                .toInt();

            expect(tokenBalanceReceiver).to.be.equal(0);
            expect(tokenBalanceReceiver2).to.be.equal(0);

            expect(tokenBalanceTreasury).to.be.equal(INITIAL_SUPPLY);
            expect(tokenBalanceTreasury2).to.be.equal(INITIAL_SUPPLY);
        });

        it("should return token back when receiver has receiverSigRequired is true", async function () {
            const TREASURY_TOKENS_AMOUNT = 1000000;

            await new AccountUpdateTransaction()
                .setAccountId(env.operatorId)
                .setReceiverSignatureRequired(true)
                .execute(env.client);

            const transferTransactionResponse = await new TransferTransaction()
                .addTokenTransfer(tokenId, env.operatorId, -1)
                .addTokenTransfer(tokenId, receiverId, 1)
                .execute(env.client);

            await transferTransactionResponse.getReceipt(env.client);

            const tokenRejectResponse = await (
                await new TokenRejectTransaction()
                    .addTokenId(tokenId)
                    .setOwnerId(receiverId)
                    .freezeWith(env.client)
                    .sign(receiverPrivateKey)
            ).execute(env.client);

            await tokenRejectResponse.getReceipt(env.client);

            const tokenBalanceTreasuryQuery = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            const tokenBalanceTreasury = tokenBalanceTreasuryQuery.tokens
                .get(tokenId)
                .toInt();
            expect(tokenBalanceTreasury).to.be.equal(TREASURY_TOKENS_AMOUNT);

            const tokenBalanceReceiverQuery = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);
            const tokenBalanceReceiver = tokenBalanceReceiverQuery.tokens
                .get(tokenId)
                .toInt();
            expect(tokenBalanceReceiver).to.equal(0);
        });

        // temporary disabled until issue re nfts will be resolved on services side
        // eslint-disable-next-line mocha/no-skipped-tests
        it.skip("should not return spender allowance to zero after owner rejects FT", async function () {
            const spenderAccountPrivateKey = PrivateKey.generateED25519();
            const spenderAccountResponse = await new AccountCreateTransaction()
                .setMaxAutomaticTokenAssociations(-1)
                .setInitialBalance(new Hbar(10))
                .setKeyWithoutAlias(spenderAccountPrivateKey)
                .execute(env.client);

            const { accountId: spenderAccountId } =
                await spenderAccountResponse.getReceipt(env.client);

            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            await (
                await (
                    await new AccountAllowanceApproveTransaction()
                        .approveTokenAllowance(
                            tokenId,
                            receiverId,
                            spenderAccountId,
                            10,
                        )
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            await (
                await (
                    await new TokenRejectTransaction()
                        .addTokenId(tokenId)
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Confirm that token reject transaction has returned funds
            const balanceReceiverPre = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);

            const balanceTreasuryPre = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            expect(balanceReceiverPre.tokens.get(tokenId).toInt()).to.eq(0);
            expect(balanceTreasuryPre.tokens.get(tokenId).toInt()).to.eq(
                INITIAL_SUPPLY,
            );

            // after token reject transaction receiver doesn't have balance
            // so we need some tokens back from treasury
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            const transactionId = TransactionId.generate(spenderAccountId);
            await (
                await (
                    await new TransferTransaction()
                        .addApprovedTokenTransfer(tokenId, receiverId, -1)
                        .addTokenTransfer(tokenId, spenderAccountId, 1)
                        .setTransactionId(transactionId)
                        .freezeWith(env.client)
                        .sign(spenderAccountPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Confirm spender has transfered tokens
            const tokenBalanceReceiverPost = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);

            expect(tokenBalanceReceiverPost.tokens.get(tokenId).toInt()).to.eq(
                0,
            );

            const tokenBalanceSpenderPost = await new AccountBalanceQuery()
                .setAccountId(spenderAccountId)
                .execute(env.client);

            expect(tokenBalanceSpenderPost.tokens.get(tokenId).toInt()).to.eq(
                1,
            );
        });

        describe("should throw an error", function () {
            it("when paused FT", async function () {
                await (
                    await new TokenPauseTransaction()
                        .setTokenId(tokenId)
                        .execute(env.client)
                ).getReceipt(env.client);

                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .execute(env.client);

                const tokenRejectTx = await new TokenRejectTransaction()
                    .addTokenId(tokenId)
                    .setOwnerId(receiverId)
                    .freezeWith(env.client)
                    .sign(receiverPrivateKey);

                try {
                    await (
                        await tokenRejectTx.execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include("TOKEN_IS_PAUSED");
                }
            });

            it("when FT is frozen", async function () {
                // transfer token to receiver
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .execute(env.client);

                // freeze token
                await (
                    await new TokenFreezeTransaction()
                        .setTokenId(tokenId)
                        .setAccountId(receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                try {
                    // reject token on frozen account for thsi token
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .addTokenId(tokenId)
                                .setOwnerId(receiverId)
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include("ACCOUNT_FROZEN_FOR_TOKEN");
                }
            });

            it("when there's a duplicated token reference", async function () {
                await (
                    await new TransferTransaction()
                        .addTokenTransfer(tokenId, env.operatorId, -1)
                        .addTokenTransfer(tokenId, receiverId, 1)
                        .execute(env.client)
                ).getReceipt(env.client);

                try {
                    await new TokenRejectTransaction()
                        .setTokenIds([tokenId, tokenId])
                        .execute(env.client);
                } catch (err) {
                    expect(err.message).to.include("TOKEN_REFERENCE_REPEATED");
                }
            });

            it("when user does not have balance", async function () {
                // create receiver account
                const receiverPrivateKey = PrivateKey.generateED25519();
                const { accountId: emptyBalanceUserId } = await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(receiverPrivateKey)
                        .setMaxAutomaticTokenAssociations(-1)
                        .execute(env.client)
                ).getReceipt(env.client);

                await (
                    await new TransferTransaction()
                        .addTokenTransfer(tokenId, env.operatorId, -1000)
                        .addTokenTransfer(tokenId, receiverId, 1000)
                        .execute(env.client)
                ).getReceipt(env.client);

                const transactionId =
                    await TransactionId.generate(emptyBalanceUserId);
                try {
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .setOwnerId(emptyBalanceUserId)
                                .addTokenId(tokenId)
                                .setTransactionId(transactionId)
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include(
                        "INSUFFICIENT_PAYER_BALANCE",
                    );
                }
            });

            it("when trasury account rejects token", async function () {
                try {
                    await (
                        await new TokenRejectTransaction()
                            .addTokenId(tokenId)
                            .execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include("ACCOUNT_IS_TREASURY");
                }
            });

            it("when more than 11 tokens in token list for RejectToken transaction", async function () {
                const tokenIds = [];

                for (let i = 0; i < 11; i++) {
                    const { tokenId } = await (
                        await new TokenCreateTransaction()
                            .setTokenName("ffff")
                            .setTokenSymbol("F")
                            .setTokenType(TokenType.FungibleCommon)
                            .setInitialSupply(1000)
                            .setTreasuryAccountId(env.operatorId)
                            .setAdminKey(env.operatorKey)
                            .setSupplyKey(env.operatorKey)
                            .execute(env.client)
                    ).getReceipt(env.client);
                    tokenIds.push(tokenId);
                }
                try {
                    await (
                        await new TokenRejectTransaction()
                            .setTokenIds(tokenIds)
                            .execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include(
                        "TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED",
                    );
                }
            });
        });
    });

    describe("Non-Fungible Tokens", function () {
        let tokenId, receiverPrivateKey, receiverId, nftId;

        beforeEach(async function () {
            env = await IntegrationTestEnv.new();
            const tokenCreateResponse = await new TokenCreateTransaction()
                .setTokenType(TokenType.NonFungibleUnique)
                .setTokenName("ffff")
                .setTokenSymbol("F")
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .setPauseKey(env.operatorKey)
                .setFreezeKey(env.operatorKey)
                .execute(env.client);

            tokenId = (await tokenCreateResponse.getReceipt(env.client))
                .tokenId;

            receiverPrivateKey = await PrivateKey.generateECDSA();
            receiverId = (
                await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(receiverPrivateKey)
                        .setMaxAutomaticTokenAssociations(-1)
                        .execute(env.client)
                ).getReceipt(env.client)
            ).accountId;

            nftId = new NftId(tokenId, 1);
            await (
                await new TokenMintTransaction()
                    .setTokenId(tokenId)
                    .setMetadata(Buffer.from("-"))
                    .execute(env.client)
            ).getReceipt(env.client);
        });

        it("should execute TokenReject Tx", async function () {
            const tokenCreateResponse2 = await new TokenCreateTransaction()
                .setTokenType(TokenType.NonFungibleUnique)
                .setTokenName("ffff2")
                .setTokenSymbol("F2")
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .execute(env.client);

            const { tokenId: tokenId2 } = await tokenCreateResponse2.getReceipt(
                env.client,
            );

            const nftId2 = new NftId(tokenId2, 1);
            await (
                await new TokenMintTransaction()
                    .setTokenId(tokenId2)
                    .setMetadata(Buffer.from("-"))
                    .execute(env.client)
            ).getReceipt(env.client);

            await (
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .addNftTransfer(nftId2, env.operatorId, receiverId)
                    .execute(env.client)
            ).getReceipt(env.client);

            await (
                await (
                    await await new TokenRejectTransaction()
                        .setNftIds([nftId, nftId2])
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            const tokenBalanceReceiverQuery = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);

            const tokenBalanceTreasuryQuery = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            const tokenBalanceReceiver = tokenBalanceReceiverQuery.tokens
                .get(tokenId)
                .toInt();
            const tokenBalanceReceiver2 = tokenBalanceReceiverQuery.tokens
                .get(tokenId2)
                .toInt();

            const tokenBalanceTreasury = tokenBalanceTreasuryQuery.tokens
                .get(tokenId)
                .toInt();
            const tokenBalanceTreasury2 = tokenBalanceTreasuryQuery.tokens
                .get(tokenId2)
                .toInt();

            expect(tokenBalanceTreasury).to.be.equal(1);
            expect(tokenBalanceTreasury2).to.be.equal(1);

            expect(tokenBalanceReceiver).to.be.equal(0);
            expect(tokenBalanceReceiver2).to.be.equal(0);
        });

        it("should return tokens back to treasury receiverSigRequired is true", async function () {
            await new AccountUpdateTransaction()
                .setAccountId(env.operatorId)
                .setReceiverSignatureRequired(true)
                .execute(env.client);

            const transferTransactionResponse = await new TransferTransaction()
                .addNftTransfer(nftId, env.operatorId, receiverId)
                .freezeWith(env.client)
                .execute(env.client);

            await transferTransactionResponse.getReceipt(env.client);

            const tokenRejectResponse = await (
                await new TokenRejectTransaction()
                    .addNftId(nftId)
                    .setOwnerId(receiverId)
                    .freezeWith(env.client)
                    .sign(receiverPrivateKey)
            ).execute(env.client);

            await tokenRejectResponse.getReceipt(env.client);

            const tokenBalanceTreasuryQuery = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            const tokenBalanceTreasury = tokenBalanceTreasuryQuery.tokens
                .get(tokenId)
                .toInt();
            expect(tokenBalanceTreasury).to.be.equal(1);

            const tokenBalanceReceiverQuery = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);

            const tokenBalanceReceiver = tokenBalanceReceiverQuery.tokens
                .get(tokenId)
                .toInt();
            expect(tokenBalanceReceiver).to.equal(0);
        });

        // temporary disabled until issue re nfts will be resolved on services side
        // eslint-disable-next-line mocha/no-skipped-tests
        it.skip("should return spender allowance to 0 after owner rejects NFT", async function () {
            // create spender account
            const spenderAccountPrivateKey = PrivateKey.generateED25519();
            const spenderAccountResponse = await new AccountCreateTransaction()
                .setMaxAutomaticTokenAssociations(-1)
                .setInitialBalance(new Hbar(10))
                .setKeyWithoutAlias(spenderAccountPrivateKey)
                .execute(env.client);

            const { accountId: spenderAccountId } =
                await spenderAccountResponse.getReceipt(env.client);

            // transfer nft to receiver
            await (
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client)
            ).getReceipt(env.client);

            // approve nft allowance
            await (
                await (
                    await new AccountAllowanceApproveTransaction()
                        .approveTokenNftAllowance(
                            nftId,
                            receiverId,
                            spenderAccountId,
                        )
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // reject nft
            await (
                await (
                    await new TokenRejectTransaction()
                        .addNftId(nftId)
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // transfer nft from receiver to spender using allowance
            try {
                const transactionId = TransactionId.generate(spenderAccountId);
                await (
                    await (
                        await new TransferTransaction()
                            .addApprovedNftTransfer(
                                nftId,
                                receiverId,
                                spenderAccountId,
                            )
                            .setTransactionId(transactionId)
                            .freezeWith(env.client)
                            .sign(spenderAccountPrivateKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (err) {
                expect(err.message).to.include(
                    "SPENDER_DOES_NOT_HAVE_ALLOWANCE",
                );
            }
        });

        describe("should throw an error", function () {
            it("when paused NFT", async function () {
                await (
                    await new TokenPauseTransaction()
                        .setTokenId(tokenId)
                        .execute(env.client)
                ).getReceipt(env.client);

                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client);
                const tokenRejectTx = await new TokenRejectTransaction()
                    .addTokenId(tokenId)
                    .setOwnerId(receiverId)
                    .freezeWith(env.client)
                    .sign(receiverPrivateKey);

                try {
                    await (
                        await tokenRejectTx.execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include("TOKEN_IS_PAUSED");
                }
            });

            it("when NFT is frozen", async function () {
                // transfer token to receiver
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client);

                // freeze token
                await (
                    await new TokenFreezeTransaction()
                        .setTokenId(tokenId)
                        .setAccountId(receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                try {
                    // reject token on frozen account for thsi token
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .addTokenId(tokenId)
                                .setOwnerId(receiverId)
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include("ACCOUNT_FROZEN_FOR_TOKEN");
                }
            });

            it("when using Fungible Token id when referencing NFTs", async function () {
                // transfer to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                try {
                    // reject nft using addTokenId
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .setOwnerId(receiverId)
                                .addTokenId(tokenId)
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include(
                        "ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON",
                    );
                }

                try {
                    // reject nft using setTokenIds
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .setOwnerId(receiverId)
                                .setTokenIds([tokenId])
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include(
                        "ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON",
                    );
                }
            });

            it("when there's a duplicated token reference", async function () {
                // transfer nft to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                // reject nft
                try {
                    await new TokenRejectTransaction()
                        .setNftIds([nftId, nftId])
                        .execute(env.client);
                } catch (err) {
                    expect(err.message).to.include("TOKEN_REFERENCE_REPEATED");
                }
            });

            it("when user does not have balance", async function () {
                // transfer nft to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);
                const transactionId = await TransactionId.generate(receiverId);

                try {
                    // reject nft
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .setOwnerId(receiverId)
                                .addNftId(nftId)
                                .setTransactionId(transactionId)
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include(
                        "INSUFFICIENT_PAYER_BALANCE",
                    );
                }
            });

            it("when wrong signature of owner", async function () {
                // transfer token to receiver
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1000)
                    .addTokenTransfer(tokenId, receiverId, 1000);

                try {
                    // reject token with wrong signature
                    const WRONG_SIGNATURE = PrivateKey.generateED25519();
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .addTokenId(tokenId)
                                .setOwnerId(receiverId)
                                .freezeWith(env.client)
                                .sign(WRONG_SIGNATURE)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include("INVALID_SIGNATURE");
                }
            });

            it("when wrong owner id", async function () {
                // generate wrong owner account
                const wrongOwnerPrivateKey = PrivateKey.generateED25519();
                const { accountId: wrongOwnerId } = await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(wrongOwnerPrivateKey)
                        .setMaxAutomaticTokenAssociations(-1)
                        .execute(env.client)
                ).getReceipt(env.client);

                // transfer token to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                try {
                    // reject token with wrong token id
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .addNftId(nftId)
                                .setOwnerId(wrongOwnerId)
                                .freezeWith(env.client)
                                .sign(wrongOwnerPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    expect(err.message).to.include("INVALID_OWNER_ID");
                }
            });
        });
    });

    describe("Other", function () {
        beforeEach(async function () {
            env = await IntegrationTestEnv.new();

            // create token
            const tokenCreateResponse = await new TokenCreateTransaction()
                .setTokenName("ffff")
                .setTokenSymbol("F")
                .setDecimals(3)
                .setInitialSupply(1000000)
                .setTreasuryAccountId(env.operatorId)
                .setPauseKey(env.operatorKey)
                .setAdminKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .execute(env.client);

            tokenId = (await tokenCreateResponse.getReceipt(env.client))
                .tokenId;

            // create receiver account
            receiverPrivateKey = await PrivateKey.generateECDSA();
            const receiverCreateAccountResponse =
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(receiverPrivateKey)
                    .setInitialBalance(new Hbar(1))
                    .setMaxAutomaticTokenAssociations(-1)
                    .execute(env.client);

            receiverId = (
                await receiverCreateAccountResponse.getReceipt(env.client)
            ).accountId;
        });

        it("should execute TokenReject tx with mixed type of tokens in one tx", async function () {
            // create NFT collection
            const tokenCreateResponse = await new TokenCreateTransaction()
                .setTokenType(TokenType.NonFungibleUnique)
                .setTokenName("ffff")
                .setTokenSymbol("F")
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .execute(env.client);
            const { tokenId: nftId } = await tokenCreateResponse.getReceipt(
                env.client,
            );
            const nftSerialId = new NftId(nftId, 1);

            // create FT
            const tokenCreateResponse2 = await new TokenCreateTransaction()
                .setTokenName("ffff2")
                .setTokenSymbol("F2")
                .setDecimals(3)
                .setInitialSupply(1000000)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(env.operatorKey)
                .setSupplyKey(env.operatorKey)
                .execute(env.client);
            const { tokenId: ftId } = await tokenCreateResponse2.getReceipt(
                env.client,
            );

            await (
                await new TokenMintTransaction()
                    .setTokenId(nftId)
                    .setMetadata(Buffer.from("-"))
                    .execute(env.client)
            ).getReceipt(env.client);

            const tokenTransferResponse = await new TransferTransaction()
                .addTokenTransfer(ftId, env.operatorId, -1)
                .addTokenTransfer(ftId, receiverId, 1)
                .addNftTransfer(nftSerialId, env.operatorId, receiverId)
                .execute(env.client);

            await tokenTransferResponse.getReceipt(env.client);

            // reject tokens
            await (
                await (
                    await new TokenRejectTransaction()
                        .addTokenId(ftId)
                        .addNftId(nftSerialId)
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // check token balance of receiver
            const tokenBalanceReceiverQuery = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);

            const tokenBalanceFTReceiver = tokenBalanceReceiverQuery.tokens
                .get(ftId)
                .toInt();
            const tokenBalanceNFTReceiver = tokenBalanceReceiverQuery.tokens
                .get(nftId)
                .toInt();

            expect(tokenBalanceFTReceiver).to.be.equal(0);
            expect(tokenBalanceNFTReceiver).to.be.equal(0);

            // check token balance of treasury
            const tokenBalanceTreasuryQuery = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            const tokenBalanceTreasury = tokenBalanceTreasuryQuery.tokens
                .get(ftId)
                .toInt();
            const tokenBalance2Treasury = tokenBalanceTreasuryQuery.tokens
                .get(nftId)
                .toInt();

            expect(tokenBalanceTreasury).to.be.equal(1000000);
            expect(tokenBalance2Treasury).to.be.equal(1);
        });

        it("should throw if RejectToken transaction has empty token id list", async function () {
            try {
                await (
                    await new TokenRejectTransaction().execute(env.client)
                ).getReceipt(env.client);
            } catch (err) {
                expect(err.message).to.include("EMPTY_TOKEN_REFERENCE_LIST");
            }
        });
    });

    after(async function () {
        await env.close();
    });
});
