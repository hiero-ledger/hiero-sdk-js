import {
    AccountInfoQuery,
    AccountUpdateTransaction,
    Status,
    TokenAssociateTransaction,
    TokenGrantKycTransaction,
    TokenMintTransaction,
    TokenWipeTransaction,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createAccount,
    createFungibleToken,
    createNonFungibleToken,
} from "./utils/Fixtures.js";

describe("TokenTransfer", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it.only("should be executable", async function () {
        // Create token with required keys
        const token = await createFungibleToken(env.client, (transaction) => {
            transaction.setKycKey(env.operatorKey).setFreezeDefault(false);
        });

        // Create account
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

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

        await (
            await new TokenWipeTransaction()
                .setTokenId(token)
                .setAccountId(account)
                .setAmount(10)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should not error when no amount is transferred", async function () {
        // Create token with required keys
        const token = await createFungibleToken(env.client, (transaction) => {
            transaction.setKycKey(env.operatorKey).setFreezeDefault(false);
        });

        // Create account
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

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
                await new TransferTransaction()
                    .addTokenTransfer(token, account, 0)
                    .addTokenTransfer(token, env.operatorId, 0)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error;
        }

        if (err) {
            throw new Error("Token transfer did error.");
        }
    });

    it("should error when no amount is transferred", async function () {
        // Create token with required keys
        const token = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setInitialSupply(0)
                .setKycKey(env.operatorKey)
                .setFreezeDefault(false);
        });

        // Create account
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

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
                await new TransferTransaction()
                    .addTokenTransfer(token, account, 10)
                    .addTokenTransfer(token, env.operatorId, -10)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InsufficientTokenBalance);
        }

        if (!err) {
            throw new Error("Token transfer did not error.");
        }
    });

    it("cannot transfer NFT as if it were FT", async function () {
        // Create account
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

        // Create NFT collection
        const token = await createNonFungibleToken(
            env.client,
            (transaction) => {
                transaction.setKycKey(env.operatorKey);
            },
        );

        await (
            await new TokenMintTransaction()
                .setMetadata([Uint8Array.of([0, 1, 2])])
                .setTokenId(token)
                .execute(env.client)
        ).getReceipt(env.client);

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
                await new TransferTransaction()
                    .addTokenTransfer(token, env.operatorId, -1)
                    .addTokenTransfer(token, account, 1)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(
                    Status.AccountAmountTransfersOnlyAllowedForFungibleCommon,
                );
        }

        if (!err) {
            throw new Error("token update did not error");
        }
    });

    it("automatically associates to account", async function () {
        // Create account with automatic token associations
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setMaxAutomaticTokenAssociations(10);
            },
        );

        let info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(info.maxAutomaticTokenAssociations.toInt()).to.be.equal(10);

        await (
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(account)
                    .setMaxAutomaticTokenAssociations(1)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(info.maxAutomaticTokenAssociations.toInt()).to.be.equal(1);

        // Create token
        const token = await createFungibleToken(env.client, (transaction) => {
            transaction.setFreezeDefault(false);
        });

        const record = await (
            await new TransferTransaction()
                .addTokenTransfer(token, account, 10)
                .addTokenTransfer(token, env.operatorId, -10)
                .execute(env.client)
        ).getRecord(env.client);

        expect(record.automaticTokenAssociations.length).to.be.equal(1);
        expect(
            record.automaticTokenAssociations[0].accountId.toString(),
        ).to.be.equal(account.toString());
        expect(
            record.automaticTokenAssociations[0].tokenId.toString(),
        ).to.be.equal(token.toString());

        await (
            await new TokenWipeTransaction()
                .setTokenId(token)
                .setAccountId(account)
                .setAmount(10)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    afterAll(async function () {
        await env.close();
    });
});
