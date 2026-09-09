import {
    Wallet,
    LocalProvider,
    PrivateKey,
    KeyList,
    AccountCreateTransaction,
    Hbar,
    TransferTransaction,
    ScheduleSignTransaction,
    ScheduleInfoQuery,
    TransactionRecordQuery,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * @typedef {import("@hiero-ledger/sdk").AccountId} AccountId
 */

/**
 *
 */
async function main() {
    // set up wallet
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

    // generate keys
    const privateKeyList = [];
    const publicKeyList = [];
    for (let i = 0; i < 4; i++) {
        const privateKey = PrivateKey.generate();
        const publicKey = privateKey.publicKey;
        privateKeyList.push(privateKey);
        publicKeyList.push(publicKey);
        console.log(`${i + 1}. public key: ${publicKey.toString()}`);
        console.log(`${i + 1}. private key: ${privateKey.toString()}`);
    }
    const thresholdKey = new KeyList(publicKeyList, 3);

    try {
        // create multi-sig account
        let transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(thresholdKey)
            .setInitialBalance(Hbar.fromTinybars(1))
            .setAccountMemo("3-of-4 multi-sig account")
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        const txAccountCreate = await transaction.executeWithSigner(wallet);

        const txAccountCreateReceipt =
            await txAccountCreate.getReceiptWithSigner(wallet);
        const multiSigAccountId = txAccountCreateReceipt.accountId;
        console.log(
            `3-of-4 multi-sig account ID:  ${multiSigAccountId.toString()}`,
        );
        let balance = await queryBalance(multiSigAccountId, wallet);

        // schedule crypto transfer from multi-sig account to operator account
        const txSchedule = await (
            await (
                await (
                    await new TransferTransaction()
                        .addHbarTransfer(
                            multiSigAccountId,
                            Hbar.fromTinybars(-1),
                        )
                        .addHbarTransfer(
                            wallet.getAccountId(),
                            Hbar.fromTinybars(1),
                        )
                        .schedule() // create schedule
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).sign(privateKeyList[0])
        ) // add 1. signature
            .executeWithSigner(wallet);

        const txScheduleReceipt = await txSchedule.getReceiptWithSigner(wallet);
        console.log("Schedule status: " + txScheduleReceipt.status.toString());
        const scheduleId = txScheduleReceipt.scheduleId;
        console.log(`Schedule ID:  ${scheduleId.toString()}`);
        const scheduledTxId = txScheduleReceipt.scheduledTransactionId;
        console.log(`Scheduled tx ID:  ${scheduledTxId.toString()}`);

        // add 2. signature
        const txScheduleSign1 = await (
            await (
                await (
                    await new ScheduleSignTransaction()
                        .setScheduleId(scheduleId)
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).sign(privateKeyList[1])
        ).executeWithSigner(wallet);

        const txScheduleSign1Receipt =
            await txScheduleSign1.getReceiptWithSigner(wallet);
        console.log(
            "1. ScheduleSignTransaction status: " +
                txScheduleSign1Receipt.status.toString(),
        );
        balance = await queryBalance(multiSigAccountId, wallet, balance);

        // add 3. signature to trigger scheduled tx
        const txScheduleSign2 = await (
            await (
                await (
                    await new ScheduleSignTransaction()
                        .setScheduleId(scheduleId)
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).sign(privateKeyList[2])
        ).executeWithSigner(wallet);

        const txScheduleSign2Receipt =
            await txScheduleSign2.getReceiptWithSigner(wallet);
        console.log(
            "2. ScheduleSignTransaction status: " +
                txScheduleSign2Receipt.status.toString(),
        );
        await queryBalance(multiSigAccountId, wallet, balance);

        // query schedule
        const scheduleInfo = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .executeWithSigner(wallet);
        console.log(scheduleInfo);

        // query triggered scheduled tx
        const recordScheduledTx = await new TransactionRecordQuery()
            .setTransactionId(scheduledTxId)
            .executeWithSigner(wallet);
        console.log(recordScheduledTx);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

/**
 * Read an account's HBAR balance through the wallet's provider, which is backed
 * by the mirror node now that the consensus node no longer serves balances.
 *
 * The mirror node ingests consensus state asynchronously, so pass the balance
 * read before the last transaction to poll until the new value shows up.
 *
 * @param {AccountId} accountId
 * @param {Wallet} wallet
 * @param {Hbar} [previous]
 * @returns {Promise<Hbar>}
 */
async function queryBalance(accountId, wallet, previous) {
    const provider = wallet.getProvider();
    if (provider == null) {
        throw new Error("wallet does not contain a provider");
    }

    const balance = await untilMirror(async () => {
        const { hbars } = await provider.getAccountBalance(accountId);

        if (previous == null) {
            return hbars.toTinybars().toNumber() > 0 ? hbars : null;
        }

        return hbars.toTinybars().equals(previous.toTinybars()) ? null : hbars;
    });

    console.log(
        `Balance of account ${accountId.toString()}: ${balance
            .toTinybars()
            .toInt()} tinybar`,
    );
    return balance;
}

/**
 * Poll a mirror-node read until it reflects the transaction that just happened.
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

void main();
