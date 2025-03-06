import { expect } from "chai";
import {
    AccountAllowanceApproveTransaction,
    AccountBalanceQuery,
    AccountUpdateTransaction,
    Hbar,
    NftId,
    PrivateKey,
    TokenFreezeTransaction,
    TokenMintTransaction,
    TokenPauseTransaction,
    TokenRejectTransaction,
    TransactionId,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createAccount,
    createFungibleToken,
    createNonFungibleToken,
} from "./utils/Fixtures.js";

describe("TokenRejectIntegrationTest", function () {
    let env, tokenId, receiverId, receiverPrivateKey;
    const INITIAL_SUPPLY = 1000000;

    describe("Fungible Tokens", function () {
        beforeEach(async function () {
            env = await IntegrationTestEnv.new();

            // Create token with required keys
            tokenId = await createFungibleToken(env.client, (transaction) => {
                transaction
                    .setDecimals(3)
                    .setInitialSupply(INITIAL_SUPPLY)
                    .setPauseKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey);
            });

            // Create receiver account
            const { accountId, newKey } = await createAccount(
                env.client,
                (transaction) => {
                    transaction
                        .setInitialBalance(new Hbar(1))
                        .setMaxAutomaticTokenAssociations(-1);
                },
            );
            receiverId = accountId;
            receiverPrivateKey = newKey;
        });

        it("should execute TokenReject Tx", async function () {
            // Create another token
            const tokenId2 = await createFungibleToken(
                env.client,
                (transaction) => {
                    transaction
                        .setTokenName("ffff2")
                        .setTokenSymbol("F2")
                        .setDecimals(3)
                        .setInitialSupply(INITIAL_SUPPLY);
                },
            );

            // Transfer tokens of both types to receiver
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .addTokenTransfer(tokenId2, env.operatorId, -1)
                    .addTokenTransfer(tokenId2, receiverId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Reject tokens
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
                .get(tokenId2)
                .toInt();

            expect(tokenBalanceReceiver).to.be.equal(0);
            expect(tokenBalanceReceiver2).to.be.equal(0);

            expect(tokenBalanceTreasury).to.be.equal(INITIAL_SUPPLY);
            expect(tokenBalanceTreasury2).to.be.equal(INITIAL_SUPPLY);
        });

        it("should return token back when receiver has receiverSigRequired is true", async function () {
            // Update operator account to require receiver signature
            await new AccountUpdateTransaction()
                .setAccountId(env.operatorId)
                .setReceiverSignatureRequired(true)
                .execute(env.client);

            // Transfer token to receiver
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Reject token
            await (
                await (
                    await new TokenRejectTransaction()
                        .addTokenId(tokenId)
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Check treasury balance
            const tokenBalanceTreasuryQuery = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            const tokenBalanceTreasury = tokenBalanceTreasuryQuery.tokens
                .get(tokenId)
                .toInt();
            expect(tokenBalanceTreasury).to.be.equal(INITIAL_SUPPLY);

            // Check receiver balance
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
            // Create spender account
            const { accountId: spenderAccountId, newKey: spenderPrivateKey } =
                await createAccount(env.client, (transaction) => {
                    transaction
                        .setMaxAutomaticTokenAssociations(-1)
                        .setInitialBalance(new Hbar(10));
                });

            // Transfer token to receiver
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Approve allowance for spender
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

            // Reject token
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

            // Transfer token back to receiver for allowance test
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.operatorId, -1)
                    .addTokenTransfer(tokenId, receiverId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Test that allowance still works
            const transactionId = TransactionId.generate(spenderAccountId);
            await (
                await (
                    await new TransferTransaction()
                        .addApprovedTokenTransfer(tokenId, receiverId, -1)
                        .addTokenTransfer(tokenId, spenderAccountId, 1)
                        .setTransactionId(transactionId)
                        .freezeWith(env.client)
                        .sign(spenderPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify final balances
            const tokenBalanceReceiverPost = await new AccountBalanceQuery()
                .setAccountId(receiverId)
                .execute(env.client);

            const tokenBalanceSpenderPost = await new AccountBalanceQuery()
                .setAccountId(spenderAccountId)
                .execute(env.client);

            expect(tokenBalanceReceiverPost.tokens.get(tokenId).toInt()).to.eq(
                0,
            );
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
                // Create account with no balance
                const {
                    accountId: emptyBalanceUserId,
                    newKey: emptyBalanceUserKey,
                } = await createAccount(env.client, (transaction) => {
                    transaction
                        .setInitialBalance(null)
                        .setMaxAutomaticTokenAssociations(-1);
                });
                const transactionId =
                    TransactionId.generate(emptyBalanceUserId);
                try {
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .setOwnerId(emptyBalanceUserId)
                                .addTokenId(tokenId)
                                .setTransactionId(transactionId)
                                .freezeWith(env.client)
                                .sign(emptyBalanceUserKey)
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
                    const tokenId = await createFungibleToken(
                        env.client,
                        (transaction) => {
                            transaction
                                .setTokenMemo(null)

                                .setTokenName("ffff")
                                .setTokenSymbol("F")
                                .setInitialSupply(1000)
                                .setPauseKey(null)
                                .setWipeKey(null)
                                .setFeeScheduleKey(null)
                                .setMetadataKey(null)
                                .setFreezeKey(null);
                        },
                    );
                    tokenIds.push(tokenId);
                }

                try {
                    await (
                        await new TokenRejectTransaction()
                            .setTokenIds(tokenIds)
                            .execute(env.client)
                    ).getReceipt(env.client);
                } catch (err) {
                    console.log(err.message);
                    expect(err.message).to.include(
                        "TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED",
                    );
                }
            });
        });
    });

    describe("Non-Fungible Tokens", function () {
        let tokenId, receiverId, receiverPrivateKey, nftId;

        beforeEach(async function () {
            env = await IntegrationTestEnv.new();

            // Create NFT collection
            tokenId = await createNonFungibleToken(
                env.client,
                (transaction) => {
                    transaction
                        .setPauseKey(env.operatorKey)
                        .setFreezeKey(env.operatorKey);
                },
            );

            // Create receiver account
            const { accountId, newKey } = await createAccount(
                env.client,
                (transaction) => {
                    transaction.setMaxAutomaticTokenAssociations(-1);
                },
            );
            receiverId = accountId;
            receiverPrivateKey = newKey;

            // Mint first NFT
            nftId = new NftId(tokenId, 1);
            await (
                await new TokenMintTransaction()
                    .setTokenId(tokenId)
                    .setMetadata(Buffer.from("-"))
                    .execute(env.client)
            ).getReceipt(env.client);
        });

        it("should execute TokenReject Tx", async function () {
            // Create second NFT collection and mint token
            const tokenId2 = await createNonFungibleToken(
                env.client,
                (transaction) => {
                    transaction.setTokenName("ffff2").setTokenSymbol("F2");
                },
            );

            const nftId2 = new NftId(tokenId2, 1);
            await (
                await new TokenMintTransaction()
                    .setTokenId(tokenId2)
                    .setMetadata(Buffer.from("-"))
                    .execute(env.client)
            ).getReceipt(env.client);

            // Transfer NFTs to receiver
            await (
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .addNftTransfer(nftId2, env.operatorId, receiverId)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Reject NFTs
            await (
                await (
                    await new TokenRejectTransaction()
                        .setNftIds([nftId, nftId2])
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Check balances
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
                .get(tokenId2)
                .toInt();

            expect(tokenBalanceTreasury).to.be.equal(1);
            expect(tokenBalanceTreasury2).to.be.equal(1);

            expect(tokenBalanceReceiver).to.be.equal(0);
            expect(tokenBalanceReceiver2).to.be.equal(0);
        });

        it("should return tokens back to treasury receiverSigRequired is true", async function () {
            // Update operator account to require receiver signature
            await new AccountUpdateTransaction()
                .setAccountId(env.operatorId)
                .setReceiverSignatureRequired(true)
                .execute(env.client);

            // Transfer NFT to receiver
            await (
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Reject NFT
            await (
                await (
                    await new TokenRejectTransaction()
                        .addNftId(nftId)
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Check treasury balance
            const tokenBalanceTreasuryQuery = await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            const tokenBalanceTreasury = tokenBalanceTreasuryQuery.tokens
                .get(tokenId)
                .toInt();
            expect(tokenBalanceTreasury).to.be.equal(1);

            // Check receiver balance
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
            // Create spender account
            const { accountId: spenderAccountId, newKey: spenderPrivateKey } =
                await createAccount(env.client, (transaction) => {
                    transaction
                        .setMaxAutomaticTokenAssociations(-1)
                        .setInitialBalance(new Hbar(10));
                });

            // Transfer NFT to receiver
            await (
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Approve NFT allowance
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

            // Reject NFT
            await (
                await (
                    await new TokenRejectTransaction()
                        .addNftId(nftId)
                        .setOwnerId(receiverId)
                        .freezeWith(env.client)
                        .sign(receiverPrivateKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Try to transfer NFT using allowance - should fail
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
                            .sign(spenderPrivateKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
                throw new Error("Transfer should have failed");
            } catch (err) {
                expect(err.message).to.include(
                    "SPENDER_DOES_NOT_HAVE_ALLOWANCE",
                );
            }
        });

        describe("should throw an error", function () {
            it("when paused NFT", async function () {
                // Pause token
                await (
                    await new TokenPauseTransaction()
                        .setTokenId(tokenId)
                        .execute(env.client)
                ).getReceipt(env.client);

                // Transfer NFT to receiver
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client);

                // Try to reject paused NFT
                const tokenRejectTx = await new TokenRejectTransaction()
                    .addTokenId(tokenId)
                    .setOwnerId(receiverId)
                    .freezeWith(env.client)
                    .sign(receiverPrivateKey);

                try {
                    await (
                        await tokenRejectTx.execute(env.client)
                    ).getReceipt(env.client);
                    throw new Error("Should have failed");
                } catch (err) {
                    expect(err.message).to.include("TOKEN_IS_PAUSED");
                }
            });

            it("when NFT is frozen", async function () {
                // Transfer NFT to receiver
                await new TransferTransaction()
                    .addNftTransfer(nftId, env.operatorId, receiverId)
                    .execute(env.client);

                // Freeze token
                await (
                    await new TokenFreezeTransaction()
                        .setTokenId(tokenId)
                        .setAccountId(receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                // Try to reject frozen NFT
                try {
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .addTokenId(tokenId)
                                .setOwnerId(receiverId)
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                    throw new Error("Should have failed");
                } catch (err) {
                    expect(err.message).to.include("ACCOUNT_FROZEN_FOR_TOKEN");
                }
            });

            it("when using Fungible Token id when referencing NFTs", async function () {
                // Transfer NFT to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                // Try to reject NFT using addTokenId
                try {
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .setOwnerId(receiverId)
                                .addTokenId(tokenId)
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                    throw new Error("Should have failed");
                } catch (err) {
                    expect(err.message).to.include(
                        "ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON",
                    );
                }

                // Try to reject NFT using setTokenIds
                try {
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .setOwnerId(receiverId)
                                .setTokenIds([tokenId])
                                .freezeWith(env.client)
                                .sign(receiverPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                    throw new Error("Should have failed");
                } catch (err) {
                    expect(err.message).to.include(
                        "ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON",
                    );
                }
            });

            it("when there's a duplicated token reference", async function () {
                // Transfer NFT to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                // Try to reject NFT with duplicate reference
                try {
                    await new TokenRejectTransaction()
                        .setNftIds([nftId, nftId])
                        .execute(env.client);
                    throw new Error("Should have failed");
                } catch (err) {
                    expect(err.message).to.include("TOKEN_REFERENCE_REPEATED");
                }
            });

            it("when user does not have balance", async function () {
                // Transfer NFT to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                // Try to reject NFT without balance
                const transactionId = TransactionId.generate(receiverId);
                try {
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
                // Create wrong signature
                const wrongSignature = PrivateKey.generateED25519();

                // Try to reject token with wrong signature
                try {
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .addTokenId(tokenId)
                                .setOwnerId(receiverId)
                                .freezeWith(env.client)
                                .sign(wrongSignature)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                    throw new Error("Should have failed");
                } catch (err) {
                    expect(err.message).to.include("INVALID_SIGNATURE");
                }
            });

            it("when wrong owner id", async function () {
                // Create wrong owner account
                const {
                    accountId: wrongOwnerId,
                    newKey: wrongOwnerPrivateKey,
                } = await createAccount(env.client, (transaction) => {
                    transaction.setMaxAutomaticTokenAssociations(-1);
                });

                // Transfer NFT to receiver
                await (
                    await new TransferTransaction()
                        .addNftTransfer(nftId, env.operatorId, receiverId)
                        .execute(env.client)
                ).getReceipt(env.client);

                // Try to reject token with wrong owner
                try {
                    await (
                        await (
                            await new TokenRejectTransaction()
                                .addNftId(nftId)
                                .setOwnerId(wrongOwnerId)
                                .freezeWith(env.client)
                                .sign(wrongOwnerPrivateKey)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                    throw new Error("Should have failed");
                } catch (err) {
                    expect(err.message).to.include("INVALID_OWNER_ID");
                }
            });
        });
    });

    describe("Other", function () {
        beforeEach(async function () {
            env = await IntegrationTestEnv.new();

            // Create fungible token
            tokenId = await createFungibleToken(env.client, (transaction) => {
                transaction
                    .setDecimals(3)
                    .setInitialSupply(1000000)
                    .setPauseKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey);
            });

            // Create receiver account
            const { accountId, newKey } = await createAccount(
                env.client,
                (transaction) => {
                    transaction
                        .setInitialBalance(new Hbar(1))
                        .setMaxAutomaticTokenAssociations(-1);
                },
            );
            receiverId = accountId;
            receiverPrivateKey = newKey;
        });

        it("should execute TokenReject tx with mixed type of tokens in one tx", async function () {
            // Create NFT collection and mint token
            const nftId = await createNonFungibleToken(env.client);
            const nftSerialId = new NftId(nftId, 1);
            await (
                await new TokenMintTransaction()
                    .setTokenId(nftId)
                    .setMetadata(Buffer.from("-"))
                    .execute(env.client)
            ).getReceipt(env.client);

            // Create fungible token
            const ftId = await createFungibleToken(
                env.client,
                (transaction) => {
                    transaction
                        .setTokenName("ffff2")
                        .setTokenSymbol("F2")
                        .setDecimals(3)
                        .setInitialSupply(1000000);
                },
            );

            // Transfer both tokens to receiver
            const tokenTransferResponse = await new TransferTransaction()
                .addTokenTransfer(ftId, env.operatorId, -1)
                .addTokenTransfer(ftId, receiverId, 1)
                .addNftTransfer(nftSerialId, env.operatorId, receiverId)
                .execute(env.client);

            await tokenTransferResponse.getReceipt(env.client);

            // Reject both tokens
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

            // Check token balances
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

            // Check treasury balances
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
                throw new Error("Should have failed");
            } catch (err) {
                expect(err.message).to.include("EMPTY_TOKEN_REFERENCE_LIST");
            }
        });
    });

    after(async function () {
        await env.close();
    });
});
