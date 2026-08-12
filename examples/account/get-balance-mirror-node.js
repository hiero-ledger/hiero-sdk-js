import {
    AccountId,
    Client,
    MirrorNodeAccountBalanceQuery,
    PrivateKey,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to read an account balance from the mirror node REST API instead of the
 * deprecated consensus-node `AccountBalanceQuery`.
 *
 * Note: the mirror node lags consensus by a few seconds, so a balance read
 * right after a transfer may still show the pre-transfer value.
 */
async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, OPERATOR_KEY, and HEDERA_NETWORK are required.",
        );
    }

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    try {
        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(client);

        console.log(
            `${operatorId.toString()} balance = ${balance.hbars.toString()}`,
        );
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
