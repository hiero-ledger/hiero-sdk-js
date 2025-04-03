import {
    AccountInfoQuery,
    Status,
    TokenAssociateTransaction,
    TokenGrantKycTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, createFungibleToken } from "./utils/Fixtures.js";

describe("TokenGrantKyc", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

        const token = await createFungibleToken(env.client, (transaction) =>
            transaction.setKycKey(env.client.operatorPublicKey),
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

        const info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        const relationship = info.tokenRelationships.get(token);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(token.toString());
        expect(relationship.balance.toInt()).to.be.equal(0);
        expect(relationship.isKycGranted).to.be.true;
        expect(relationship.isFrozen).to.be.false;
    });

    it("should be executable even when no token IDs are set", async function () {
        const { accountId: account, newKey: key } = await createAccount(
            env.client,
        );

        let err = false;

        try {
            await (
                await (
                    await new TokenGrantKycTransaction()
                        .setAccountId(account)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token grant kyc did not error");
        }
    });

    it("should error when account ID is not set", async function () {
        const token = await createFungibleToken(env.client);

        let err = false;

        try {
            await (
                await new TokenGrantKycTransaction()
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
