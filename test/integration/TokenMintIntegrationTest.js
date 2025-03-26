import {
    Status,
    TokenMintTransaction,
    TokenSupplyType,
    TokenInfoQuery,
    Long,
    Transaction,
} from "../../src/exports.js";
import { wait } from "../../src/util.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createFungibleToken,
    createNonFungibleToken,
} from "./utils/Fixtures.js";

describe("TokenMint", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const token = await createFungibleToken(env.client);
        await (
            await new TokenMintTransaction()
                .setAmount(10)
                .setTokenId(token)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("toBytes/fromBytes", async function () {
        const token = await createFungibleToken(env.client);

        let mint = new TokenMintTransaction()
            .setAmount(10)
            .setTokenId(token)
            .freezeWith(env.client);

        let mintBytes = mint.toBytes();

        let mintFromBytes = Transaction.fromBytes(mintBytes);

        await (await mintFromBytes.execute(env.client)).getReceipt(env.client);
    });

    it("should error when token ID is not set", async function () {
        let err = false;

        try {
            await (
                await new TokenMintTransaction()
                    .setAmount(10)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token Mint did not error");
        }
    });

    it("should not error when amount is not set", async function () {
        const token = await createFungibleToken(env.client);

        let err = false;

        try {
            await (
                await new TokenMintTransaction()
                    .setTokenId(token)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error;
        }

        if (err) {
            throw new Error("token mint did error");
        }
    });

    it("User cannot mint more than the tokens defined max supply value", async function () {
        const token = await createFungibleToken(env.client, (transaction) =>
            transaction
                .setInitialSupply(0)
                .setMaxSupply(10)
                .setSupplyType(TokenSupplyType.Finite),
        );

        let err = false;

        try {
            await (
                await new TokenMintTransaction()
                    .setAmount(11)
                    .setTokenId(token)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.TokenMaxSupplyReached);
        }

        if (!err) {
            throw new Error("token mint did not error");
        }
    });

    it("cannot mint token with invalid metadata", async function () {
        const token = await createNonFungibleToken(env.client);

        let err = false;

        try {
            await (
                await new TokenMintTransaction()
                    .setTokenId(token)
                    .setAmount(1)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenMintMetadata);
        }

        if (!err) {
            throw new Error("token mint did not error");
        }
    });

    it("should retrieve the correct token balance", async function () {
        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setDecimals(8);
            transaction.setInitialSupply(0);
        });

        const amount = Long.fromValue("25817858423044461");

        await new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .execute(env.client);

        await wait(5000);

        const tokenInfo = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(env.client);

        expect(tokenInfo.totalSupply.toString()).to.be.equal(amount.toString());
    });

    after(async function () {
        await env.close();
    });
});
