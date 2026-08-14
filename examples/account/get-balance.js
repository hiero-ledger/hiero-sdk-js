import { Wallet, LocalProvider, AccountInfoQuery } from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to read the HBAR balance of the wallet's own account.
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

    const provider = new LocalProvider();

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        provider,
    );

    try {
        const info = await new AccountInfoQuery()
            .setAccountId(wallet.getAccountId())
            .executeWithSigner(wallet);

        console.log(
            `${wallet
                .getAccountId()
                .toString()} balance = ${info.balance.toString()}`,
        );
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
