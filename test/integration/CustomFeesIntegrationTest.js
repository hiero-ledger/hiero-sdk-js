import {
    AccountId,
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
    KeyList,
    Status,
    TokenAssociateTransaction,
    TokenFeeScheduleUpdateTransaction,
    TokenGrantKycTransaction,
    TokenId,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createAccount,
    createFungibleToken,
    createNonFungibleToken,
} from "./utils/Fixtures.js";

describe("CustomFees", function () {
    it("User can create a fungible token with a fixed custom fee schedule", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setCustomFees([fee]);
        });

        expect(tokenId).to.not.be.null;

        await env.close({ token: tokenId });
    });

    it("User can create a fungible token with a fractional fee schedule", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(10)
            .setMax(0)
            .setMin(0);

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setCustomFees([fee]);
        });

        expect(tokenId).to.not.be.null;

        await env.close({ token: tokenId });
    });

    it("User cannot create a fungible token with a fractional fee schedule that has a denominator zero", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(0)
            .setMax(0)
            .setMin(0);

        let err = false;

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error.toString().includes(Status.FractionDividesByZero);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    it("User cannot create a custom fee schedule over 10 entries", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(0)
            .setMax(0)
            .setMin(0);

        let err = false;

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([
                    fee,
                    fee,
                    fee,
                    fee,
                    fee,
                    fee,
                    fee,
                    fee,
                    fee,
                    fee,
                    fee,
                ]);
            });
        } catch (error) {
            err = error.toString().includes(Status.CustomFeesListTooLong);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    it("User can create custom fixed fee schedule with up to 10 entries", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setCustomFees([
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
            ]);
        });

        expect(tokenId).to.not.be.null;

        await env.close({ token: tokenId });
    });

    it("User can create custom fractional fee schedule with up to 10 entries", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(10)
            .setMax(0)
            .setMin(0);

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setCustomFees([
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
                fee,
            ]);
        });

        expect(tokenId).to.not.be.null;

        await env.close({ token: tokenId });
    });

    it("User has an invalid custom fee collector account ID(s)", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(new AccountId(0xffffffff))
            .setAmount(1);

        let err = false;

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error.toString().includes(Status.InvalidCustomFeeCollector);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("User cannot transfer a custom fee schedule token to a fee collecting account that is not associated with it", async function () {
        const env = await IntegrationTestEnv.new();

        const { accountId } = await createAccount(env.client);

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setCustomFees([fee]);
        });

        fee.setFeeCollectorAccountId(accountId);

        let err = false;

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(tokenId)
                    .setCustomFees([fee])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidCustomFeeCollector);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    it("User cannot update a token fee schedule without having a fee schedule key signing the transaction", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(-1);

        let err = false;

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setFeeScheduleKey(null);
        });

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(tokenId)
                    .setCustomFees([fee])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.TokenHasNoFeeScheduleKey);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close({ token: tokenId });
    });

    it("User cannot create a token with a fractional fee schedule where the maximum amount is less than the minimum amount", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(10)
            .setMax(10)
            .setMin(11);

        let err = false;

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error
                .toString()
                .includes(Status.FractionalFeeMaxAmountLessThanMinAmount);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("User cannot create a token with a custom fractional fee is greater than 1", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(11)
            .setDenominator(10)
            .setMax(0)
            .setMin(0);

        let err = false;

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error
                .toString()
                .includes(Status.InvalidCustomFractionalFeesSum);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("User cannot execute the fee schedule update transaction if there is not fee schedule set already", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        let err = false;

        const tokenId = await createFungibleToken(env.client);

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(tokenId)
                    .setCustomFees([fee])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.CustomScheduleAlreadyHasNoFees);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("User cannot sign the fee schedule update transaction with any key besides the key schedule key", async function () {
        const env = await IntegrationTestEnv.new();

        const { accountId, newKey } = await createAccount(env.client);

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(accountId)
            .setAmount(1);

        let err = false;

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setFeeScheduleKey(newKey.publicKey).sign(newKey);
        });

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(tokenId)
                    .setCustomFees([fee])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidCustomFeeScheduleKey);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    it("User can update a fee schedule using the token fee schedule update transaction and fee schedule key", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        const token = await createFungibleToken(env.client, (transaction) => {
            transaction.setCustomFees([fee]);
        });

        fee.setAmount(2);

        await (
            await new TokenFeeScheduleUpdateTransaction()
                .setTokenId(token)
                .setCustomFees([fee])
                .execute(env.client)
        ).getReceipt(env.client);

        await env.close({ token });
    });

    it("User cannot have an invalid token ID in the custom fee field", async function () {
        const env = await IntegrationTestEnv.new();

        const { accountId } = await createAccount(env.client);

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(accountId)
            .setDenominatingTokenId(new TokenId(0xffffffff))
            .setAmount(1);

        let err = false;

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenIdInCustomFees);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    it("User can create NFT with RoyaltyFees", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomRoyaltyFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(10)
            .setFallbackFee(
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.operatorId)
                    .setAmount(1),
            );

        const tokenId = await createNonFungibleToken(
            env.client,
            (transaction) => {
                transaction.setCustomFees([fee]);
            },
        );

        await env.close({ token: tokenId });
    });

    it("User cannot add RoyaltyFees on FTs", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomRoyaltyFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(10)
            .setFallbackFee(
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.operatorId)
                    .setAmount(1),
            );

        let err = false;

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error
                .toString()
                .includes(
                    Status.CustomRoyaltyFeeOnlyAllowedForNonFungibleUnique,
                );
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    it("cannot create custom fee with un-associated token fee collector", async function () {
        const env = await IntegrationTestEnv.new();

        const { accountId } = await createAccount(env.client);

        const token = await createFungibleToken(env.client);

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(accountId)
            .setDenominatingTokenId(token)
            .setAmount(1);

        let err = false;

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(token)
                    .setCustomFees([fee])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.TokenNotAssociatedToFeeCollector);
        }

        if (!err) {
            throw new Error("token fee schedule update did not error");
        }

        await env.close({ token });
    });

    it("cannot create token with a custom fee without a fee schedule key", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        let err = false;

        const token = await createNonFungibleToken(
            env.client,
            (transaction) => {
                transaction.setFeeScheduleKey(null).setCustomFees([fee]);
            },
        );

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(token)
                    .setCustomFees([fee])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.TokenHasNoFeeScheduleKey);
        }

        if (!err) {
            throw new Error("token fee schedule update did not error");
        }

        await env.close({ token });
    });

    it("cannot create royalty fee with numerator greater than denominator", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomRoyaltyFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(2)
            .setDenominator(1);

        let err = false;

        try {
            await createNonFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error
                .toString()
                .includes(Status.RoyaltyFractionCannotExceedOne);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    // Skipping since the test seems setting an empty custom fee list is no longer an error
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("cannot clear custom fees when no custom fees are present", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        const token = await createNonFungibleToken(env.client);

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(token)
                    .setCustomFees([])
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.CustomScheduleAlreadyHasNoFees);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close({ token });
    });

    it("cannot create custom with denominating token being an NFT", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        const tokenId = await createNonFungibleToken(env.client);

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(tokenId)
            .setAmount(1);

        try {
            await createFungibleToken(env.client, (transaction) => {
                transaction.setCustomFees([fee]);
            });
        } catch (error) {
            err = error
                .toString()
                .includes(Status.CustomFeeDenominationMustBeFungibleCommon);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close({ token: tokenId });
    });

    // Cannot reproduce `CustomFeeChargingExceededMaxRecursionDepth`
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("cannot have recursive custom fees", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        const { accountId: accountId1, newKey: privateKey1 } =
            await createAccount(env.client);

        const { accountId: accountId2 } = await createAccount(env.client);

        const tokenId1 = await createNonFungibleToken(env.client);

        const fee2 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(tokenId1)
            .setAmount(1);

        const tokenId2 = await createNonFungibleToken(
            env.client,
            (transaction) => {
                transaction.setCustomFees([fee2]);
            },
        );

        const fee1 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(tokenId2)
            .setAmount(1);

        await (
            await new TokenFeeScheduleUpdateTransaction()
                .setTokenId(tokenId1)
                .setCustomFees([fee1])
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([tokenId1])
                    .setAccountId(accountId1)
                    .freezeWith(env.client)
                    .sign(privateKey1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(tokenId1)
                    .setAccountId(accountId1)
                    .freezeWith(env.client)
                    .sign(privateKey1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([tokenId1])
                    .setAccountId(accountId2)
                    .freezeWith(env.client)
                    .sign(privateKey1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(tokenId1)
                    .setAccountId(accountId2)
                    .freezeWith(env.client)
                    .sign(privateKey1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(tokenId1, env.operatorId, -10)
                .addTokenTransfer(tokenId1, accountId1, 10)
                .execute(env.client)
        ).getReceipt(env.client);

        try {
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId1, accountId1, -1)
                    .addTokenTransfer(tokenId1, accountId2, 1)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.CustomFeeChargingExceededMaxRecursionDepth);
        }

        if (!err) {
            throw new Error("token transfer did not error");
        }

        await env.close({ token: [tokenId1, tokenId2] });
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("cannot have more than 20 balance changes in a single transfer", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        const { accountId: accountId1, privateKey: key1 } = await createAccount(
            env.client,
        );

        const { accountId: accountId2 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const { accountId: accountId3 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const { accountId: accountId4 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const { accountId: accountId5 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const { accountId: accountId6 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const { accountId: accountId7 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const { accountId: accountId8 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const { accountId: accountId9 } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setKeyWithoutAlias(key1);
            },
        );

        const tokenId1 = await createNonFungibleToken(env.client);

        const fee2 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(tokenId1)
            .setAmount(1);

        const tokenId2 = await createFungibleToken(
            env.client,
            (transaction) => {
                transaction.setCustomFees([fee2]);
            },
        );

        const fee1 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(tokenId2)
            .setAmount(1);

        await (
            await new TokenFeeScheduleUpdateTransaction()
                .setTokenId(tokenId1)
                .setCustomFees([fee1])
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([tokenId1])
                    .setAccountId(accountId1)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(tokenId1)
                    .setAccountId(accountId1)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([tokenId1])
                    .setAccountId(accountId2)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(tokenId1)
                    .setAccountId(accountId2)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client)
        ).getReceipt(env.client);

        try {
            await (
                await new TransferTransaction()
                    .addHbarTransfer(env.operatorId, -14)
                    .addHbarTransfer(accountId1, 1)
                    .addHbarTransfer(accountId2, 1)
                    .addHbarTransfer(accountId3, 1)
                    .addHbarTransfer(accountId4, 1)
                    .addHbarTransfer(accountId5, 1)
                    .addHbarTransfer(accountId6, 1)
                    .addHbarTransfer(accountId7, 1)
                    .addHbarTransfer(accountId8, 1)
                    .addHbarTransfer(accountId9, 1)
                    .addHbarTransfer("0.0.3", 1)
                    .addHbarTransfer("0.0.4", 1)
                    .addHbarTransfer("0.0.5", 1)
                    .addHbarTransfer("0.0.6", 1)
                    .addHbarTransfer("0.0.7", 1)
                    .addTokenTransfer(tokenId1, env.operatorId, -2)
                    .addTokenTransfer(tokenId1, accountId1, 1)
                    .addTokenTransfer(tokenId1, accountId2, 1)
                    .addTokenTransfer(tokenId2, env.operatorId, -2)
                    .addTokenTransfer(tokenId2, accountId1, 1)
                    .addTokenTransfer(tokenId2, accountId2, 1)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            console.log(error);
            err = error
                .toString()
                .includes(Status.CustomFeeChargingExceededMaxAccountAmounts);
        }

        if (!err) {
            throw new Error("token transfer did not error");
        }

        await env.close({ token: [tokenId1, tokenId2] });
    });

    it("cannot set invalid schedule key", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        try {
            await createNonFungibleToken(env.client, (transaction) => {
                transaction.setFeeScheduleKey(new KeyList(KeyList.of(), 1));
            });
        } catch (error) {
            err = error.toString().includes(Status.InvalidCustomFeeScheduleKey);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });
});
