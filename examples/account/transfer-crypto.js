import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    AccountBalanceQuery,
    TransferTransaction,
} from "@hiero-ledger/sdk";

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
    const senderBalanceBefore = (
        await new AccountBalanceQuery().setAccountId(operatorId).execute(client)
    ).hbars;
    const recipientBalanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(recipientId)
            .execute(client)
    ).hbars;

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

    // Step 3: Check Hbar balance of sender and recipient after the transfer.
    const senderBalanceAfter = (
        await new AccountBalanceQuery().setAccountId(operatorId).execute(client)
    ).hbars;
    const recipientBalanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(recipientId)
            .execute(client)
    ).hbars;

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
