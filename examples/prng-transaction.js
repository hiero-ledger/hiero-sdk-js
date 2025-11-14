import { Wallet, LocalProvider, PrngTransaction } from "@hiero-ledger/sdk";

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
        let transaction = await new PrngTransaction()
            .setRange(100)
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        const response = await transaction.executeWithSigner(wallet);

        const record = await response.getRecordWithSigner(wallet);
        console.log(`The random number generated is: ${record.prngNumber}`);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
