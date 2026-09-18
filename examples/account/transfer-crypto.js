import {
    MirrorNodeAccountBalanceQuery,
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    TransferTransaction,
    Status,
} from "@hiero-ledger/sdk";
import { retryOnStatus, untilMirror } from "../wait-for-mirror.js";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to transfer Hbar between accounts.
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

    console.log("Transfer Crypto Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    const recipientId = AccountId.fromString("0.0.3");

    // Step 1: Check Hbar balance of sender and recipient.
    const senderBalanceBefore = await hbarBalance(client, operatorId);
    const recipientBalanceBefore = await hbarBalance(client, recipientId);

    console.log(
        `Sender (${operatorId.toString()}) balance before transfer: ${senderBalanceBefore.toString()}`,
    );
    console.log(
        `Recipient (${recipientId.toString()}) balance before transfer: ${recipientBalanceBefore.toString()}`,
    );

    // Step 2: Execute the transfer transaction to send Hbars from operator to recipient.
    console.log("Executing the transfer transaction...");
    const transferAmount = new Hbar(1);
    const transferTxResponse = await new TransferTransaction()
        // addHbarTransfer can be called as many times as you want as long as the total
        // sum of inputs and outputs is zero.
        .addHbarTransfer(operatorId, transferAmount.negated())
        .addHbarTransfer(recipientId, transferAmount)
        .setTransactionMemo("Transfer example")
        .execute(client);

    const record = await transferTxResponse.getRecord(client);
    console.log(`Transferred ${transferAmount.toString()}`);
    console.log(`Transfer memo: ${record.transactionMemo}`);

    // 0.0.3 is also a node account and may receive node fees while this runs,
    // so wait for at least this transfer's credit instead of an exact value.
    const minimumRecipientBalance = Hbar.fromTinybars(
        recipientBalanceBefore.toTinybars().add(transferAmount.toTinybars()),
    );
    const recipientBalanceAfter = await hbarBalance(
        client,
        recipientId,
        minimumRecipientBalance,
    );
    const senderBalanceAfter = await hbarBalance(client, operatorId);
    if (
        !senderBalanceAfter
            .toTinybars()
            .lessThan(
                senderBalanceBefore
                    .toTinybars()
                    .subtract(transferAmount.toTinybars()),
            )
    ) {
        throw new Error("sender balance did not include the transfer and fee");
    }

    console.log(
        `Sender (${operatorId.toString()}) balance after transfer: ${senderBalanceAfter.toString()}`,
    );
    console.log(
        `Recipient (${recipientId.toString()}) balance after transfer: ${recipientBalanceAfter.toString()}`,
    );

    client.close();
    console.log("Example complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

/**
 * Read an HBAR balance from the mirror node.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Pass `minimum` to
 * poll until at least that value is visible. A lower bound is required for
 * node accounts because unrelated node fees can increase their balance too.
 *
 * @param {import("@hiero-ledger/sdk").Client} client
 * @param {import("@hiero-ledger/sdk").AccountId | string} accountId
 * @param {import("@hiero-ledger/sdk").Hbar} [minimum]
 * @param {boolean} [retryMissing]
 * @returns {Promise<import("@hiero-ledger/sdk").Hbar>}
 */
async function hbarBalance(client, accountId, minimum, retryMissing = false) {
    return untilMirror(
        async (remainingMs) => {
            const { hbars } = await new MirrorNodeAccountBalanceQuery()
                .setAccountId(accountId)
                .execute(client, remainingMs);

            if (minimum == null) {
                return hbars;
            }

            return hbars.toTinybars().greaterThanOrEqual(minimum.toTinybars())
                ? hbars
                : null;
        },
        {
            retryError: retryMissing
                ? retryOnStatus(Status.InvalidAccountId)
                : undefined,
        },
    );
}
