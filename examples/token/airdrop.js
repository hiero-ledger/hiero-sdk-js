import {
    MirrorNodeTokenBalanceQuery,
    Client,
    PrivateKey,
    AccountId,
    AccountCreateTransaction,
    TokenAirdropTransaction,
    Hbar,
    TokenCreateTransaction,
    TokenType,
    TokenMintTransaction,
    TokenClaimAirdropTransaction,
    TokenCancelAirdropTransaction,
    TokenRejectTransaction,
    NftId,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 *
 */
async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        AccountId.fromString(process.env.OPERATOR_ID),
        PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY),
    );

    const CID = [
        "QmNPCiNA3Dsu3K5FxDPMG5Q3fZRwVTg14EXA92uqEeSRXn",
        "QmZ4dgAgt8owvnULxnKxNe8YqpavtVCXmc1Lt2XajFpJs9",
        "QmPzY5GxevjyfMUF5vEAjtyRoigzWp47MiKAtLBduLMC1T",
        "Qmd3kGgSrAwwSrhesYcY7K54f3qD7MDo38r7Po2dChtQx5",
        "QmWgkKz3ozgqtnvbCLeh7EaR1H8u5Sshx3ZJzxkcrT3jbw",
    ];

    /**
     * STEP 1:
     * Create 4 accounts
     */

    const privateKey = PrivateKey.generateECDSA();
    const { accountId: accountId1 } = await (
        await new AccountCreateTransaction()
            .setECDSAKeyWithAlias(privateKey)
            .setInitialBalance(new Hbar(10))
            .setMaxAutomaticTokenAssociations(-1)
            .execute(client)
    ).getReceipt(client);

    const privateKey2 = PrivateKey.generateECDSA();
    const { accountId: accountId2 } = await (
        await new AccountCreateTransaction()
            .setECDSAKeyWithAlias(privateKey2)
            .setInitialBalance(new Hbar(10))
            .setMaxAutomaticTokenAssociations(1)
            .execute(client)
    ).getReceipt(client);

    const privateKey3 = PrivateKey.generateECDSA();
    const { accountId: accountId3 } = await (
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(privateKey3)
            .setInitialBalance(new Hbar(10))
            .setMaxAutomaticTokenAssociations(0)
            .execute(client)
    ).getReceipt(client);

    const treasuryKey = PrivateKey.generateECDSA();
    const { accountId: treasuryAccount } = await (
        await new AccountCreateTransaction()
            .setECDSAKeyWithAlias(treasuryKey)
            .setInitialBalance(new Hbar(10))
            .setMaxAutomaticTokenAssociations(-1)
            .execute(client)
    ).getReceipt(client);

    /**
     * STEP 2:
     * Create FT and NFT mint
     */

    const INITIAL_SUPPLY = 300;

    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("Fungible Token")
        .setTokenSymbol("TFT")
        .setTokenMemo("Example memo")
        .setDecimals(3)
        .setInitialSupply(INITIAL_SUPPLY)
        .setTreasuryAccountId(treasuryAccount)
        .setAdminKey(client.operatorPublicKey)
        .setFreezeKey(client.operatorPublicKey)
        .setSupplyKey(client.operatorPublicKey)
        .setMetadataKey(client.operatorPublicKey)
        .setPauseKey(client.operatorPublicKey)
        .freezeWith(client)
        .sign(treasuryKey);

    const { tokenId } = await (
        await tokenCreateTx.execute(client)
    ).getReceipt(client);

    const { tokenId: nftId } = await (
        await (
            await new TokenCreateTransaction()
                .setTokenName("Test NFT")
                .setTokenSymbol("TNFT")
                .setTokenType(TokenType.NonFungibleUnique)
                .setTreasuryAccountId(treasuryAccount)
                .setAdminKey(client.operatorPublicKey)
                .setFreezeKey(client.operatorPublicKey)
                .setSupplyKey(client.operatorPublicKey)
                .setMetadataKey(client.operatorPublicKey)
                .setPauseKey(client.operatorPublicKey)
                .freezeWith(client)
                .sign(treasuryKey)
        ).execute(client)
    ).getReceipt(client);

    let serialsNfts = [];
    for (let i = 0; i < CID.length; i++) {
        const { serials } = await (
            await new TokenMintTransaction()
                .setTokenId(nftId)
                .addMetadata(Buffer.from("-"))
                .execute(client)
        ).getReceipt(client);

        serialsNfts.push(serials[0]);
    }
    /**
     * STEP 3:
     * Airdrop fungible tokens to 3 accounts
     */
    const AIRDROP_SUPPLY_PER_ACCOUNT = INITIAL_SUPPLY / 3;
    const airdropRecord = await (
        await (
            await new TokenAirdropTransaction()
                .addTokenTransfer(
                    tokenId,
                    treasuryAccount,
                    -AIRDROP_SUPPLY_PER_ACCOUNT,
                )
                .addTokenTransfer(
                    tokenId,
                    accountId1,
                    AIRDROP_SUPPLY_PER_ACCOUNT,
                )
                .addTokenTransfer(
                    tokenId,
                    treasuryAccount,
                    -AIRDROP_SUPPLY_PER_ACCOUNT,
                )
                .addTokenTransfer(
                    tokenId,
                    accountId2,
                    AIRDROP_SUPPLY_PER_ACCOUNT,
                )
                .addTokenTransfer(
                    tokenId,
                    treasuryAccount,
                    -AIRDROP_SUPPLY_PER_ACCOUNT,
                )
                .addTokenTransfer(
                    tokenId,
                    accountId3,
                    AIRDROP_SUPPLY_PER_ACCOUNT,
                )
                .freezeWith(client)
                .sign(treasuryKey)
        ).execute(client)
    ).getRecord(client);

    /**
     *  STEP 4: Get the transaction record and see the pending airdrops
     */

    const { newPendingAirdrops } = airdropRecord;
    console.log("Pending airdrops length", newPendingAirdrops.length);
    console.log("Pending airdrop", newPendingAirdrops[0]);

    /**
     * STEP 5:
     * Query to verify account 1 and Account 2 have received the airdrops and Account 3 has not
     */

    console.log(
        "Account1 balance after airdrop: ",
        (await tokenBalance(client, accountId1, tokenId)).toInt(),
    );
    console.log(
        "Account2 balance after airdrop: ",
        (await tokenBalance(client, accountId2, tokenId)).toInt(),
    );
    console.log(
        "Account3 balance after airdrop: ",
        await tokenBalance(client, accountId3, tokenId),
    );

    /**
     * Step 6: Claim the airdrop for Account 3
     */
    await (
        await (
            await new TokenClaimAirdropTransaction()
                .addPendingAirdropId(newPendingAirdrops[0].airdropId)
                .freezeWith(client)
                .sign(privateKey3)
        ).execute(client)
    ).getReceipt(client);

    console.log(
        "Account3 balance after airdrop claim",
        (await tokenBalance(client, accountId3, tokenId)).toInt(),
    );

    /**
     * Step 7:
     * Airdrop the NFTs to the 3 accounts
     */
    const { newPendingAirdrops: newPendingAirdropsNfts } = await (
        await (
            await new TokenAirdropTransaction()
                .addNftTransfer(
                    nftId,
                    serialsNfts[0],
                    treasuryAccount,
                    accountId1,
                )
                .addNftTransfer(
                    nftId,
                    serialsNfts[1],
                    treasuryAccount,
                    accountId2,
                )
                .addNftTransfer(
                    nftId,
                    serialsNfts[2],
                    treasuryAccount,
                    accountId3,
                )
                .freezeWith(client)
                .sign(treasuryKey)
        ).execute(client)
    ).getRecord(client);

    /**
     * Step 8:
     * Get the transaction record and verify two pending airdrops (for Account 2 & 3)
     */
    console.log("Pending airdrops length", newPendingAirdropsNfts.length);
    console.log("Pending airdrop for Account 0:", newPendingAirdropsNfts[0]);
    console.log("Pending airdrop for Account 1:", newPendingAirdropsNfts[1]);

    /**
     * Step 9:
     * Query to verify Account 1 received the airdrop and Account 2 and Account 3 did not
     */

    console.log(
        "Account 1 NFT Balance after airdrop",
        (await tokenBalance(client, accountId1, nftId)).toInt(),
    );
    console.log(
        "Account 2 NFT Balance after airdrop",
        await tokenBalance(client, accountId2, nftId),
    );
    console.log(
        "Account 3 NFT Balance after airdrop",
        await tokenBalance(client, accountId3, nftId),
    );

    /**
     * Step 10:
     * Claim the airdrop for Account 2
     */
    await (
        await (
            await new TokenClaimAirdropTransaction()
                .addPendingAirdropId(newPendingAirdropsNfts[0].airdropId)
                .freezeWith(client)
                .sign(privateKey2)
        ).execute(client)
    ).getReceipt(client);

    console.log(
        "Account 2 nft balance after claim: ",
        (await tokenBalance(client, accountId2, nftId)).toInt(),
    );

    /**
     * Step 11:
     * Cancel the airdrop for Account 3
     */
    console.log("Cancelling airdrop for account 3");
    await new TokenCancelAirdropTransaction()
        .addPendingAirdropId(newPendingAirdropsNfts[1].airdropId)
        .execute(client);

    console.log(
        "Account 3 nft balance after cancel: ",
        await tokenBalance(client, accountId3, nftId),
    );

    /**
     * Step 12:
     * Reject the NFT for Account 2
     */
    console.log("Rejecting NFT for account 2");
    await (
        await (
            await new TokenRejectTransaction()
                .setOwnerId(accountId2)
                .addNftId(new NftId(nftId, serialsNfts[1]))
                .freezeWith(client)
                .sign(privateKey2)
        ).execute(client)
    ).getReceipt(client);

    /**
     * Step 13:
     * Query to verify Account 2 no longer has the NFT
     */
    console.log(
        "Account 2 nft balance after reject: ",
        (await tokenBalance(client, accountId2, nftId)).toInt(),
    );

    /**
     * Step 14:
     * Query to verify treasury has received the NFT back
     */

    console.log(
        "Treasury nft balance after reject: ",
        (await tokenBalance(client, treasuryAccount, nftId)).toInt(),
    );

    /**
     * Step 15:
     * Reject the fungible tokens for Account 3
     */
    console.log("Rejecting fungible tokens for account 3: ");
    await (
        await (
            await new TokenRejectTransaction()
                .setOwnerId(accountId3)
                .addTokenId(tokenId)
                .freezeWith(client)
                .sign(privateKey3)
        ).execute(client)
    ).getReceipt(client);

    console.log(
        "Account 3 balance after reject: ",
        (await tokenBalance(client, accountId3, tokenId)).toInt(),
    );

    console.log(
        "Treasury balance after reject: ",
        (await tokenBalance(client, treasuryAccount, tokenId)).toInt(),
    );
    client.close();
}

/**
 * Read a token balance from the mirror node.
 *
 * `AccountBalanceQuery` used to return token balances, use `MirrorNodeTokenBalanceQuery` instead.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Pass `previous` to
 * poll until the value moves; the loop is bounded so an example cannot hang.
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @param {import("@hiero-ledger/sdk").TokenId | string} tokenId
 * @param {import("long")} [previous]
 * @returns {Promise<import("long")>}
 */
async function tokenBalance(client, accountId, tokenId, previous) {
    return untilMirror(async () => {
        const { balance } = await new MirrorNodeTokenBalanceQuery()
            .setAccountId(accountId)
            .setTokenId(tokenId)
            .execute(client);

        // Without a previous value there is nothing to wait for.
        if (previous == null) {
            return balance;
        }

        return balance.equals(previous) ? null : balance;
    });
}

void main();

/**
 * Poll a mirror-node read until it reflects the transaction that just happened.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Polling to a deadline
 * beats a fixed sleep: it does not go flaky on a slow runner and does not waste
 * time on a fast one.
 *
 * @template T
 * @param {() => Promise<T | null>} read - resolves the value once it is ready
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
async function untilMirror(read, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = await read();
        if (result != null) {
            return result;
        }
        if (Date.now() >= deadline) {
            throw new Error("mirror node did not ingest in time");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}
