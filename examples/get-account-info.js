import { Wallet, LocalProvider, AccountInfoQuery, Hbar } from "@hiero-ledger/sdk";

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

    try {
        const info = await new AccountInfoQuery()
            .setAccountId(wallet.getAccountId())
            .setQueryPayment(new Hbar(1))
            .executeWithSigner(wallet);

        console.log(
            `info.key                          = ${info.key.toString()}`,
        );

        console.log(
            `info.isReceiverSignatureRequired  =`,
            info.isReceiverSignatureRequired,
        );

        console.log(
            `info.expirationTime               = ${info.expirationTime
                .toDate()
                .toString()}`,
        );
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
