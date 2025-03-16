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
} from "@hashgraph/sdk";

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
        let transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(newKey.publicKey)
            .setInitialBalance(new Hbar(2))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        let resp = await transaction.executeWithSigner(wallet);

        const transactionReceipt = await resp.getReceiptWithSigner(wallet);
        const newAccountId = transactionReceipt.accountId;

        console.log(`account id = ${newAccountId.toString()}`);

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
