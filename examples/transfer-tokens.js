/**
 * Example demonstrating token lifecycle operations:
 * Creating accounts, tokens, associating them, transferring tokens,
 * wiping balances, and cleaning up resources.
 */

import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    Wallet,
    LocalProvider,
    PrivateKey,
    Hbar,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenDeleteTransaction,
    TokenGrantKycTransaction,
    TransferTransaction,
    TokenWipeTransaction,
    TransactionId,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

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

    const provider = new LocalProvider();

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        provider,
    );

    const newKey = PrivateKey.generate();

    console.log(`private key = ${newKey.toString()}`);
    console.log(`public key = ${newKey.publicKey.toString()}`);

    try {
        // Create a new account with the generated public key and initial balance
        let transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(newKey.publicKey)
            .setInitialBalance(new Hbar(2))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        let resp = await transaction.executeWithSigner(wallet);

        const transactionReceipt = await resp.getReceiptWithSigner(wallet);
        const newAccountId = transactionReceipt.accountId;

        console.log(`account id = ${newAccountId.toString()}`);

        // Create a new fungible token with 3 decimals and various control keys
        // The treasury account (operator) will initially hold the total supply
        let tokenCreateTransaction = await new TokenCreateTransaction()
            .setNodeAccountIds([resp.nodeId])
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setDecimals(3)
            .setInitialSupply(100)
            .setTreasuryAccountId(wallet.getAccountId())
            .setAdminKey(wallet.getAccountKey())
            .setFreezeKey(wallet.getAccountKey())
            .setWipeKey(wallet.getAccountKey())
            .setKycKey(wallet.getAccountKey())
            .setSupplyKey(wallet.getAccountKey())
            .setFreezeDefault(false)
            .freezeWithSigner(wallet);
        tokenCreateTransaction =
            await tokenCreateTransaction.signWithSigner(wallet);
        resp = await tokenCreateTransaction.executeWithSigner(wallet);

        const tokenId = (await resp.getReceiptWithSigner(wallet)).tokenId;
        console.log(`token id = ${tokenId.toString()}`);

        // Associate the token with the new account so it can hold/receive the token
        // Both the account owner and operator must sign this transaction
        await (
            await (
                await (
                    await (
                        await new TokenAssociateTransaction()
                            .setNodeAccountIds([resp.nodeId])
                            .setAccountId(newAccountId)
                            .setTokenIds([tokenId])
                            .freezeWithSigner(wallet)
                    ).sign(newKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(
            `Associated account ${newAccountId.toString()} with token ${tokenId.toString()}`,
        );

        // Grant KYC permission to the account for this token
        // Required because the token has a KYC key defined
        await (
            await (
                await (
                    await new TokenGrantKycTransaction()
                        .setNodeAccountIds([resp.nodeId])
                        .setAccountId(newAccountId)
                        .setTokenId(tokenId)
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(
            `Granted KYC for account ${newAccountId.toString()} on token ${tokenId.toString()}`,
        );

        // Transfer 10 tokens from the treasury (operator) to the new account
        // Negative amount debits the sender, positive amount credits the receiver
        await (
            await (
                await (
                    await new TransferTransaction()
                        .setNodeAccountIds([resp.nodeId])
                        .addTokenTransfer(tokenId, wallet.getAccountId(), -10)
                        .addTokenTransfer(tokenId, newAccountId, 10)
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(
            `Sent 10 tokens from account ${wallet
                .getAccountId()
                .toString()} to account ${newAccountId.toString()} on token ${tokenId.toString()}`,
        );

        // Wipe the tokens from the account, removing them from circulation
        // Requires the wipe key to authorize this operation
        await (
            await (
                await (
                    await new TokenWipeTransaction()
                        .setNodeAccountIds([resp.nodeId])
                        .setTokenId(tokenId)
                        .setAccountId(newAccountId)
                        .setAmount(10)
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(`Wiped balance of account ${newAccountId.toString()}`);

        // Delete the token, permanently removing it from the network
        // Requires the admin key to authorize
        await (
            await (
                await (
                    await new TokenDeleteTransaction()
                        .setNodeAccountIds([resp.nodeId])
                        .setTokenId(tokenId)
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(`Deleted token ${tokenId.toString()}`);

        // Delete the account and transfer remaining balance to the operator
        // Requires signature from both the account being deleted and the operator
        await (
            await (
                await (
                    await (
                        await new AccountDeleteTransaction()
                            .setNodeAccountIds([resp.nodeId])
                            .setAccountId(newAccountId)
                            .setTransferAccountId(wallet.getAccountId())
                            .setTransactionId(
                                TransactionId.generate(newAccountId),
                            )
                            .setMaxTransactionFee(new Hbar(1))
                            .freezeWithSigner(wallet)
                    ).sign(newKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(`Deleted account ${newAccountId.toString()}`);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
