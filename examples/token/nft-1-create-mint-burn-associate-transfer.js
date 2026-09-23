import {
    MirrorNodeAccountBalanceQuery,
    AccountId,
    PrivateKey,
    Client,
    TokenCreateTransaction,
    TokenInfoQuery,
    TokenType,
    CustomRoyaltyFee,
    CustomFixedFee,
    Hbar,
    TokenSupplyType,
    TokenMintTransaction,
    TokenBurnTransaction,
    TransferTransaction,
    AccountUpdateTransaction,
    TokenAssociateTransaction,
    AccountCreateTransaction,
} from "@hiero-ledger/sdk";

/**
 * @typedef {import("@hiero-ledger/sdk").TokenInfo} TokenInfo
 * @typedef {import("@hiero-ledger/sdk").TransactionReceipt} TransactionReceipt
 */

import dotenv from "dotenv";

dotenv.config();

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
const nodes = {
    "127.0.0.1:50211": new AccountId(3),
};

const client = Client.forNetwork(nodes)
    .setOperator(operatorId, operatorKey)
    // Config mirror network for your custom network. This will be used by the
    // MirrorNodeAccountBalanceQuery to get account balances from the mirror node.
    .setMirrorNetwork("local-node");

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
const freezeKey = PrivateKey.generate();
const wipeKey = PrivateKey.generate();

/**
 *
 */
async function main() {
    // Create Treasury account
    console.log("Creating Treasury account...");
    const treasuryKey = PrivateKey.generate();
    const treasuryPublicKey = treasuryKey.publicKey;
    console.log(`Treasury private key = ${treasuryKey.toString()}`);
    console.log(`Treasury public key = ${treasuryPublicKey.toString()}`);

    const treasuryTransaction = new AccountCreateTransaction()
        .setInitialBalance(new Hbar(50))
        .setKeyWithoutAlias(treasuryKey)
        .freezeWith(client);

    const treasuryResponse = await treasuryTransaction.execute(client);
    const treasuryReceipt = await treasuryResponse.getReceipt(client);
    const treasuryId = treasuryReceipt.accountId;
    console.log(`Treasury account ID = ${treasuryId.toString()}\n`);

    // Create Alice account
    console.log("Creating Alice account...");
    const aliceKey = PrivateKey.generate();
    const alicePublicKey = aliceKey.publicKey;
    console.log(`Alice private key = ${aliceKey.toString()}`);
    console.log(`Alice public key = ${alicePublicKey.toString()}`);

    const aliceTransaction = new AccountCreateTransaction()
        .setInitialBalance(new Hbar(20))
        .setKeyWithoutAlias(aliceKey)
        .freezeWith(client);

    const aliceResponse = await aliceTransaction.execute(client);
    const aliceReceipt = await aliceResponse.getReceipt(client);
    const aliceId = aliceReceipt.accountId;
    console.log(`Alice account ID = ${aliceId.toString()}\n`);

    // Create Bob account
    console.log("Creating Bob account...");
    const bobKey = PrivateKey.generate();
    const bobPublicKey = bobKey.publicKey;
    console.log(`Bob private key = ${bobKey.toString()}`);
    console.log(`Bob public key = ${bobPublicKey.toString()}`);

    const bobTransaction = new AccountCreateTransaction()
        .setInitialBalance(new Hbar(20))
        .setKeyWithoutAlias(bobKey)
        .freezeWith(client);

    const bobResponse = await bobTransaction.execute(client);
    const bobReceipt = await bobResponse.getReceipt(client);
    const bobId = bobReceipt.accountId;
    console.log(`Bob account ID = ${bobId.toString()}\n`);

    // DEFINE CUSTOM FEE SCHEDULE
    let nftCustomFee = new CustomRoyaltyFee()
        .setNumerator(5)
        .setDenominator(10)
        .setFeeCollectorAccountId(treasuryId)
        .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));

    // IPFS CONTENT IDENTIFIERS FOR WHICH WE WILL CREATE NFTs
    const CID = [
        "QmNPCiNA3Dsu3K5FxDPMG5Q3fZRwVTg14EXA92uqEeSRXn",
        "QmZ4dgAgt8owvnULxnKxNe8YqpavtVCXmc1Lt2XajFpJs9",
        "QmPzY5GxevjyfMUF5vEAjtyRoigzWp47MiKAtLBduLMC1T",
        "Qmd3kGgSrAwwSrhesYcY7K54f3qD7MDo38r7Po2dChtQx5",
        "QmWgkKz3ozgqtnvbCLeh7EaR1H8u5Sshx3ZJzxkcrT3jbw",
    ];

    try {
        // CREATE NFT WITH CUSTOM FEE
        let nftCreate = await new TokenCreateTransaction()
            .setTokenName("Fall Collection")
            .setTokenSymbol("LEAF")
            .setTokenType(TokenType.NonFungibleUnique)
            .setDecimals(0)
            .setInitialSupply(0)
            .setTreasuryAccountId(treasuryId)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(CID.length)
            .setCustomFees([nftCustomFee])
            .setAdminKey(adminKey)
            .setSupplyKey(supplyKey)
            .setFreezeKey(freezeKey)
            .setWipeKey(wipeKey)
            .freezeWith(client)
            .sign(treasuryKey);

        let nftCreateTxSign = await nftCreate.sign(adminKey);
        let nftCreateSubmit = await nftCreateTxSign.execute(client);
        let nftCreateRx = await nftCreateSubmit.getReceipt(client);
        let tokenId = nftCreateRx.tokenId;
        console.log(`Created NFT with Token ID: ${tokenId.toString()} \n`);

        // TOKEN QUERY TO CHECK THAT THE CUSTOM FEE SCHEDULE IS ASSOCIATED WITH NFT
        var tokenInfo = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(client);
        console.table(tokenInfo.customFees[0]);

        // MINT NEW BATCH OF NFTs
        const nftLeaf = [];
        for (var i = 0; i < CID.length; i++) {
            nftLeaf[i] = await tokenMinterFcn(CID[i]);
            console.log(
                `Created NFT ${tokenId.toString()} with serial: ${nftLeaf[
                    i
                ].serials[0].toString()}`,
            );
        }

        // BURN THE LAST NFT IN THE COLLECTION
        let tokenBurnTx = await new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setSerials([CID.length])
            .freezeWith(client)
            .sign(supplyKey);
        let tokenBurnSubmit = await tokenBurnTx.execute(client);
        let tokenBurnRx = await tokenBurnSubmit.getReceipt(client);
        console.log(
            `\nBurn NFT with serial ${
                CID.length
            }: ${tokenBurnRx.status.toString()} \n`,
        );

        tokenInfo = await new TokenInfoQuery()
            .setTokenId(tokenId)
            .execute(client);
        console.log(
            `Current NFT supply: ${tokenInfo.totalSupply.toString()} \n`,
        );

        // AUTO-ASSOCIATION FOR ALICE'S ACCOUNT
        let associateTx = await new AccountUpdateTransaction()
            .setAccountId(aliceId)
            .setMaxAutomaticTokenAssociations(100)
            .freezeWith(client)
            .sign(aliceKey);
        let associateTxSubmit = await associateTx.execute(client);
        let associateRx = await associateTxSubmit.getReceipt(client);
        console.log(
            `Alice NFT Auto-Association: ${associateRx.status.toString()} \n`,
        );

        // MANUAL ASSOCIATION FOR BOB'S ACCOUNT
        let associateBobTx = await new TokenAssociateTransaction()
            .setAccountId(bobId)
            .setTokenIds([tokenId])
            .freezeWith(client)
            .sign(bobKey);
        let associateBobTxSubmit = await associateBobTx.execute(client);
        let associateBobRx = await associateBobTxSubmit.getReceipt(client);
        console.log(
            `Bob NFT Manual Association: ${associateBobRx.status.toString()} \n`,
        );

        let oB = await bCheckerFcn(treasuryId);
        let aB = await bCheckerFcn(aliceId);
        let bB = await bCheckerFcn(bobId);
        console.log(
            `- Treasury balance: ID:${tokenId.toString()} and ${oB.toString()}`,
        );
        console.log(
            `- Alice balance: ID:${tokenId.toString()} and ${aB.toString()}`,
        );
        console.log(
            `- Bob balance: ID:${tokenId.toString()} and ${bB.toString()}`,
        );

        // 1st TRANSFER NFT Treasury->Alice
        let tokenTransferTx = await new TransferTransaction()
            .addNftTransfer(tokenId, 2, treasuryId, aliceId)
            .freezeWith(client)
            .sign(treasuryKey);
        let tokenTransferSubmit = await tokenTransferTx.execute(client);
        let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
        console.log(
            `\n NFT transfer Treasury->Alice status: ${tokenTransferRx.status.toString()} \n`,
        );

        oB = await bCheckerFcn(treasuryId);
        aB = await bCheckerFcn(aliceId);
        bB = await bCheckerFcn(bobId);
        console.log(
            `- Treasury balance: ID:${tokenId.toString()} and ${oB.toString()}`,
        );
        console.log(
            `- Alice balance: ID:${tokenId.toString()} and ${aB.toString()}`,
        );
        console.log(
            `- Bob balance: ID:${tokenId.toString()} and ${bB.toString()}`,
        );

        // 2nd NFT TRANSFER NFT Alice->Bob
        let tokenTransferTx2 = await new TransferTransaction()
            .addNftTransfer(tokenId, 2, aliceId, bobId)
            .addHbarTransfer(aliceId, 100)
            .addHbarTransfer(bobId, -100)
            .freezeWith(client)
            .sign(aliceKey);
        const tokenTransferTx2Sign = await tokenTransferTx2.sign(bobKey);
        let tokenTransferSubmit2 = await tokenTransferTx2Sign.execute(client);
        let tokenTransferRx2 = await tokenTransferSubmit2.getReceipt(client);
        console.log(
            `\n NFT transfer Alice->Bob status: ${tokenTransferRx2.status.toString()} \n`,
        );

        oB = await bCheckerFcn(treasuryId);
        aB = await bCheckerFcn(aliceId);
        bB = await bCheckerFcn(bobId);
        console.log(
            `- Treasury balance: ID:${tokenId.toString()} and ${oB.toString()}`,
        );
        console.log(
            `- Alice balance: ID:${tokenId.toString()} and ${aB.toString()}`,
        );
        console.log(
            `- Bob balance: ID:${tokenId.toString()} and ${bB.toString()}`,
        );

        /**
         * TOKEN MINTER FUNCTION
         * @param {string} CID
         * @returns {Promise<TransactionReceipt>}
         */
        async function tokenMinterFcn(CID) {
            const mintTx = new TokenMintTransaction()
                .setTokenId(tokenId)
                .setMetadata([Buffer.from(CID)])
                .freezeWith(client);
            let mintTxSign = await mintTx.sign(supplyKey);
            let mintTxSubmit = await mintTxSign.execute(client);
            return mintTxSubmit.getReceipt(client);
        }

        // BALANCE CHECKER FUNCTION ==========================================
        /**
         * BALANCE CHECKER FUNCTION
         * @param {string | AccountId} id
         * @returns {Promise<Hbar>}
         */
        async function bCheckerFcn(id) {
            const balance = await hbarBalance(client, id);
            return balance;
        }
    } catch (error) {
        console.error(error);
    }

    client.close();
}

/**
 * Read an HBAR balance from the mirror node.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Pass `previous` to
 * poll until the value moves; the loop is bounded so an example cannot hang.
 *
 * @param {import("@hiero-ledger/sdk").Client} client
 * @param {import("@hiero-ledger/sdk").AccountId | string} accountId
 * @param {import("@hiero-ledger/sdk").Hbar} [previous]
 * @returns {Promise<import("@hiero-ledger/sdk").Hbar>}
 */
async function hbarBalance(client, accountId, previous) {
    return untilMirror(async () => {
        const { hbars } = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);

        // Without a previous value there is nothing to wait for.
        if (previous == null) {
            return hbars;
        }

        return hbars.toTinybars().equals(previous.toTinybars()) ? null : hbars;
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
