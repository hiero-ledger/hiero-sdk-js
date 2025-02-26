import {
    AccountCreateTransaction,
    AccountId,
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
    Hbar,
    KeyList,
    PrivateKey,
    Status,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenFeeScheduleUpdateTransaction,
    TokenGrantKycTransaction,
    TokenId,
    TokenType,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("CustomFees", function () {
    it("User can create a fungible token with a fixed custom fee schedule", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        expect(token).to.not.be.null;

        await env.close({ token });
    });

    it("User can create a fungible token with a fractional fee schedule", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(10)
            .setMax(0)
            .setMin(0);

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        expect(token).to.not.be.null;

        await env.close({ token });
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
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
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
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([
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
                    ])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
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

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([
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
                    ])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        expect(token).to.not.be.null;

        await env.close({ token });
    });

    it("User can create custom fractional fee schedule with up to 10 entries", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFractionalFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setNumerator(1)
            .setDenominator(10)
            .setMax(0)
            .setMin(0);

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([
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
                    ])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        expect(token).to.not.be.null;

        await env.close();
    });

    it("User has an invalid custom fee collector account ID(s)", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(new AccountId(0xffffffff))
            .setAmount(1);

        let err = false;

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
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

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("User cannot transfer a custom fee schedule token to a fee collecting account that is not associated with it", async function () {
        const env = await IntegrationTestEnv.new();

        const key = PrivateKey.generateED25519();

        const account = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .setInitialBalance(new Hbar(2))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        fee.setFeeCollectorAccountId(account);

        let err = false;

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(token)
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

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

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
            throw new Error("token creation did not error");
        }

        await env.close({ token });
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
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
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

    // eslint-disable-next-line mocha/no-skipped-tests
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
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
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

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("User cannot execute the fee schedule update transaction if there is not fee schedule set already", async function () {
        const env = await IntegrationTestEnv.new();

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setAmount(1);

        let err = false;

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

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
                .includes(Status.CustomScheduleAlreadyHasNoFees);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close();
    });

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("User cannot sign the fee schedule update transaction with any key besides the key schedule key", async function () {
        const env = await IntegrationTestEnv.new();

        const key = PrivateKey.generateED25519();

        const account = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .setInitialBalance(new Hbar(2))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(account)
            .setAmount(1);

        let err = false;

        const token = (
            await (
                await (
                    await new TokenCreateTransaction()
                        .setTokenName("ffff")
                        .setTokenSymbol("F")
                        .setTreasuryAccountId(env.operatorId)
                        .setAdminKey(env.operatorKey)
                        .setKycKey(env.operatorKey)
                        .setFreezeKey(env.operatorKey)
                        .setWipeKey(env.operatorKey)
                        .setSupplyKey(env.operatorKey)
                        .setFeeScheduleKey(key)
                        .setFreezeDefault(false)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        try {
            await (
                await new TokenFeeScheduleUpdateTransaction()
                    .setTokenId(token)
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

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

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

        const key = PrivateKey.generateED25519();

        const account = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .setInitialBalance(new Hbar(2))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(account)
            .setDenominatingTokenId(new TokenId(0xffffffff))
            .setAmount(1);

        let err = false;

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
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

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        await env.close({ token });
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
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setTokenType(TokenType.FungibleCommon)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
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

        const key = PrivateKey.generateED25519();

        const accountId = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key.publicKey)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setTokenType(TokenType.FungibleUnique)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

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

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setTokenType(TokenType.FungibleUnique)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

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
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
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
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("cannot clear custom fees when no custom fees are present", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setTokenType(TokenType.FungibleUnique)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

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

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        const fee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(token)
            .setAmount(1);

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setCustomFees([fee])
                    .setTokenType(TokenType.FungibleUnique)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.CustomFeeDenominationMustBeFungibleCommon);
        }

        if (!err) {
            throw new Error("token creation did not error");
        }

        await env.close({ token });
    });

    // Cannot reproduce `CustomFeeChargingExceededMaxRecursionDepth`
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("cannot have recursive custom fees", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        const key = PrivateKey.generateED25519();

        const account1 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .setInitialBalance(new Hbar(2))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account2 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .setInitialBalance(new Hbar(2))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const token1 = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setTokenType(TokenType.FungibleUnique)
                    .setInitialSupply(100)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        const fee2 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(token1)
            .setAmount(1);

        const token2 = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setTokenType(TokenType.FungibleUnique)
                    .setInitialSupply(100)
                    .setCustomFees([fee2])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        const fee1 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(token2)
            .setAmount(1);

        await (
            await new TokenFeeScheduleUpdateTransaction()
                .setTokenId(token1)
                .setCustomFees([fee1])
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token1])
                    .setAccountId(account1)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(token1)
                    .setAccountId(account1)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token1])
                    .setAccountId(account2)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(token1)
                    .setAccountId(account2)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(token1, env.operatorId, -10)
                .addTokenTransfer(token1, account1, 10)
                .execute(env.client)
        ).getReceipt(env.client);

        try {
            await (
                await new TransferTransaction()
                    .addTokenTransfer(token1, account1, -1)
                    .addTokenTransfer(token1, account2, 1)
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

        await env.close({ token: [token1, token2] });
    });

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("cannot have more than 20 balance changes in a single transfer", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        const key = PrivateKey.generateED25519();

        const account1 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account2 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account3 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account4 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account5 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account6 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account7 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account8 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const account9 = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        const token1 = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setTokenType(TokenType.FungibleUnique)
                    .setInitialSupply(100)
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        const fee2 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(token1)
            .setAmount(1);

        const token2 = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(env.operatorKey)
                    .setTokenType(TokenType.FungibleUnique)
                    .setInitialSupply(100)
                    .setCustomFees([fee2])
                    .setFreezeDefault(false)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        const fee1 = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(token2)
            .setAmount(1);

        await (
            await new TokenFeeScheduleUpdateTransaction()
                .setTokenId(token1)
                .setCustomFees([fee1])
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token1])
                    .setAccountId(account1)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(token1)
                    .setAccountId(account1)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token1])
                    .setAccountId(account2)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenGrantKycTransaction()
                    .setTokenId(token1)
                    .setAccountId(account2)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        try {
            await (
                await new TransferTransaction()
                    .addHbarTransfer(env.operatorId, -14)
                    .addHbarTransfer(account1, 1)
                    .addHbarTransfer(account2, 1)
                    .addHbarTransfer(account3, 1)
                    .addHbarTransfer(account4, 1)
                    .addHbarTransfer(account5, 1)
                    .addHbarTransfer(account6, 1)
                    .addHbarTransfer(account7, 1)
                    .addHbarTransfer(account8, 1)
                    .addHbarTransfer(account9, 1)
                    .addHbarTransfer("0.0.3", 1)
                    .addHbarTransfer("0.0.4", 1)
                    .addHbarTransfer("0.0.5", 1)
                    .addHbarTransfer("0.0.6", 1)
                    .addHbarTransfer("0.0.7", 1)
                    .addTokenTransfer(token1, env.operatorId, -2)
                    .addTokenTransfer(token1, account1, 1)
                    .addTokenTransfer(token1, account2, 1)
                    .addTokenTransfer(token2, env.operatorId, -2)
                    .addTokenTransfer(token2, account1, 1)
                    .addTokenTransfer(token2, account2, 1)
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

        await env.close({ token: [token1, token2] });
    });

    it("cannot set invalid schedule key", async function () {
        const env = await IntegrationTestEnv.new();

        let err = false;

        try {
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setKycKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFeeScheduleKey(new KeyList(KeyList.of(), 1))
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setFreezeDefault(false)
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
});
