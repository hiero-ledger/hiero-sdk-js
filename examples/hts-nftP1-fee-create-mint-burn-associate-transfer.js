import {
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
    AccountBalanceQuery,
    AccountUpdateTransaction,
    TokenAssociateTransaction,
    AccountCreateTransaction,
} from "@hashgraph/sdk";

/**
 * @typedef {import("@hashgraph/sdk").TokenInfo} TokenInfo
 * @typedef {import("@hashgraph/sdk").TransactionReceipt} TransactionReceipt
 */

import dotenv from "dotenv";

dotenv.config();

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
const nodes = {
    "127.0.0.1:50211": new AccountId(3),
};

const client = Client.forNetwork(nodes).setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
const freezeKey = PrivateKey.generate();
const wipeKey = PrivateKey.generate();

/**
 * Helper function to create an account
 * @param {string} name - Name for logging purposes
 * @param {Hbar} initialBalance - Initial balance for the account
 * @returns {Promise<{accountId: AccountId, privateKey: PrivateKey}>}
 */
async function createAccount(name, initialBalance = new Hbar(10)) {
    const privateKey = PrivateKey.generate();
    const publicKey = privateKey.publicKey;

    console.log(`Creating ${name} account...`);
    console.log(`${name} private key = ${privateKey.toString()}`);
    console.log(`${name} public key = ${publicKey.toString()}`);

    const transaction = new AccountCreateTransaction()
        .setInitialBalance(initialBalance)
        .setKeyWithoutAlias(publicKey)
        .freezeWith(client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;

    console.log(`${name} account ID = ${accountId.toString()}\n`);

    return { accountId, privateKey };
}

async function main() {
    // Create accounts instead of using environment variables
    const { accountId: treasuryId, privateKey: treasuryKey } =
        await createAccount("Treasury", new Hbar(50));
    const { accountId: aliceId, privateKey: aliceKey } = await createAccount(
        "Alice",
        new Hbar(20),
    );
    const { accountId: bobId, privateKey: bobKey } = await createAccount(
        "Bob",
        new Hbar(20),
    );

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

        // BALANCE CHECK 1
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

        // BALANCE CHECK 2
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

        // BALANCE CHECK 3
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
            const balanceCheckTx = await new AccountBalanceQuery()
                .setAccountId(id)
                .execute(client);
            return balanceCheckTx.hbars;
        }
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
