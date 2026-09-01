import {
    AccountId,
    Client,
    MirrorNodeAccountBalanceQuery,
    PrivateKey,
    Status,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to read an account balance from the mirror node REST API instead of the
 * deprecated consensus-node `AccountBalanceQuery`.
 *
 * Note: the mirror node is eventually consistent, so a balance read right
 * after a transaction may lag the network by a few seconds — and an account
 * created moments ago fails with `INVALID_ACCOUNT_ID` until it is ingested.
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
        if (error.status === Status.InvalidAccountId) {
            console.error(`${operatorId.toString()} does not exist`);
        } else {
            console.error(error);
        }
    }

    client.close();
}

void main();
