import {
    MirrorNodeAccountBalanceQuery,
    Client,
    AccountId,
    PrivateKey,
    Hbar,
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

    const senderBalanceAfter = await hbarBalance(
        client,
        operatorId,
        senderBalanceBefore,
    );
    const recipientBalanceAfter = await hbarBalance(
        client,
        recipientId,
        recipientBalanceBefore,
    );

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
 * after a transaction can still return the previous value. Pass `previous` to
 * poll until the value moves; the loop is bounded so an example cannot hang.
 *
 * @param {import("@hiero-ledger/sdk").Client} client
 * @param {import("@hiero-ledger/sdk").AccountId | string} accountId
 * @param {import("@hiero-ledger/sdk").Hbar} [previous]
 * @returns {Promise<import("@hiero-ledger/sdk").Hbar>}
 */
async function hbarBalance(client, accountId, previous) {
    return untilMirror(async () => {
        const { hbars } = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);

        // Without a previous value there is nothing to wait for.
        if (previous == null) {
            return hbars;
        }

        return hbars.toTinybars().equals(previous.toTinybars()) ? null : hbars;
    });
}

/**
 * Poll a mirror-node read until it reflects the transaction that just happened.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Polling to a deadline
 * beats a fixed sleep: it does not go flaky on a slow runner and does not waste
 * time on a fast one.
 *
 * @template T
 * @param {() => Promise<T | null>} read - resolves the value once it is ready
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
async function untilMirror(read, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = await read();
        if (result != null) {
            return result;
        }
        if (Date.now() >= deadline) {
            throw new Error("mirror node did not ingest in time");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}
