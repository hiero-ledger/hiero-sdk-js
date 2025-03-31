import {
    AccountInfoQuery,
    Status,
    TokenAssociateTransaction,
    TokenGrantKycTransaction,
    TokenRevokeKycTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, createFungibleToken } from "./utils/Fixtures.js";

describe("TokenRevokeKyc", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
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

        let info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        let relationship = info.tokenRelationships.get(token);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(token.toString());
        expect(relationship.balance.toInt()).to.be.equal(0);
        expect(relationship.isKycGranted).to.be.true;
        expect(relationship.isFrozen).to.be.false;

        await (
            await (
                await new TokenRevokeKycTransaction()
                    .setTokenId(token)
                    .setAccountId(account)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        relationship = info.tokenRelationships.get(token);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(token.toString());
        expect(relationship.balance.toInt()).to.be.equal(0);
        expect(relationship.isKycGranted).to.be.false;
        expect(relationship.isFrozen).to.be.false;
    });

    it("should be executable even when no token IDs are set", async function () {
        // Create account
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

        let err = false;

        try {
            await (
                await (
                    await new TokenRevokeKycTransaction()
                        .setAccountId(account)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token revoke kyc did not error");
        }
    });

    it("should error when account ID is not set", async function () {
        // Create token with required keys
        const token = await createFungibleToken(env.client, (transaction) => {
            transaction.setKycKey(env.operatorKey).setFreezeDefault(false);
        });

        let err = false;

        try {
            await (
                await new TokenRevokeKycTransaction()
                    .setTokenId(token)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountId);
        }

        if (!err) {
            throw new Error("token association did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
