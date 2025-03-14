import {
    AccountCreateTransaction,
    PrivateKey,
    Status,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenGrantKycTransaction,
    TokenInfoQuery,
    TokenMintTransaction,
    TokenSupplyType,
    TokenType,
    TokenUpdateTransaction,
    TransferTransaction,
    KeyList,
    TokenKeyValidation,
    PublicKey,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TokenUpdate", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new({ balance: 1000 });
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();
        const key4 = PrivateKey.generateED25519();
        const key5 = PrivateKey.generateED25519();
        const metadataKey = PrivateKey.generateED25519();
        const newMetadataKey = PrivateKey.generateED25519();
        const metadata = new Uint8Array([1]);

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setDecimals(3)
            .setInitialSupply(1000000)
            .setTreasuryAccountId(operatorId)
            .setAdminKey(operatorKey)
            .setKycKey(key1)
            .setFreezeKey(key2)
            .setWipeKey(key3)
            .setSupplyKey(key4)
            .setFreezeDefault(false)
            .setPauseKey(key5)
            .setMetadata(metadata)
            .setMetadataKey(metadataKey)
            .execute(env.client);

        const token = (await response.getReceipt(env.client)).tokenId;

        let info = await new TokenInfoQuery()
            .setTokenId(token)
            .execute(env.client);

        expect(info.tokenId.toString()).to.eql(token.toString());
        expect(info.name).to.eql("ffff");
        expect(info.symbol).to.eql("F");
        expect(info.decimals).to.eql(3);
        expect(info.totalSupply.toInt()).to.eql(1000000);
        expect(info.treasuryAccountId.toString()).to.be.equal(
            operatorId.toString(),
        );
        expect(info.adminKey.toString()).to.eql(operatorKey.toString());
        expect(info.kycKey.toString()).to.eql(key1.publicKey.toString());
        expect(info.freezeKey.toString()).to.eql(key2.publicKey.toString());
        expect(info.wipeKey.toString()).to.eql(key3.publicKey.toString());
        expect(info.supplyKey.toString()).to.eql(key4.publicKey.toString());
        expect(info.pauseKey.toString()).to.eql(key5.publicKey.toString());
        expect(info.metadataKey.toString()).to.eql(
            metadataKey.publicKey.toString(),
        );
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            operatorId.toString(),
        );
        expect(info.metadata).to.eql(metadata);
        expect(info.defaultFreezeStatus).to.be.false;
        expect(info.defaultKycStatus).to.be.false;
        expect(info.isDeleted).to.be.false;

        expect(info.autoRenewPeriod).to.be.not.null;
        expect(info.expirationTime).to.be.not.null;

        await (
            await new TokenUpdateTransaction()
                .setTokenId(token)
                .setTokenName("aaaa")
                .setTokenSymbol("A")
                .setMetadataKey(newMetadataKey)
                .execute(env.client)
        ).getReceipt(env.client);

        info = await new TokenInfoQuery().setTokenId(token).execute(env.client);

        expect(info.tokenId.toString()).to.eql(token.toString());
        expect(info.name).to.eql("aaaa");
        expect(info.symbol).to.eql("A");
        expect(info.decimals).to.eql(3);
        expect(info.totalSupply.toInt()).to.eql(1000000);
        expect(info.treasuryAccountId.toString()).to.be.equal(
            operatorId.toString(),
        );
        expect(info.adminKey.toString()).to.eql(operatorKey.toString());
        expect(info.kycKey.toString()).to.eql(key1.publicKey.toString());
        expect(info.freezeKey.toString()).to.eql(key2.publicKey.toString());
        expect(info.wipeKey.toString()).to.eql(key3.publicKey.toString());
        expect(info.supplyKey.toString()).to.eql(key4.publicKey.toString());
        expect(info.metadataKey.toString()).to.eql(
            newMetadataKey.publicKey.toString(),
        );
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            env.client.operatorAccountId.toString(),
        );
        expect(info.metadata).to.eql(metadata);
        expect(info.defaultFreezeStatus).to.be.false;
        expect(info.defaultKycStatus).to.be.false;
        expect(info.isDeleted).to.be.false;
        expect(info.autoRenewPeriod).to.be.null;
        expect(info.expirationTime).to.be.not.null;
    });

    it("should be able to update treasury", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();
        const key4 = PrivateKey.generateED25519();
        const key5 = PrivateKey.generateED25519();

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setDecimals(3)
            .setInitialSupply(1000000)
            .setTreasuryAccountId(operatorId)
            .setAdminKey(operatorKey)
            .setKycKey(key1)
            .setFreezeKey(key2)
            .setWipeKey(key3)
            .setSupplyKey(key4)
            .setFreezeDefault(false)
            .execute(env.client);

        const token = (await response.getReceipt(env.client)).tokenId;

        const treasuryAccountId = (
            await (
                await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(key5)
                        .freezeWith(env.client)
                        .sign(key5)
                ).execute(env.client)
            ).getReceipt(env.client)
        ).accountId;

        let info = await new TokenInfoQuery()
            .setTokenId(token)
            .execute(env.client);

        expect(info.tokenId.toString()).to.eql(token.toString());
        expect(info.name).to.eql("ffff");
        expect(info.symbol).to.eql("F");
        expect(info.decimals).to.eql(3);
        expect(info.totalSupply.toInt()).to.eql(1000000);
        expect(info.treasuryAccountId.toString()).to.be.equal(
            operatorId.toString(),
        );
        expect(info.adminKey.toString()).to.eql(operatorKey.toString());
        expect(info.kycKey.toString()).to.eql(key1.publicKey.toString());
        expect(info.freezeKey.toString()).to.eql(key2.publicKey.toString());
        expect(info.wipeKey.toString()).to.eql(key3.publicKey.toString());
        expect(info.supplyKey.toString()).to.eql(key4.publicKey.toString());
        expect(info.autoRenewAccountId).to.be.null;
        expect(info.defaultFreezeStatus).to.be.false;
        expect(info.defaultKycStatus).to.be.false;
        expect(info.isDeleted).to.be.false;
        expect(info.autoRenewAccountId).to.be.not.null;
        expect(info.expirationTime).to.be.not.null;

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token])
                    .setAccountId(treasuryAccountId)
                    .freezeWith(env.client)
                    .sign(key5)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenUpdateTransaction()
                    .setTokenId(token)
                    .setTokenName("aaaa")
                    .setTokenSymbol("A")
                    .setTreasuryAccountId(treasuryAccountId)
                    .freezeWith(env.client)
                    .sign(key5)
            ).execute(env.client)
        ).getReceipt(env.client);

        info = await new TokenInfoQuery().setTokenId(token).execute(env.client);

        expect(info.tokenId.toString()).to.eql(token.toString());
        expect(info.name).to.eql("aaaa");
        expect(info.symbol).to.eql("A");
        expect(info.decimals).to.eql(3);
        expect(info.totalSupply.toInt()).to.eql(1000000);
        expect(info.treasuryAccountId.toString()).to.be.equal(
            treasuryAccountId.toString(),
        );
        expect(info.adminKey.toString()).to.eql(operatorKey.toString());
        expect(info.kycKey.toString()).to.eql(key1.publicKey.toString());
        expect(info.freezeKey.toString()).to.eql(key2.publicKey.toString());
        expect(info.wipeKey.toString()).to.eql(key3.publicKey.toString());
        expect(info.supplyKey.toString()).to.eql(key4.publicKey.toString());
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            env.client.operatorAccountId.toString(),
        );
        expect(info.defaultFreezeStatus).to.be.false;
        expect(info.defaultKycStatus).to.be.false;
        expect(info.isDeleted).to.be.false;
        expect(info.autoRenewPeriod).to.be.null;
        expect(info.expirationTime).to.be.not.null;
    });

    it("should be executable when no properties except token ID are set", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();
        const key4 = PrivateKey.generateED25519();

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setDecimals(3)
            .setInitialSupply(1000000)
            .setTreasuryAccountId(operatorId)
            .setAdminKey(operatorKey)
            .setKycKey(key1)
            .setFreezeKey(key2)
            .setWipeKey(key3)
            .setSupplyKey(key4)
            .setFreezeDefault(false)
            .execute(env.client);

        const token = (await response.getReceipt(env.client)).tokenId;

        await (
            await new TokenUpdateTransaction()
                .setTokenId(token)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error updating immutable token", async function () {
        const operatorId = env.operatorId;

        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setTreasuryAccountId(operatorId)
            .execute(env.client);

        const token = (await response.getReceipt(env.client)).tokenId;

        let status;

        try {
            await (
                await new TokenUpdateTransaction()
                    .setTokenId(token)
                    .setTokenName("aaaa")
                    .setTokenSymbol("A")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.TokenIsImmutable);
    });

    it("should error when token ID is not set", async function () {
        let err = false;

        try {
            await (
                await new TokenUpdateTransaction().execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token update did not error");
        }
    });

    it("should return error when updating immutable token", async function () {
        let status;
        const operatorId = env.operatorId;

        try {
            const response = await new TokenCreateTransaction()
                .setTokenSymbol("F")
                .setTokenName("ffff")
                .setTreasuryAccountId(operatorId)
                .execute(env.client);

            const token = (await response.getReceipt(env.client)).tokenId;

            await (
                await new TokenUpdateTransaction()
                    .setTokenId(token)
                    .setTokenName("aaaa")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.TokenIsImmutable);
    });

    it("should error when admin key does not sign transaction", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();

        const response = await (
            await new TokenCreateTransaction()
                .setTokenName("ffff")
                .setTokenSymbol("F")
                .setTreasuryAccountId(operatorId)
                .setAdminKey(key)
                .freezeWith(env.client)
                .sign(key)
        ).execute(env.client);

        const token = (await response.getReceipt(env.client)).tokenId;

        let err = false;

        try {
            await (
                await new TokenUpdateTransaction()
                    .setTokenId(token)
                    .setTokenName("aaaa")
                    .setTokenSymbol("A")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature);
        }

        if (!err) {
            throw new Error("token update did not error");
        }
    });

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("cannot change current treasury until no NFTs are owned", async function () {
        const key = PrivateKey.generateED25519();

        const account = (
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
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setSupplyType(TokenSupplyType.Infinite)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

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
            await new TokenMintTransaction()
                .setMetadata([
                    Uint8Array.of([0, 1, 2]),
                    Uint8Array.of([3, 4, 5]),
                ])
                .setTokenId(token)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addNftTransfer(token, 1, env.operatorId, account)
                .execute(env.client)
        ).getReceipt(env.client);

        let err = false;

        try {
            await (
                await (
                    await new TokenUpdateTransaction()
                        .setTokenId(token)
                        .setTreasuryAccountId(account)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.CurrentTreasuryStillOwnsNfts);
        }

        if (!err) {
            throw new Error("token update did not error");
        }
    });

    describe("[HIP-646] Fungible Token Metadata Field", function () {
        it("should update the metadata of token after signing the transaction with metadata key", async function () {
            let tokenInfo;
            const operatorId = env.operatorId;
            const metadataKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setTokenType(TokenType.FungibleCommon)
                .setDecimals(3)
                .setInitialSupply(1000000)
                .setTreasuryAccountId(operatorId)
                .setMetadata(metadata)
                .setMetadataKey(metadataKey);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (
                    await tokenUpdateTx.sign(metadataKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should update the metadata of token after signing the transaction with admin key", async function () {
            const operatorId = env.operatorId;
            const adminKey = env.operatorKey;
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);
            let tokenInfo;

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setTokenType(TokenType.FungibleCommon)
                .setDecimals(3)
                .setInitialSupply(1000000)
                .setTreasuryAccountId(operatorId)
                .setAdminKey(adminKey)
                .setMetadata(metadata);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (await tokenUpdateTx.sign(adminKey)).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should NOT update the metadata of token when the new metadata is NOT set", async function () {
            const operatorId = env.operatorId;
            const adminKey = env.operatorKey;
            const metadata = new Uint8Array([1]);
            let tokenInfo;

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setTokenType(TokenType.FungibleCommon)
                .setDecimals(3)
                .setInitialSupply(1000000)
                .setTreasuryAccountId(operatorId)
                .setAdminKey(adminKey)
                .setMetadata(metadata);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .freezeWith(env.client);

            await (
                await (await tokenUpdateTx.sign(adminKey)).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(metadata);
        });

        it("should earse the metadata of token after signing the transaction with metadata key", async function () {
            let tokenInfo;
            const operatorId = env.operatorId;
            const metadataKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array();

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setTokenType(TokenType.FungibleCommon)
                .setDecimals(3)
                .setInitialSupply(1000000)
                .setTreasuryAccountId(operatorId)
                .setMetadata(metadata)
                .setMetadataKey(metadataKey);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (
                    await tokenUpdateTx.sign(metadataKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should earse the metadata of token after signing the transaction with admin key", async function () {
            const operatorId = env.operatorId;
            const adminKey = env.operatorKey;
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array();
            let tokenInfo;

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setTokenType(TokenType.FungibleCommon)
                .setDecimals(3)
                .setInitialSupply(1000000)
                .setTreasuryAccountId(operatorId)
                .setMetadata(metadata)
                .setAdminKey(adminKey);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (await tokenUpdateTx.sign(adminKey)).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should NOT update the metadata of token when the transaction is not signed with metadata or admin key", async function () {
            let status;
            const operatorId = env.operatorId;
            const adminKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();
            const wrongKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);

            try {
                const tokenCreateTx = new TokenCreateTransaction()
                    .setTokenName("Test")
                    .setTokenSymbol("T")
                    .setTokenType(TokenType.FungibleCommon)
                    .setDecimals(3)
                    .setInitialSupply(1000000)
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(adminKey)
                    .setMetadata(metadata)
                    .setMetadataKey(metadataKey);

                const tokenCreateTxresponse = await tokenCreateTx.execute(
                    env.client,
                );
                const tokenCreateTxReceipt =
                    await tokenCreateTxresponse.getReceipt(env.client);
                const tokenId = tokenCreateTxReceipt.tokenId;

                const tokenUpdateTx = new TokenUpdateTransaction()
                    .setTokenId(tokenId)
                    .setMetadata(newMetadata)
                    .freezeWith(env.client);

                await (
                    await (
                        await tokenUpdateTx.sign(wrongKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }
            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("should NOT update the metadata of token if the metadata or admin keys are NOT set", async function () {
            let status;
            const operatorId = env.operatorId;
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);

            try {
                const tokenCreateTx = new TokenCreateTransaction()
                    .setTokenName("Test")
                    .setTokenSymbol("T")
                    .setTokenType(TokenType.FungibleCommon)
                    .setDecimals(3)
                    .setInitialSupply(1000000)
                    .setTreasuryAccountId(operatorId)
                    .setMetadata(metadata);

                const tokenCreateTxresponse = await tokenCreateTx.execute(
                    env.client,
                );
                const tokenCreateTxReceipt =
                    await tokenCreateTxresponse.getReceipt(env.client);
                const tokenId = tokenCreateTxReceipt.tokenId;

                const tokenUpdateTx = new TokenUpdateTransaction()
                    .setTokenId(tokenId)
                    .setMetadata(newMetadata)
                    .freezeWith(env.client);

                await (
                    await tokenUpdateTx.execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }
            expect(status).to.be.eql(Status.TokenIsImmutable);
        });
    });

    describe("[HIP-765] Non Fungible Token Metadata Field", function () {
        it("should update the metadata of token after signing the transaction with metadata key", async function () {
            const operatorId = env.operatorId;
            const metadataKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);
            let tokenInfo;

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setSupplyKey(supplyKey)
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(operatorId)
                .setMetadata(metadata)
                .setMetadataKey(metadataKey);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (
                    await tokenUpdateTx.sign(metadataKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should update the metadata of token after signing the transaction with admin key", async function () {
            let tokenInfo;
            const operatorId = env.operatorId;
            const adminKey = env.operatorKey;
            const supplyKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setSupplyKey(supplyKey)
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(operatorId)
                .setAdminKey(adminKey)
                .setMetadata(metadata);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (await tokenUpdateTx.sign(adminKey)).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should NOT update the metadata of token when the new metadata is NOT set", async function () {
            let tokenInfo;
            const operatorId = env.operatorId;
            const adminKey = env.operatorKey;
            const supplyKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setSupplyKey(supplyKey)
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(operatorId)
                .setAdminKey(adminKey)
                .setMetadata(metadata);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .freezeWith(env.client);

            await (
                await (await tokenUpdateTx.sign(adminKey)).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(metadata);
        });

        it("should earse the metadata of token after signing the transaction with metadata key", async function () {
            const operatorId = env.operatorId;
            const metadataKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array();
            let tokenInfo;

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setSupplyKey(supplyKey)
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(operatorId)
                .setMetadata(metadata)
                .setMetadataKey(metadataKey);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (
                    await tokenUpdateTx.sign(metadataKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should earse the metadata of token after signing the transaction with admin key", async function () {
            const operatorId = env.operatorId;
            const adminKey = env.operatorKey;
            const suppyKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array();
            let tokenInfo;

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("Test")
                .setTokenSymbol("T")
                .setSupplyKey(suppyKey)
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(operatorId)
                .setAdminKey(adminKey)
                .setMetadata(metadata);

            const tokenCreateTxresponse = await tokenCreateTx.execute(
                env.client,
            );
            const tokenCreateTxReceipt = await tokenCreateTxresponse.getReceipt(
                env.client,
            );
            const tokenId = tokenCreateTxReceipt.tokenId;

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);
            expect(tokenInfo.metadata).to.eql(metadata);

            const tokenUpdateTx = new TokenUpdateTransaction()
                .setTokenId(tokenId)
                .setMetadata(newMetadata)
                .freezeWith(env.client);

            await (
                await (await tokenUpdateTx.sign(adminKey)).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.metadata).to.eql(newMetadata);
        });

        it("should NOT update the metadata of token when the transaction is not signed with metadata or admin key", async function () {
            let status;
            const operatorId = env.operatorId;
            const adminKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();
            const wrongKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);

            try {
                const tokenCreateTx = new TokenCreateTransaction()
                    .setTokenName("Test")
                    .setTokenSymbol("T")
                    .setSupplyKey(supplyKey)
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(adminKey)
                    .setMetadata(metadata)
                    .setMetadataKey(metadataKey);

                const tokenCreateTxresponse = await tokenCreateTx.execute(
                    env.client,
                );
                const tokenCreateTxReceipt =
                    await tokenCreateTxresponse.getReceipt(env.client);
                const tokenId = tokenCreateTxReceipt.tokenId;

                const tokenUpdateTx = new TokenUpdateTransaction()
                    .setTokenId(tokenId)
                    .setMetadata(newMetadata)
                    .freezeWith(env.client);

                await (
                    await (
                        await tokenUpdateTx.sign(wrongKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }
            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("should NOT update the metadata of token if the metadata or admin keys are NOT set", async function () {
            let status;
            const operatorId = env.operatorId;
            const supplyKey = PrivateKey.generateED25519();
            const metadata = new Uint8Array([1]);
            const newMetadata = new Uint8Array([1, 2]);

            try {
                const tokenCreateTx = new TokenCreateTransaction()
                    .setTokenName("Test")
                    .setTokenSymbol("T")
                    .setSupplyKey(supplyKey)
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setTreasuryAccountId(operatorId)
                    .setMetadata(metadata);

                const tokenCreateTxresponse = await tokenCreateTx.execute(
                    env.client,
                );
                const tokenCreateTxReceipt =
                    await tokenCreateTxresponse.getReceipt(env.client);
                const tokenId = tokenCreateTxReceipt.tokenId;

                const tokenUpdateTx = new TokenUpdateTransaction()
                    .setTokenId(tokenId)
                    .setMetadata(newMetadata)
                    .freezeWith(env.client);

                await (
                    await tokenUpdateTx.execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }
            expect(status).to.be.eql(Status.TokenIsImmutable);
        });
    });

    describe("[HIP-540] Change or remove existing keys from a token", function () {
        it("Can make the token immutable when updating all of its keys to an empty KeyList, signing with an Admin Key, and setting the key verification mode to NO_VALIDATION.", async function () {
            const adminKey = PrivateKey.generateED25519();
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const newKey = KeyList.of();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(adminKey)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await (
                await token.sign(adminKey)
            ).execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            await (
                await (
                    await new TokenUpdateTransaction()
                        .setTokenId(tokenId)
                        .setKeyVerificationMode(TokenKeyValidation.NoValidation)
                        .setAdminKey(newKey)
                        .setWipeKey(newKey)
                        .setFreezeKey(newKey)
                        .setPauseKey(newKey)
                        .setSupplyKey(newKey)
                        .setFeeScheduleKey(newKey)
                        .setMetadataKey(newKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey).to.be.null;
            expect(tokenInfo.wipeKey).to.be.null;
            expect(tokenInfo.freezeKey).to.be.null;
            expect(tokenInfo.pauseKey).to.be.null;
            expect(tokenInfo.supplyKey).to.be.null;
            expect(tokenInfo.feeScheduleKey).to.be.null;
            expect(tokenInfo.metadataKey).to.be.null;
        });

        it("Can remove all of token's lower-privilege keys when updating them to an empty KeyList, signing with an Admin Key, and setting the key verification mode to FULL_VALIDATION", async function () {
            const adminKey = PrivateKey.generateED25519();
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const emptyKeyList = KeyList.of();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(adminKey)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await (
                await token.sign(adminKey)
            ).execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            await (
                await (
                    await new TokenUpdateTransaction()
                        .setTokenId(tokenId)
                        .setKeyVerificationMode(
                            TokenKeyValidation.FullValidation,
                        )
                        .setWipeKey(emptyKeyList)
                        .setFreezeKey(emptyKeyList)
                        .setPauseKey(emptyKeyList)
                        .setSupplyKey(emptyKeyList)
                        .setFeeScheduleKey(emptyKeyList)
                        .setMetadataKey(emptyKeyList)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey).to.be.null;
            expect(tokenInfo.freezeKey).to.be.null;
            expect(tokenInfo.pauseKey).to.be.null;
            expect(tokenInfo.supplyKey).to.be.null;
            expect(tokenInfo.feeScheduleKey).to.be.null;
            expect(tokenInfo.metadataKey).to.be.null;
        });

        it("Can update all of token's lower-privilege keys to an unusable key (i.e. all-zeros key) when signing with an Admin Key, and setting the key verification mode to FULL_VALIDATION and then set all lower-privilege keys back by signing with an Admin Key and setting key verification mode to NO_VALIDATION", async function () {
            const adminKey = PrivateKey.generateED25519();
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(adminKey)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await (
                await token.sign(adminKey)
            ).execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            await (
                await (
                    await new TokenUpdateTransaction()
                        .setTokenId(tokenId)
                        .setKeyVerificationMode(
                            TokenKeyValidation.FullValidation,
                        )
                        .setWipeKey(unusableKey)
                        .setFreezeKey(unusableKey)
                        .setPauseKey(unusableKey)
                        .setSupplyKey(unusableKey)
                        .setFeeScheduleKey(unusableKey)
                        .setMetadataKey(unusableKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(unusableKey.toString());
            expect(tokenInfo.freezeKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                unusableKey.toString(),
            );

            await (
                await (
                    await new TokenUpdateTransaction()
                        .setTokenId(tokenId)
                        .setKeyVerificationMode(TokenKeyValidation.NoValidation)
                        .setWipeKey(wipeKey)
                        .setFreezeKey(freezeKey)
                        .setPauseKey(pauseKey)
                        .setSupplyKey(supplyKey)
                        .setFeeScheduleKey(feeScheduleKey)
                        .setMetadataKey(metadataKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );
        });

        it("Can update all of token's lower-privilege keys when signing with an Admin Key and new respective lower-privilege key, and setting key verification mode to FULL_VALIDATION", async function () {
            const adminKey = PrivateKey.generateED25519();
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const newWipeKey = PrivateKey.generateED25519();
            const newFreezeKey = PrivateKey.generateED25519();
            const newPauseKey = PrivateKey.generateED25519();
            const newSupplyKey = PrivateKey.generateED25519();
            const newFeeScheduleKey = PrivateKey.generateED25519();
            const newMetadataKey = PrivateKey.generateED25519();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(adminKey)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await (
                await token.sign(adminKey)
            ).execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            await (
                await (
                    await new TokenUpdateTransaction()
                        .setTokenId(tokenId)
                        .setKeyVerificationMode(
                            TokenKeyValidation.FullValidation,
                        )
                        .setWipeKey(newWipeKey)
                        .setFreezeKey(newFreezeKey)
                        .setPauseKey(newPauseKey)
                        .setSupplyKey(newSupplyKey)
                        .setFeeScheduleKey(newFeeScheduleKey)
                        .setMetadataKey(newMetadataKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                newWipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                newFreezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                newPauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                newSupplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                newFeeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                newMetadataKey.publicKey.toString(),
            );
        });

        it("Cannot make the token immutable when updating all of its keys to an empty KeyList, signing with a key that is different from an Admin Key, and setting the key verification mode to NO_VALIDATION", async function () {
            const adminKey = PrivateKey.generateED25519();
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const newKey = KeyList.of();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(adminKey)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await (
                await token.sign(adminKey)
            ).execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setAdminKey(newKey)
                            .setWipeKey(newKey)
                            .setFreezeKey(newKey)
                            .setPauseKey(newKey)
                            .setSupplyKey(newKey)
                            .setFeeScheduleKey(newKey)
                            .setMetadataKey(newKey)
                            .freezeWith(env.client)
                            .sign(env.operatorKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("Cannot make a token immutable when updating all of its keys to an unusable key (i.e. all-zeros key), signing with a key that is different from an Admin Key, and setting the key verification mode to NO_VALIDATION", async function () {
            const adminKey = PrivateKey.generateED25519();
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(adminKey)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await (
                await token.sign(adminKey)
            ).execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setAdminKey(unusableKey)
                            .setWipeKey(unusableKey)
                            .setFreezeKey(unusableKey)
                            .setPauseKey(unusableKey)
                            .setSupplyKey(unusableKey)
                            .setFeeScheduleKey(unusableKey)
                            .setMetadataKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(env.operatorKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("Cannot update the Admin Key to an unusable key (i.e. all-zeros key), signing with an Admin Key, and setting the key verification mode to NO_VALIDATION", async function () {
            const adminKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(adminKey)
                .setSupplyKey(supplyKey)
                .freezeWith(env.client);

            let response = await (
                await token.sign(adminKey)
            ).execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.adminKey.toString()).to.eql(
                adminKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setAdminKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(adminKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("Can update all of token’s lower-privilege keys to an unusable key (i.e. all-zeros key), when signing with a respective lower-privilege key, and setting the key verification mode to NO_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            await (
                await (
                    await (
                        await (
                            await (
                                await (
                                    await (
                                        await new TokenUpdateTransaction()
                                            .setTokenId(tokenId)
                                            .setKeyVerificationMode(
                                                TokenKeyValidation.NoValidation,
                                            )
                                            .setWipeKey(unusableKey)
                                            .setFreezeKey(unusableKey)
                                            .setPauseKey(unusableKey)
                                            .setSupplyKey(unusableKey)
                                            .setFeeScheduleKey(unusableKey)
                                            .setMetadataKey(unusableKey)
                                            .freezeWith(env.client)
                                            .sign(wipeKey)
                                    ).sign(freezeKey)
                                ).sign(pauseKey)
                            ).sign(supplyKey)
                        ).sign(feeScheduleKey)
                    ).sign(metadataKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(unusableKey.toString());
            expect(tokenInfo.freezeKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                unusableKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                unusableKey.toString(),
            );
        });

        it("Can update all of token’s lower-privilege keys when signing with an old respective lower-privilege key and a new respective lower-privilege key, and setting key verification mode to FULL_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const newWipeKey = PrivateKey.generateED25519();
            const newFreezeKey = PrivateKey.generateED25519();
            const newPauseKey = PrivateKey.generateED25519();
            const newSupplyKey = PrivateKey.generateED25519();
            const newFeeScheduleKey = PrivateKey.generateED25519();
            const newMetadataKey = PrivateKey.generateED25519();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );
            await (
                await (
                    await (
                        await (
                            await (
                                await (
                                    await (
                                        await (
                                            await (
                                                await (
                                                    await (
                                                        await (
                                                            await (
                                                                await new TokenUpdateTransaction()
                                                                    .setTokenId(
                                                                        tokenId,
                                                                    )
                                                                    .setKeyVerificationMode(
                                                                        TokenKeyValidation.FullValidation,
                                                                    )
                                                                    .setWipeKey(
                                                                        newWipeKey,
                                                                    )
                                                                    .setFreezeKey(
                                                                        newFreezeKey,
                                                                    )
                                                                    .setPauseKey(
                                                                        newPauseKey,
                                                                    )
                                                                    .setSupplyKey(
                                                                        newSupplyKey,
                                                                    )
                                                                    .setFeeScheduleKey(
                                                                        newFeeScheduleKey,
                                                                    )
                                                                    .setMetadataKey(
                                                                        newMetadataKey,
                                                                    )
                                                                    .freezeWith(
                                                                        env.client,
                                                                    )
                                                                    .sign(
                                                                        wipeKey,
                                                                    )
                                                            ).sign(newWipeKey)
                                                        ).sign(freezeKey)
                                                    ).sign(newFreezeKey)
                                                ).sign(pauseKey)
                                            ).sign(newPauseKey)
                                        ).sign(supplyKey)
                                    ).sign(newSupplyKey)
                                ).sign(feeScheduleKey)
                            ).sign(newFeeScheduleKey)
                        ).sign(metadataKey)
                    ).sign(newMetadataKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                newWipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                newFreezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                newPauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                newSupplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                newFeeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                newMetadataKey.publicKey.toString(),
            );
        });

        it("Can update all of token's lower-privilege keys when signing ONLY with an old respective lower-privilege key and setting key verification mode to NO_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const newWipeKey = PrivateKey.generateED25519();
            const newFreezeKey = PrivateKey.generateED25519();
            const newPauseKey = PrivateKey.generateED25519();
            const newSupplyKey = PrivateKey.generateED25519();
            const newFeeScheduleKey = PrivateKey.generateED25519();
            const newMetadataKey = PrivateKey.generateED25519();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );
            await (
                await (
                    await (
                        await (
                            await (
                                await (
                                    await (
                                        await new TokenUpdateTransaction()
                                            .setTokenId(tokenId)
                                            .setKeyVerificationMode(
                                                TokenKeyValidation.NoValidation,
                                            )
                                            .setWipeKey(newWipeKey)
                                            .setFreezeKey(newFreezeKey)
                                            .setPauseKey(newPauseKey)
                                            .setSupplyKey(newSupplyKey)
                                            .setFeeScheduleKey(
                                                newFeeScheduleKey,
                                            )
                                            .setMetadataKey(newMetadataKey)
                                            .freezeWith(env.client)
                                            .sign(wipeKey)
                                    ).sign(freezeKey)
                                ).sign(pauseKey)
                            ).sign(supplyKey)
                        ).sign(feeScheduleKey)
                    ).sign(metadataKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                newWipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                newFreezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                newPauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                newSupplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                newFeeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                newMetadataKey.publicKey.toString(),
            );
        });

        it("Cannot remove all of token's lower-privilege keys when updating them to an empty KeyList, signing with a respective lower-privilege key, and setting the key verification mode to NO_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const newKey = KeyList.of();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await (
                            await (
                                await (
                                    await (
                                        await (
                                            await new TokenUpdateTransaction()
                                                .setTokenId(tokenId)
                                                .setKeyVerificationMode(
                                                    TokenKeyValidation.NoValidation,
                                                )
                                                .setWipeKey(newKey)
                                                .setFreezeKey(newKey)
                                                .setPauseKey(newKey)
                                                .setSupplyKey(newKey)
                                                .setFeeScheduleKey(newKey)
                                                .setMetadataKey(newKey)
                                                .freezeWith(env.client)
                                                .sign(wipeKey)
                                        ).sign(freezeKey)
                                    ).sign(pauseKey)
                                ).sign(supplyKey)
                            ).sign(feeScheduleKey)
                        ).sign(metadataKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.TokenIsImmutable);
        });

        it("Cannot update all of token’s lower-privilege keys to an unusable key (i.e. all-zeros key), when signing with a key that is different from a respective lower-privilege key, and setting the key verification mode to NO_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setWipeKey(unusableKey)
                            .setFreezeKey(unusableKey)
                            .setPauseKey(unusableKey)
                            .setSupplyKey(unusableKey)
                            .setFeeScheduleKey(unusableKey)
                            .setMetadataKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(env.operatorKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("Cannot update all of token's lower-privilege keys to an unusable key (i.e. all-zeros key), when signing ONLY with an old respective lower-privilege key, and setting key verification mode to FULL_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setWipeKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(wipeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setFreezeKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(freezeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setPauseKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(pauseKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setSupplyKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(supplyKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setFeeScheduleKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(feeScheduleKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setMetadataKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(metadataKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("Cannot update all of token's lower-privilege to an unusable key (i.e. all-zeros key), when signing with an old respective lower-privilege key and a new respective lower-privilege key, and setting key verification mode to FULL_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const newWipeKey = PrivateKey.generateED25519();
            const newFreezeKey = PrivateKey.generateED25519();
            const newPauseKey = PrivateKey.generateED25519();
            const newSupplyKey = PrivateKey.generateED25519();
            const newFeeScheduleKey = PrivateKey.generateED25519();
            const newMetadataKey = PrivateKey.generateED25519();

            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await (
                            await new TokenUpdateTransaction()
                                .setTokenId(tokenId)
                                .setKeyVerificationMode(
                                    TokenKeyValidation.FullValidation,
                                )
                                .setWipeKey(unusableKey)
                                .freezeWith(env.client)
                                .sign(wipeKey)
                        ).sign(newWipeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await (
                            await new TokenUpdateTransaction()
                                .setTokenId(tokenId)
                                .setKeyVerificationMode(
                                    TokenKeyValidation.FullValidation,
                                )
                                .setFreezeKey(unusableKey)
                                .freezeWith(env.client)
                                .sign(freezeKey)
                        ).sign(newFreezeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await (
                            await new TokenUpdateTransaction()
                                .setTokenId(tokenId)
                                .setKeyVerificationMode(
                                    TokenKeyValidation.FullValidation,
                                )
                                .setPauseKey(unusableKey)
                                .freezeWith(env.client)
                                .sign(pauseKey)
                        ).sign(newPauseKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await (
                            await new TokenUpdateTransaction()
                                .setTokenId(tokenId)
                                .setKeyVerificationMode(
                                    TokenKeyValidation.FullValidation,
                                )
                                .setSupplyKey(unusableKey)
                                .freezeWith(env.client)
                                .sign(supplyKey)
                        ).sign(newSupplyKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await (
                            await new TokenUpdateTransaction()
                                .setTokenId(tokenId)
                                .setKeyVerificationMode(
                                    TokenKeyValidation.FullValidation,
                                )
                                .setFeeScheduleKey(unusableKey)
                                .freezeWith(env.client)
                                .sign(feeScheduleKey)
                        ).sign(newFeeScheduleKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await (
                            await new TokenUpdateTransaction()
                                .setTokenId(tokenId)
                                .setKeyVerificationMode(
                                    TokenKeyValidation.FullValidation,
                                )
                                .setMetadataKey(unusableKey)
                                .freezeWith(env.client)
                                .sign(metadataKey)
                        ).sign(newMetadataKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("Cannot update all of token's lower-privilege keys when signing ONLY with an old respective lower-privilege key and setting key verification mode to FULL_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const unusableKey = PublicKey.unusableKey();

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setWipeKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(wipeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setFreezeKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(freezeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setPauseKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(pauseKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setSupplyKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(supplyKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setFeeScheduleKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(feeScheduleKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.FullValidation,
                            )
                            .setMetadataKey(unusableKey)
                            .freezeWith(env.client)
                            .sign(metadataKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSignature);
        });

        it("Cannot update all of token's lower-privilege keys when updating them to a keys with an invalid structure and signing with an old respective lower-privilege and setting key verification mode to NO_VALIDATION", async function () {
            const wipeKey = PrivateKey.generateED25519();
            const freezeKey = PrivateKey.generateED25519();
            const pauseKey = PrivateKey.generateED25519();
            const supplyKey = PrivateKey.generateED25519();
            const feeScheduleKey = PrivateKey.generateED25519();
            const metadataKey = PrivateKey.generateED25519();

            const structurallyInvalidKey = PublicKey.fromString(
                "000000000000000000000000000000000000000000000000000000000000000000",
            );

            let token = new TokenCreateTransaction()
                .setTokenName("Token")
                .setTokenSymbol("T")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(env.operatorId)
                .setWipeKey(wipeKey)
                .setFreezeKey(freezeKey)
                .setPauseKey(pauseKey)
                .setSupplyKey(supplyKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setMetadataKey(metadataKey)
                .freezeWith(env.client);

            let response = await token.execute(env.client);
            const tokenId = (await response.getReceipt(env.client)).tokenId;

            let tokenInfo = await new TokenInfoQuery()
                .setTokenId(tokenId)
                .execute(env.client);

            expect(tokenInfo.name).to.eql(token.tokenName);
            expect(tokenInfo.symbol).to.eql(token.tokenSymbol);
            expect(tokenInfo.tokenType).to.eql(token.tokenType);
            expect(tokenInfo.treasuryAccountId.toString()).to.eql(
                token.treasuryAccountId.toString(),
            );
            expect(tokenInfo.wipeKey.toString()).to.eql(
                wipeKey.publicKey.toString(),
            );
            expect(tokenInfo.freezeKey.toString()).to.eql(
                freezeKey.publicKey.toString(),
            );
            expect(tokenInfo.pauseKey.toString()).to.eql(
                pauseKey.publicKey.toString(),
            );
            expect(tokenInfo.supplyKey.toString()).to.eql(
                supplyKey.publicKey.toString(),
            );
            expect(tokenInfo.feeScheduleKey.toString()).to.eql(
                feeScheduleKey.publicKey.toString(),
            );
            expect(tokenInfo.metadataKey.toString()).to.eql(
                metadataKey.publicKey.toString(),
            );

            let status;

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setWipeKey(structurallyInvalidKey)
                            .freezeWith(env.client)
                            .sign(wipeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidWipeKey);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setFreezeKey(structurallyInvalidKey)
                            .freezeWith(env.client)
                            .sign(freezeKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidFreezeKey);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setPauseKey(structurallyInvalidKey)
                            .freezeWith(env.client)
                            .sign(pauseKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidPauseKey);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setSupplyKey(structurallyInvalidKey)
                            .freezeWith(env.client)
                            .sign(supplyKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidSupplyKey);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setFeeScheduleKey(structurallyInvalidKey)
                            .freezeWith(env.client)
                            .sign(feeScheduleKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidCustomFeeScheduleKey);

            try {
                await (
                    await (
                        await new TokenUpdateTransaction()
                            .setTokenId(tokenId)
                            .setKeyVerificationMode(
                                TokenKeyValidation.NoValidation,
                            )
                            .setMetadataKey(structurallyInvalidKey)
                            .freezeWith(env.client)
                            .sign(metadataKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                status = error.status;
            }

            expect(status).to.be.eql(Status.InvalidMetadataKey);
        });
    });

    after(async function () {
        if (env != null) {
            env.close();
        }
    });
});
