import {
    TokenMintTransaction,
    TokenUpdateNftsTransaction,
    TokenNftInfoQuery,
    NftId,
    Status,
    PrivateKey,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createNonFungibleToken } from "./utils/Fixtures.js";

describe("TokenUpdateNftsTransaction", function () {
    let client,
        operatorId,
        operatorKey,
        metadata,
        newMetadata,
        metadataKey,
        supplyKey,
        wrongMetadataKey,
        nftCount;

    before(async function () {
        const env = await IntegrationTestEnv.new();
        client = env.client;
        operatorId = env.operatorId;
        operatorKey = env.operatorKey;
        metadata = new Uint8Array([1]);
        newMetadata = new Uint8Array([1, 2]);
        metadataKey = PrivateKey.generateECDSA();
        supplyKey = PrivateKey.generateECDSA();
        wrongMetadataKey = PrivateKey.generateECDSA();
        nftCount = 4;
    });

    it("should update the metadata of entire NFT collection", async function () {
        const tokenId = await createNonFungibleToken(client, (transaction) => {
            transaction
                .setAdminKey(operatorKey)
                .setSupplyKey(supplyKey)
                .setMetadataKey(metadataKey)
                .setTreasuryAccountId(operatorId);
        });

        const tokenMintTx = new TokenMintTransaction()
            .setMetadata(generateMetadataList(metadata, nftCount))
            .setTokenId(tokenId)
            .freezeWith(client);

        const tokenMintResponse = await (
            await tokenMintTx.sign(supplyKey)
        ).execute(client);
        const tokenMintReceipt = await tokenMintResponse.getReceipt(client);
        const serials = tokenMintReceipt.serials;

        const metadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            metadatas.every(
                (mt) => mt === Buffer.from(metadata).toString("hex"),
            ),
        ).to.be.true;

        await (
            await (
                await new TokenUpdateNftsTransaction()
                    .setTokenId(tokenId)
                    .setSerialNumbers(serials)
                    .setMetadata(newMetadata)
                    .freezeWith(client)
                    .sign(metadataKey)
            ).execute(client)
        ).getReceipt(client);

        const newMetadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            newMetadatas.every(
                (mt) => mt === Buffer.from(newMetadata).toString("hex"),
            ),
        ).to.be.true;
    });

    it("should update the NFT's metadata", async function () {
        const tokenId = await createNonFungibleToken(client, (transaction) => {
            transaction
                .setAdminKey(operatorKey)
                .setSupplyKey(supplyKey)
                .setMetadataKey(metadataKey)
                .setTreasuryAccountId(operatorId);
        });

        const tokenMintTx = new TokenMintTransaction()
            .setMetadata(generateMetadataList(metadata, nftCount))
            .setTokenId(tokenId)
            .freezeWith(client);

        const tokenMintResponse = await (
            await tokenMintTx.sign(supplyKey)
        ).execute(client);
        const tokenMintReceipt = await tokenMintResponse.getReceipt(client);
        const serials = tokenMintReceipt.serials;

        const metadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            metadatas.every(
                (mt) => mt === Buffer.from(metadata).toString("hex"),
            ),
        ).to.be.true;

        await (
            await (
                await new TokenUpdateNftsTransaction()
                    .setTokenId(tokenId)
                    .setSerialNumbers([serials[0], serials[1]])
                    .setMetadata(newMetadata)
                    .freezeWith(client)
                    .sign(metadataKey)
            ).execute(client)
        ).getReceipt(client);

        const newMetadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            newMetadatas.map(
                (mt) => mt === Buffer.from(newMetadata).toString("hex"),
            ),
        ).to.deep.eql([true, true, false, false]);
    });

    it("should NOT update the NFT's metadata", async function () {
        const tokenId = await createNonFungibleToken(client, (transaction) => {
            transaction
                .setAdminKey(operatorKey)
                .setSupplyKey(supplyKey)
                .setMetadataKey(metadataKey)
                .setTreasuryAccountId(operatorId);
        });

        const tokenMintTx = new TokenMintTransaction()
            .setMetadata(generateMetadataList(metadata, nftCount))
            .setTokenId(tokenId)
            .freezeWith(client);

        const tokenMintResponse = await (
            await tokenMintTx.sign(supplyKey)
        ).execute(client);
        const tokenMintReceipt = await tokenMintResponse.getReceipt(client);
        const serials = tokenMintReceipt.serials;

        const metadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            metadatas.every(
                (mt) => mt === Buffer.from(metadata).toString("hex"),
            ),
        ).to.be.true;

        await (
            await (
                await new TokenUpdateNftsTransaction()
                    .setTokenId(tokenId)
                    .setSerialNumbers(serials)
                    .freezeWith(client)
                    .sign(metadataKey)
            ).execute(client)
        ).getReceipt(client);

        const sameMetadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            sameMetadatas.every(
                (mt) => mt === Buffer.from(metadata).toString("hex"),
            ),
        ).to.be.true;
    });

    it("should earse the metadata of entire NFT collection", async function () {
        const tokenId = await createNonFungibleToken(client, (transaction) => {
            transaction
                .setAdminKey(operatorKey)
                .setSupplyKey(supplyKey)
                .setMetadataKey(metadataKey)
                .setTreasuryAccountId(operatorId);
        });

        const tokenMintTx = new TokenMintTransaction()
            .setMetadata(generateMetadataList(metadata, nftCount))
            .setTokenId(tokenId)
            .freezeWith(client);

        const tokenMintResponse = await (
            await tokenMintTx.sign(supplyKey)
        ).execute(client);
        const tokenMintReceipt = await tokenMintResponse.getReceipt(client);
        const serials = tokenMintReceipt.serials;

        const metadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            metadatas.every(
                (mt) => mt === Buffer.from(metadata).toString("hex"),
            ),
        ).to.be.true;

        await (
            await (
                await new TokenUpdateNftsTransaction()
                    .setTokenId(tokenId)
                    .setMetadata([])
                    .setSerialNumbers(serials)
                    .freezeWith(client)
                    .sign(metadataKey)
            ).execute(client)
        ).getReceipt(client);

        const sameMetadatas = await geNftsMetadata(client, tokenId, serials);
        expect(
            sameMetadatas.every(
                (mt) => mt === Buffer.from(new Uint8Array()).toString("hex"),
            ),
        ).to.be.true;
    });

    it("should NOT update the NFTs metadata if the metadataKey is NOT set", async function () {
        try {
            const tokenId = await createNonFungibleToken(
                client,
                (transaction) => {
                    transaction
                        .setAdminKey(operatorKey)
                        .setSupplyKey(supplyKey)
                        .setTreasuryAccountId(operatorId);
                },
            );

            const tokenMintTx = new TokenMintTransaction()
                .setMetadata(generateMetadataList(metadata, nftCount))
                .setTokenId(tokenId)
                .freezeWith(client);

            const tokenMintResponse = await (
                await tokenMintTx.sign(supplyKey)
            ).execute(client);
            const tokenMintReceipt = await tokenMintResponse.getReceipt(client);

            const serials = tokenMintReceipt.serials;

            const tokenUpdateNftsTx = new TokenUpdateNftsTransaction()
                .setTokenId(tokenId)
                .setSerialNumbers(serials)
                .setMetadata(newMetadata)
                .freezeWith(client);

            await (
                await (
                    await tokenUpdateNftsTx.sign(metadataKey)
                ).execute(client)
            ).getReceipt(client);
        } catch (error) {
            expect(error.status).to.be.eql(Status.InvalidSignature);
        }
    });

    it("should NOT update the NFTs metadata when the transaction is not signed with the metadataKey", async function () {
        try {
            const tokenId = await createNonFungibleToken(
                client,
                (transaction) => {
                    transaction
                        .setAdminKey(operatorKey)
                        .setMetadataKey(metadataKey)
                        .setSupplyKey(supplyKey)
                        .setTreasuryAccountId(operatorId);
                },
            );

            const tokenMintTx = new TokenMintTransaction()
                .setMetadata(generateMetadataList(metadata, nftCount))
                .setTokenId(tokenId)
                .freezeWith(client);

            const tokenMintResponse = await (
                await tokenMintTx.sign(supplyKey)
            ).execute(client);
            const tokenMintReceipt = await tokenMintResponse.getReceipt(client);

            const serials = tokenMintReceipt.serials;

            const tokenUpdateNftsTx = new TokenUpdateNftsTransaction()
                .setTokenId(tokenId)
                .setSerialNumbers(serials)
                .setMetadata(newMetadata)
                .freezeWith(client);

            await (
                await (
                    await tokenUpdateNftsTx.sign(wrongMetadataKey)
                ).execute(client)
            ).getReceipt(client);
        } catch (error) {
            expect(error.status).to.be.eql(Status.InvalidSignature);
        }
    });
});

function generateMetadataList(metadata, count) {
    const list = [];

    for (let index = 0; index < count; index++) {
        list.push(metadata);
    }
    return list;
}

async function geNftsMetadata(client, tokenId, serials) {
    const metadatas = [];

    for (let index = 0; index < serials.length; index++) {
        const nftId = new NftId(tokenId, serials[index]);
        const nftInfo = await new TokenNftInfoQuery()
            .setNftId(nftId)
            .execute(client);
        metadatas.push(nftInfo[0].metadata.toString("hex"));
    }

    return metadatas;
}
