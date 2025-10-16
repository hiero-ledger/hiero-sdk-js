import {
    AccountId,
    PrivateKey,
    TokenCreateTransaction,
    TokenType,
    TransferTransaction,
    CustomFractionalFee,
    Hbar,
    AccountCreateTransaction,
    LocalProvider,
    Wallet,
} from "@hashgraph/sdk";
import axios from "axios";

import dotenv from "dotenv";

dotenv.config();

/*
Example for HIP-573: Blanket exemptions for custom fee collectors

1. Create accounts A, B, and C
2. Create a fungible token that has three fractional fees
Fee #1 sends 1/100 of the transferred value to collector 0.0.A.
Fee #2 sends 2/100 of the transferred value to collector 0.0.B.
Fee #3 sends 3/100 of the transferred value to collector 0.0.C.
3. Collector 0.0.B sends 10_000 units of the token to 0.0.A.
4. Get the transaction fee for that transfer transaction
5. Show that the fee collector accounts in the custom fee list of the token
that was created was not charged a custom fee in the transfer

*/

async function main() {
    // If we weren't able to get them, we should throw a new error
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }
    // Configure accounts and client, and generate needed keys
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const provider = new LocalProvider();

    const wallet = new Wallet(operatorId, operatorKey, provider);

    /**
     *     Example 1
     *
     * Step 1
     *
     * Create accounts A, B, and C
     */

    let firstAccountPrivateKey = PrivateKey.generateECDSA();
    let firstAccountPublicKey = firstAccountPrivateKey.publicKey;

    let createAccountAtx = await new AccountCreateTransaction()
        .setKeyWithoutAlias(firstAccountPublicKey)
        .setInitialBalance(Hbar.fromString("1000"))
        .freezeWithSigner(wallet);
    createAccountAtx = await createAccountAtx.signWithSigner(wallet);

    let firstResponse = await createAccountAtx.executeWithSigner(wallet);
    const firstAccountId = (await firstResponse.getReceiptWithSigner(wallet))
        .accountId;

    const firstAccountWallet = new Wallet(
        firstAccountId,
        firstAccountPrivateKey,
        provider,
    );

    let secondAccountPrivateKey = PrivateKey.generateECDSA();
    let secondAccountPublicKey = secondAccountPrivateKey.publicKey;

    let createAccountBtx = await new AccountCreateTransaction()
        .setKeyWithoutAlias(secondAccountPublicKey)
        .setInitialBalance(Hbar.fromString("1000"))
        .freezeWithSigner(wallet);
    createAccountBtx = await createAccountBtx.signWithSigner(wallet);

    let secondResponse = await createAccountBtx.executeWithSigner(wallet);
    const secondAccountId = (await secondResponse.getReceiptWithSigner(wallet))
        .accountId;

    const secondAccountWallet = new Wallet(
        secondAccountId,
        secondAccountPrivateKey,
        provider,
    );

    let thirdAccountPrivateKey = PrivateKey.generateECDSA();
    let thirdAccountPublicKey = thirdAccountPrivateKey.publicKey;

    let createAccountCtx = await new AccountCreateTransaction()
        .setKeyWithoutAlias(thirdAccountPublicKey)
        .setInitialBalance(Hbar.fromString("1000"))
        .freezeWithSigner(wallet);
    createAccountCtx = await createAccountCtx.signWithSigner(wallet);

    let thirdResponse = await createAccountCtx.executeWithSigner(wallet);
    const thirdAccountId = (await thirdResponse.getReceiptWithSigner(wallet))
        .accountId;

    const thirdAccountWallet = new Wallet(
        thirdAccountId,
        thirdAccountPrivateKey,
        provider,
    );

    /**
     * Step 2
     *
     * 2. Create a fungible token that has three fractional fees
     * Fee #1 sends 1/100 of the transferred value to collector 0.0.A.
     * Fee #2 sends 2/100 of the transferred value to collector 0.0.B.
     * Fee #3 sends 3/100 of the transferred value to collector 0.0.C.
     */

    const fee = new CustomFractionalFee()
        .setFeeCollectorAccountId(firstAccountWallet.getAccountId())
        .setNumerator(1)
        .setDenominator(100)
        .setAllCollectorsAreExempt(true);

    const fee2 = new CustomFractionalFee()
        .setFeeCollectorAccountId(secondAccountWallet.getAccountId())
        .setNumerator(2)
        .setDenominator(100)
        .setAllCollectorsAreExempt(true);

    const fee3 = new CustomFractionalFee()
        .setFeeCollectorAccountId(thirdAccountWallet.getAccountId())
        .setNumerator(3)
        .setDenominator(100)
        .setAllCollectorsAreExempt(true);

    let tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("HIP-573 Token")
        .setTokenSymbol("H573")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(wallet.getAccountId())
        .setAutoRenewAccountId(wallet.getAccountId())
        .setAdminKey(wallet.getAccountKey())
        .setFreezeKey(wallet.getAccountKey())
        .setWipeKey(wallet.getAccountKey())
        .setInitialSupply(100000000) // Total supply = 100000000 / 10 ^ 2
        .setDecimals(2)
        .setCustomFees([fee, fee2, fee3])
        .setMaxTransactionFee(new Hbar(40))
        .freezeWithSigner(wallet);

    // TokenCreateTransaction should be also signed with all of the fee collector wallets
    // in the custom fee list of the token before executing the transaction
    tokenCreateTx = await tokenCreateTx.signWithSigner(wallet);
    tokenCreateTx = await tokenCreateTx.signWithSigner(firstAccountWallet);
    tokenCreateTx = await tokenCreateTx.signWithSigner(secondAccountWallet);
    tokenCreateTx = await tokenCreateTx.signWithSigner(thirdAccountWallet);

    // Submit the transaction to the Hedera network
    let tokenCreateSubmit = await tokenCreateTx.executeWithSigner(wallet);

    // Get transaction receipt information
    let tokenCreateRx = await tokenCreateSubmit.getReceiptWithSigner(wallet);
    let tokenId = tokenCreateRx.tokenId;
    console.log(`Created token with token id: ${tokenId.toString()}`);

    /**
     * Step 3
     *
     * Collector 0.0.B sends 10_000 units of the token to 0.0.A.
     */

    // First we transfer the amount from treasury account to second account
    let treasuryTokenTransferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, wallet.getAccountId(), -10000)
        .addTokenTransfer(tokenId, secondAccountWallet.getAccountId(), 10000)
        .freezeWithSigner(wallet);

    treasuryTokenTransferTx =
        await treasuryTokenTransferTx.signWithSigner(wallet);

    let treasuryTokenTransferSubmit =
        await treasuryTokenTransferTx.executeWithSigner(wallet);
    let status = (
        await treasuryTokenTransferSubmit.getReceiptWithSigner(wallet)
    ).status.toString();
    console.log(
        `Sending from treasury account to the second account - 'TransferTransaction' status: ${status}`,
    );

    let tokenTransferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, secondAccountWallet.getAccountId(), -10000)
        .addTokenTransfer(tokenId, firstAccountWallet.getAccountId(), 10000)
        .freezeWithSigner(wallet);

    // Sign the transaction also with the wallet of the sender
    tokenTransferTx = await tokenTransferTx.signWithSigner(wallet);
    tokenTransferTx = await tokenTransferTx.signWithSigner(secondAccountWallet);

    // Submit the transaction to the Hedera network
    let tokenTransferSubmit = await tokenTransferTx.executeWithSigner(wallet);

    /**
     * Step 4
     *
     * Get the transaction fee for that transfer transaction
     */

    // Get transaction record information
    let transactionFee = (await tokenTransferSubmit.getRecordWithSigner(wallet))
        .transactionFee;

    console.log(`Transaction fee: ${transactionFee.toString()}`);

    /**
     * Step 5
     *
     * Show that the fee collector accounts in the custom fee list
     * of the token that was created was not charged a custom fee in the transfer
     */

    // Wait some time for the mirror node to be updated
    await wait(10000);

    /**@type {number} */
    let firstAccountBalanceAfter;
    let link;
    let link2;
    let link3;
    if (
        process.env.HEDERA_NETWORK == "local-node" ||
        process.env.HEDERA_NETWORK == "localhost"
    ) {
        link = `http://127.0.0.1:5551/api/v1/accounts?account.id=${firstAccountId.toString()}`;
    } else {
        link = `https://${
            process.env.HEDERA_NETWORK
        }.mirrornode.hedera.com/api/v1/accounts?account.id=${firstAccountId.toString()}`;
    }

    try {
        /* eslint-disable */
        firstAccountBalanceAfter = (
            await axios.get(link)
        ).data.accounts[0].balance.tokens.find(
            (token) => token.token_id === tokenId.toString(),
        ).balance;
        /* eslint-enable */
    } catch (e) {
        console.log(e);
    }

    /**@type {number} */
    let secondAccountBalanceAfter;

    if (
        process.env.HEDERA_NETWORK == "local-node" ||
        process.env.HEDERA_NETWORK == "localhost"
    ) {
        link2 = `http://127.0.0.1:5551/api/v1/accounts?account.id=${secondAccountId.toString()}`;
    } else {
        link2 = `https://${
            process.env.HEDERA_NETWORK
        }.mirrornode.hedera.com/api/v1/accounts?account.id=${secondAccountId.toString()}`;
    }

    try {
        /* eslint-disable */
        secondAccountBalanceAfter = (
            await axios.get(link2)
        ).data.accounts[0].balance.tokens.find(
            (token) => token.token_id === tokenId.toString(),
        ).balance;
        /* eslint-enable */
    } catch (e) {
        console.log(e);
    }

    /**@type {number} */
    let thirdAccountBalanceAfter;

    if (
        process.env.HEDERA_NETWORK == "local-node" ||
        process.env.HEDERA_NETWORK == "localhost"
    ) {
        link3 = `http://127.0.0.1:5551/api/v1/accounts?account.id=${thirdAccountId.toString()}`;
    } else {
        link3 = `https://${
            process.env.HEDERA_NETWORK
        }.mirrornode.hedera.com/api/v1/accounts?account.id=${thirdAccountId.toString()}`;
    }

    try {
        /* eslint-disable */
        thirdAccountBalanceAfter = (
            await axios.get(link3)
        ).data.accounts[0].balance.tokens.find(
            (token) => token.token_id === tokenId.toString(),
        ).balance;
        /* eslint-enable */
    } catch (e) {
        console.log(e);
    }

    console.log(
        `First account balance after TransferTransaction: ${firstAccountBalanceAfter}`,
    );
    console.log(
        `Second account balance after TransferTransaction: ${secondAccountBalanceAfter}`,
    );
    console.log(
        `Third account balance after TransferTransaction: ${thirdAccountBalanceAfter}`,
    );

    if (
        firstAccountBalanceAfter === 10000 &&
        secondAccountBalanceAfter === 0 &&
        thirdAccountBalanceAfter === 0
    ) {
        console.log(
            `Fee collector accounts were not charged after transfer transaction`,
        );
    }

    provider.close();
}

/**
 * @param {number} timeout
 * @returns {Promise<any>}
 */
function wait(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

void main();
