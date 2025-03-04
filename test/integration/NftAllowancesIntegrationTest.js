import {
    AccountAllowanceApproveTransaction,
    AccountAllowanceDeleteTransaction,
    Hbar,
    NftId,
    Status,
    TransactionId,
    TokenAssociateTransaction,
    TokenMintTransaction,
    TokenNftInfoQuery,
    TokenType,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, createNonFungibleToken } from "./utils/Fixtures.js";

describe("TokenNftAllowances", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("Cannot transfer on behalf of `spender` account without allowance approval", async function () {
        let status;

        const { accountId: spenderAccountId, newKey: spenderKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(new Hbar(2)),
            );

        const { accountId: receiverAccountId } = await createAccount(
            env.client,
            (transaction) => transaction.setInitialBalance(new Hbar(2)),
        );

        const nftTokenId = await createNonFungibleToken(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([nftTokenId])
                    .setAccountId(spenderAccountId)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const serials = (
            await (
                await new TokenMintTransaction()
                    .setTokenId(nftTokenId)
                    .addMetadata(Uint8Array.of(0x01))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).serials;

        const nft1 = new NftId(nftTokenId, serials[0]);

        const onBehalfOfTransactionId =
            TransactionId.generate(spenderAccountId);
        try {
            await (
                await (
                    await new TransferTransaction()
                        .addApprovedNftTransfer(
                            nft1,
                            env.operatorId,
                            receiverAccountId,
                        )
                        .setTransactionId(onBehalfOfTransactionId)
                        .freezeWith(env.client)
                        .sign(spenderKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.TokenNotAssociatedToAccount);
    });

    it("Cannot transfer on behalf of `spender` account after removing the allowance approval", async function () {
        // Use createAccount fixture
        const { accountId: spenderAccountId, newKey: spenderKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(new Hbar(2)),
            );

        const { accountId: receiverAccountId, newKey: receiverKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(new Hbar(2)),
            );

        // Use createNonFungibleToken fixture
        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFreezeDefault(false),
        );

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([nftTokenId])
                    .setAccountId(spenderAccountId)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([nftTokenId])
                    .setAccountId(receiverAccountId)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const serials = (
            await (
                await new TokenMintTransaction()
                    .setTokenId(nftTokenId)
                    .addMetadata(Uint8Array.of(0x01))
                    .addMetadata(Uint8Array.of(0x02))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).serials;

        const nft1 = new NftId(nftTokenId, serials[0]);
        const nft2 = new NftId(nftTokenId, serials[1]);

        await new AccountAllowanceApproveTransaction()
            .approveTokenNftAllowance(nft1, env.operatorId, spenderAccountId)
            .approveTokenNftAllowance(nft2, env.operatorId, spenderAccountId)
            .execute(env.client);

        await (
            await new AccountAllowanceDeleteTransaction()
                .deleteAllTokenNftAllowances(nft2, env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const onBehalfOfTransactionId =
            TransactionId.generate(spenderAccountId);
        await (
            await (
                await new TransferTransaction()
                    .addApprovedNftTransfer(
                        nft1,
                        env.operatorId,
                        receiverAccountId,
                    )
                    .setTransactionId(onBehalfOfTransactionId)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const info = await new TokenNftInfoQuery()
            .setNftId(nft1)
            .execute(env.client);

        expect(info[0].accountId.toString()).to.be.equal(
            receiverAccountId.toString(),
        );

        let err = false;
        const onBehalfOfTransactionId2 =
            TransactionId.generate(spenderAccountId);
        try {
            await (
                await (
                    await new TransferTransaction()
                        .addApprovedNftTransfer(
                            nft2,
                            env.operatorId,
                            receiverAccountId,
                        )
                        .setTransactionId(onBehalfOfTransactionId2)
                        .freezeWith(env.client)
                        .sign(spenderKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.SpenderDoesNotHaveAllowance);
        }

        expect(err).to.be.true;
    });

    it("Cannot remove single serial number allowance when the allowance is given for all serials at once", async function () {
        // Use createAccount fixture
        const { accountId: spenderAccountId, newKey: spenderKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(new Hbar(2)),
            );

        const { accountId: receiverAccountId, newKey: receiverKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(new Hbar(2)),
            );

        // Use createNonFungibleToken fixture
        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFreezeDefault(false),
        );

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([nftTokenId])
                    .setAccountId(spenderAccountId)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([nftTokenId])
                    .setAccountId(receiverAccountId)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const serials = (
            await (
                await new TokenMintTransaction()
                    .setTokenId(nftTokenId)
                    .addMetadata(Uint8Array.of(0x01))
                    .addMetadata(Uint8Array.of(0x02))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).serials;

        const nft1 = new NftId(nftTokenId, serials[0]);
        const nft2 = new NftId(nftTokenId, serials[1]);

        await new AccountAllowanceApproveTransaction()
            .approveTokenNftAllowanceAllSerials(
                nftTokenId,
                env.operatorId,
                spenderAccountId,
            )
            .execute(env.client);

        const onBehalfOfTransactionId =
            TransactionId.generate(spenderAccountId);
        await (
            await (
                await new TransferTransaction()
                    .addApprovedNftTransfer(
                        nft1,
                        env.operatorId,
                        receiverAccountId,
                    )
                    .setTransactionId(onBehalfOfTransactionId)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        // hopefully in the future this should end up with a precheck error provided from services
        await (
            await new AccountAllowanceDeleteTransaction()
                .deleteAllTokenNftAllowances(nft2, env.operatorId)
                .execute(env.client)
        ).getReceipt(env.client);

        const onBehalfOfTransactionId2 =
            TransactionId.generate(spenderAccountId);
        await (
            await (
                await new TransferTransaction()
                    .addApprovedNftTransfer(
                        nft2,
                        env.operatorId,
                        receiverAccountId,
                    )
                    .setTransactionId(onBehalfOfTransactionId2)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const infoNft1 = await new TokenNftInfoQuery()
            .setNftId(nft1)
            .execute(env.client);

        const infoNft2 = await new TokenNftInfoQuery()
            .setNftId(nft2)
            .execute(env.client);

        expect(infoNft1[0].accountId.toString()).to.be.equal(
            receiverAccountId.toString(),
        );

        expect(infoNft2[0].accountId.toString()).to.be.equal(
            receiverAccountId.toString(),
        );
    });

    it("Account, which given the allowance for all serials at once, should be able to give allowances for single serial numbers to other accounts", async function () {
        const {
            accountId: delegatingSpenderAccountId,
            newKey: delegatingSpenderKey,
        } = await createAccount(env.client, (transaction) =>
            transaction.setInitialBalance(new Hbar(2)),
        );

        const { accountId: spenderAccountId, newKey: spenderKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(new Hbar(2)),
            );

        const { accountId: receiverAccountId, newKey: receiverKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(new Hbar(2)),
            );

        // Use createNonFungibleToken fixture
        const nftTokenId = await createNonFungibleToken(
            env.client,
            (transaction) =>
                transaction
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setTreasuryAccountId(env.operatorId)
                    .setAdminKey(env.operatorKey)
                    .setFreezeKey(env.operatorKey)
                    .setWipeKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .setFreezeDefault(false),
        );

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([nftTokenId])
                    .setAccountId(delegatingSpenderAccountId)
                    .freezeWith(env.client)
                    .sign(delegatingSpenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([nftTokenId])
                    .setAccountId(receiverAccountId)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const serials = (
            await (
                await new TokenMintTransaction()
                    .setTokenId(nftTokenId)
                    .addMetadata(Uint8Array.of(0x01))
                    .addMetadata(Uint8Array.of(0x02))
                    .execute(env.client)
            ).getReceipt(env.client)
        ).serials;

        const nft1 = new NftId(nftTokenId, serials[0]);
        const nft2 = new NftId(nftTokenId, serials[1]);

        await (
            await new AccountAllowanceApproveTransaction()
                .approveTokenNftAllowanceAllSerials(
                    nftTokenId,
                    env.operatorId,
                    delegatingSpenderAccountId,
                )
                .execute(env.client)
        ).getReceipt(env.client);

        env.client.setOperator(
            delegatingSpenderAccountId,
            delegatingSpenderKey,
        );

        await (
            await new AccountAllowanceApproveTransaction()
                .approveTokenNftAllowanceWithDelegatingSpender(
                    nft1,
                    env.operatorId,
                    spenderAccountId,
                    delegatingSpenderAccountId,
                )
                .freezeWith(env.client)
                .execute(env.client)
        ).getReceipt(env.client);

        env.client.setOperator(env.operatorId, env.operatorKey);

        const onBehalfOfTransactionId =
            TransactionId.generate(spenderAccountId);
        await (
            await (
                await new TransferTransaction()
                    .addApprovedNftTransfer(
                        nft1,
                        env.operatorId,
                        receiverAccountId,
                    )
                    .setTransactionId(onBehalfOfTransactionId)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        let err = false;
        const onBehalfOfTransactionId2 =
            TransactionId.generate(spenderAccountId);
        try {
            await (
                await (
                    await new TransferTransaction()
                        .addApprovedNftTransfer(
                            nft2,
                            env.operatorId,
                            receiverAccountId,
                        )
                        .setTransactionId(onBehalfOfTransactionId2)
                        .freezeWith(env.client)
                        .sign(spenderKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.SpenderDoesNotHaveAllowance);
        }

        expect(err).to.be.true;

        const infoNft1 = await new TokenNftInfoQuery()
            .setNftId(nft1)
            .execute(env.client);

        const infoNft2 = await new TokenNftInfoQuery()
            .setNftId(nft2)
            .execute(env.client);

        expect(infoNft1[0].accountId.toString()).to.be.equal(
            receiverAccountId.toString(),
        );
        expect(infoNft2[0].accountId.toString()).to.be.equal(
            env.operatorId.toString(),
        );
    });

    after(async function () {
        await env.close();
    });
});
