import {
    AccountBalanceQuery,
    AccountId,
    Client,
    CustomFixedFee,
    CustomRoyaltyFee,
    Hbar,
    PrivateKey,
    ScheduleCreateTransaction,
    ScheduleInfoQuery,
    ScheduleSignTransaction,
    TokenAssociateTransaction,
    TokenBurnTransaction,
    TokenCreateTransaction,
    TokenDeleteTransaction,
    TokenFreezeTransaction,
    TokenGrantKycTransaction,
    TokenInfoQuery,
    TokenMintTransaction,
    TokenPauseTransaction,
    TokenSupplyType,
    TokenType,
    TokenUnfreezeTransaction,
    TokenUnpauseTransaction,
    TokenUpdateTransaction,
    TokenWipeTransaction,
    TransferTransaction,
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

const client = Client.forNetwork(nodes).setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
const kycKey = PrivateKey.generate();
const newKycKey = PrivateKey.generate();
const pauseKey = PrivateKey.generate();
const freezeKey = PrivateKey.generate();
const wipeKey = PrivateKey.generate();

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
            .setKycKey(kycKey)
            .setPauseKey(pauseKey)
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
        let tokenInfo = await tQueryFcn();
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
            }: ${tokenBurnRx.status.toString()}`,
        );

        tokenInfo = await tQueryFcn();
        console.log(`Current NFT supply: ${tokenInfo.totalSupply.toString()}`);

        // MANUAL ASSOCIATION FOR ALICE'S ACCOUNT
        let associateAliceTx = await new TokenAssociateTransaction()
            .setAccountId(aliceId)
            .setTokenIds([tokenId])
            .freezeWith(client)
            .sign(aliceKey);
        let associateAliceTxSubmit = await associateAliceTx.execute(client);
        let associateAliceRx = await associateAliceTxSubmit.getReceipt(client);
        console.log(
            `\n- Alice NFT manual association: ${associateAliceRx.status.toString()}`,
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
            `- Bob NFT manual association: ${associateBobRx.status.toString()}`,
        );

        // PART 2.1 STARTS ============================================================
        console.log(
            `\nPART 2.1 STARTS ============================================================\n`,
        );
        // ENABLE TOKEN KYC FOR ALICE AND BOB
        let aliceKyc = await kycEnableFcn(aliceId);
        let bobKyc = await kycEnableFcn(bobId);
        console.log(
            `- Enabling token KYC for Alice's account: ${aliceKyc.status.toString()}`,
        );
        console.log(
            `- Enabling token KYC for Bob's account: ${bobKyc.status.toString()}\n`,
        );

        // WE NEED TO COMMENT OUT BECAUSE OF THE CODE ON LINE 226, WE CANNOT TRANSFER TO ALICE WITHOUT KYC ENABLED -> // 1st TRANSFER NFT TREASURY -> ALICE
        // // DISABLE TOKEN KYC FOR ALICE
        // let kycDisableTx = await new TokenRevokeKycTransaction()
        //     .setAccountId(aliceId)
        //     .setTokenId(tokenId)
        //     .freezeWith(client)
        //     .sign(kycKey);
        // let kycDisableSubmitTx = await kycDisableTx.execute(client);
        // let kycDisableRx = await kycDisableSubmitTx.getReceipt(client);
        // console.log(
        //     `- Disabling token KYC for Alice's account: ${kycDisableRx.status.toString()} \n`
        // );

        // QUERY TO CHECK INTIAL KYC KEY
        tokenInfo = await tQueryFcn();
        console.log(
            `- KYC key for the NFT is: \n${tokenInfo.kycKey.toString()} \n`,
        );

        // UPDATE TOKEN PROPERTIES: NEW KYC KEY
        let tokenUpdateTx = await new TokenUpdateTransaction()
            .setTokenId(tokenId)
            .setKycKey(newKycKey)
            .freezeWith(client)
            .sign(adminKey);
        let tokenUpdateSubmitTx = await tokenUpdateTx.execute(client);
        let tokenUpdateRx = await tokenUpdateSubmitTx.getReceipt(client);
        console.log(
            `- Token update transaction (new KYC key): ${tokenUpdateRx.status.toString()} \n`,
        );

        // QUERY TO CHECK CHANGE IN KYC KEY
        tokenInfo = await tQueryFcn();
        console.log(
            `- KYC key for the NFT is: \n${tokenInfo.kycKey.toString()}`,
        );

        // PART 2.1 ENDS ============================================================
        console.log(
            `\nPART 2.1 ENDS ============================================================\n`,
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

        // 1st TRANSFER NFT TREASURY -> ALICE
        let tokenTransferTx = await new TransferTransaction()
            .addNftTransfer(tokenId, 2, treasuryId, aliceId)
            .freezeWith(client)
            .sign(treasuryKey);
        let tokenTransferSubmit = await tokenTransferTx.execute(client);
        let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
        console.log(
            `\n NFT transfer Treasury -> Alice status: ${tokenTransferRx.status.toString()} \n`,
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

        // 2nd NFT TRANSFER NFT ALICE -> BOB
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
            `\n NFT transfer Alice -> Bob status: ${tokenTransferRx2.status.toString()} \n`,
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

        // PART 2.2 STARTS ============================================================
        console.log(
            `\nPART 2.2 STARTS ============================================================\n`,
        );

        // CREATE THE NFT TRANSFER FROM BOB->ALICE TO BE SCHEDULED
        // REQUIRES ALICE'S AND BOB'S SIGNATURES
        let txToSchedule = new TransferTransaction()
            .addNftTransfer(tokenId, 2, bobId, aliceId)
            .addHbarTransfer(aliceId, -200)
            .addHbarTransfer(bobId, 200);

        // SCHEDULE THE NFT TRANSFER TRANSACTION CREATED IN THE LAST STEP
        let scheduleTx = await new ScheduleCreateTransaction()
            .setScheduledTransaction(txToSchedule)
            .execute(client);
        let scheduleRx = await scheduleTx.getReceipt(client);
        let scheduleId = scheduleRx.scheduleId;
        let scheduledTxId = scheduleRx.scheduledTransactionId;
        console.log(`- The schedule ID is: ${scheduleId.toString()}`);
        console.log(
            `- The scheduled transaction ID is: ${scheduledTxId.toString()} \n`,
        );

        // SUBMIT ALICE'S SIGNATURE FOR THE TRANSFER TRANSACTION
        let aliceSignTx = await new ScheduleSignTransaction()
            .setScheduleId(scheduleId)
            .freezeWith(client)
            .sign(aliceKey);
        let aliceSignSubmit = await aliceSignTx.execute(client);
        let aliceSignRx = await aliceSignSubmit.getReceipt(client);
        console.log(
            `- Status of Alice's signature submission: ${aliceSignRx.status.toString()}`,
        );

        // QUERY TO CONFIRM IF THE SCHEDULE WAS TRIGGERED (SIGNATURES HAVE BEEN ADDED)
        let scheduleQuery = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(client);
        console.log(
            `- Schedule triggered (all required signatures received): ${(
                scheduleQuery.executed !== null
            ).toString()}`,
        );

        // SUBMIT BOB'S SIGNATURE FOR THE TRANSFER TRANSACTION
        let bobSignTx = await new ScheduleSignTransaction()
            .setScheduleId(scheduleId)
            .freezeWith(client)
            .sign(bobKey);
        let bobSignSubmit = await bobSignTx.execute(client);
        let bobSignRx = await bobSignSubmit.getReceipt(client);
        console.log(
            `- Status of Bob's signature submission: ${bobSignRx.status.toString()}`,
        );

        // QUERY TO CONFIRM IF THE SCHEDULE WAS TRIGGERED (SIGNATURES HAVE BEEN ADDED)
        scheduleQuery = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(client);
        console.log(
            `- Schedule triggered (all required signatures received): ${(
                scheduleQuery.executed !== null
            ).toString()} \n`,
        );

        // VERIFY THAT THE SCHEDULED TRANSACTION (TOKEN TRANSFER) EXECUTED
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

        // PART 3 ============================================================
        console.log(
            `\nPART 3 ============================================================\n`,
        );

        // PAUSE ALL TOKEN OEPRATIONS
        let tokenPauseTx = await new TokenPauseTransaction()
            .setTokenId(tokenId)
            .freezeWith(client)
            .sign(pauseKey);
        let tokenPauseSubmitTx = await tokenPauseTx.execute(client);
        let tokenPauseRx = await tokenPauseSubmitTx.getReceipt(client);
        console.log(`- Token pause: ${tokenPauseRx.status.toString()}`);

        // TEST THE TOKEN PAUSE BY TRYING AN NFT TRANSFER (TREASURY -> ALICE)
        let tokenTransferTx3 = await new TransferTransaction()
            .addNftTransfer(tokenId, 3, treasuryId, aliceId)
            .freezeWith(client)
            .sign(treasuryKey);
        let tokenTransferSubmit3 = await tokenTransferTx3.execute(client);
        try {
            let tokenTransferRx3 =
                await tokenTransferSubmit3.getReceipt(client);
            console.log(
                `\n-NFT transfer Treasury->Alice status: ${tokenTransferRx3.status.toString()} \n`,
            );
        } catch {
            // TOKEN QUERY TO CHECK PAUSE
            tokenInfo = await tQueryFcn();
            console.log(
                `- NFT transfer unsuccessful: Token ${tokenId.toString()} is paused (${tokenInfo.pauseStatus.toString()})`,
            );
        }

        // PAUSE ALL TOKEN OEPRATIONS
        let tokenUnpauseTx = await new TokenUnpauseTransaction()
            .setTokenId(tokenId)
            .freezeWith(client)
            .sign(pauseKey);
        let tokenUnpauseSubmitTx = await tokenUnpauseTx.execute(client);
        let tokenUnpauseRx = await tokenUnpauseSubmitTx.getReceipt(client);
        console.log(`- Token unpause: ${tokenUnpauseRx.status.toString()}\n`);

        // FREEZE ALICE'S ACCOUNT FOR THIS TOKEN
        let tokenFreezeTx = await new TokenFreezeTransaction()
            .setTokenId(tokenId)
            .setAccountId(aliceId)
            .freezeWith(client)
            .sign(freezeKey);
        let tokenFreezeSubmit = await tokenFreezeTx.execute(client);
        let tokenFreezeRx = await tokenFreezeSubmit.getReceipt(client);
        console.log(
            `- Freeze Alice's account for token ${tokenId.toString()}: ${tokenFreezeRx.status.toString()}`,
        );

        // TEST THE TOKEN FREEZE FOR THE ACCOUNT BY TRYING A TRANSFER (ALICE -> BOB)
        try {
            let tokenTransferTx4 = await new TransferTransaction()
                .addNftTransfer(tokenId, 2, aliceId, bobId)
                .addHbarTransfer(aliceId, 100)
                .addHbarTransfer(bobId, -100)
                .freezeWith(client)
                .sign(aliceKey);
            let tokenTransferTx4Sign = await tokenTransferTx4.sign(bobKey);
            let tokenTransferSubmit4 =
                await tokenTransferTx4Sign.execute(client);
            let tokenTransferRx4 =
                await tokenTransferSubmit4.getReceipt(client);
            console.log(
                `\n-NFT transfer Alice->Bob status: ${tokenTransferRx4.status.toString()} \n`,
            );
        } catch {
            console.log(
                `- Operation unsuccessful: The account is frozen for this token`,
            );
        }
        // UNFREEZE ALICE'S ACCOUNT FOR THIS TOKEN
        let tokenUnfreezeTx = await new TokenUnfreezeTransaction()
            .setTokenId(tokenId)
            .setAccountId(aliceId)
            .freezeWith(client)
            .sign(freezeKey);
        let tokenUnfreezeSubmit = await tokenUnfreezeTx.execute(client);
        let tokenUnfreezeRx = await tokenUnfreezeSubmit.getReceipt(client);
        console.log(
            `- Unfreeze Alice's account for token ${tokenId.toString()}: ${tokenUnfreezeRx.status.toString()}\n`,
        );

        // WIPE THE TOKEN FROM ALICE'S ACCOUNT
        let tokenWipeTx = await new TokenWipeTransaction()
            .setAccountId(aliceId)
            .setTokenId(tokenId)
            .setSerials([2])
            .freezeWith(client)
            .sign(wipeKey);
        let tokenWipeSubmitTx = await tokenWipeTx.execute(client);
        let tokenWipeRx = await tokenWipeSubmitTx.getReceipt(client);
        console.log(
            `- Wipe token ${tokenId.toString()} from Alice's account: ${tokenWipeRx.status.toString()}`,
        );

        // CHECK ALICE'S BALANCE
        aB = await bCheckerFcn(aliceId);
        console.log(
            `- Alice balance: ID:${tokenId.toString()} and ${aB.toString()}`,
        );

        // TOKEN QUERY TO CHECK TOTAL TOKEN SUPPLY
        tokenInfo = await tQueryFcn();
        console.log(
            `- Current NFT supply: ${tokenInfo.totalSupply.toString()}`,
        );

        // DELETE THE TOKEN
        let tokenDeleteTx = new TokenDeleteTransaction()
            .setTokenId(tokenId)
            .freezeWith(client);
        let tokenDeleteSign = await tokenDeleteTx.sign(adminKey);
        let tokenDeleteSubmit = await tokenDeleteSign.execute(client);
        let tokenDeleteRx = await tokenDeleteSubmit.getReceipt(client);
        console.log(
            `\n- Delete token ${tokenId.toString()}: ${tokenDeleteRx.status.toString()}`,
        );

        // TOKEN QUERY TO CHECK DELETION
        tokenInfo = await tQueryFcn();
        console.log(
            `- Token ${tokenId.toString()} is deleted: ${tokenInfo.isDeleted.toString()}`,
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

        /**
         * KYC ENABLE FUNCTION
         * @param {string | AccountId} id
         * @returns {Promise<TransactionReceipt>}
         */
        async function kycEnableFcn(id) {
            let kycEnableTx = await new TokenGrantKycTransaction()
                .setAccountId(id)
                .setTokenId(tokenId)
                .freezeWith(client)
                .sign(kycKey);
            let kycSubmitTx = await kycEnableTx.execute(client);
            return kycSubmitTx.getReceipt(client);
        }

        /**
         * TOKEN QUERY FUNCTION
         * @returns {Promise<TokenInfo>}
         */
        async function tQueryFcn() {
            return new TokenInfoQuery().setTokenId(tokenId).execute(client);
        }
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
