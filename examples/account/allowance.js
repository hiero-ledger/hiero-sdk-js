import {
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    TransactionId,
    AccountAllowanceApproveTransaction,
    TransferTransaction,
    Hbar,
    Status,
} from "@hiero-ledger/sdk";
import { retryOnStatus, untilMirror } from "../wait-for-mirror.js";

/**
 * @typedef {import("@hiero-ledger/sdk").AccountId} AccountId
 */

import dotenv from "dotenv";

dotenv.config();

/**
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

    console.log("Generating accounts for example...");

    const aliceKey = PrivateKey.generateECDSA();
    const bobKey = PrivateKey.generateECDSA();
    const charlieKey = PrivateKey.generateECDSA();

    try {
        let transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(aliceKey)
            .setInitialBalance(new Hbar(5))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        const response = await transaction.executeWithSigner(wallet);

        const aliceId = (await response.getReceiptWithSigner(wallet)).accountId;

        transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(bobKey)
            .setInitialBalance(new Hbar(5))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);

        const bobId = (
            await (
                await transaction.executeWithSigner(wallet)
            ).getReceiptWithSigner(wallet)
        ).accountId;

        transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(charlieKey)
            .setInitialBalance(new Hbar(5))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);

        const charlieId = (
            await (
                await transaction.executeWithSigner(wallet)
            ).getReceiptWithSigner(wallet)
        ).accountId;

        console.log(`Alice ID:  ${aliceId.toString()}`);
        console.log(`Bob ID:  ${bobId.toString()}`);
        console.log(`Charlie ID:  ${charlieId.toString()}`);

        let balances = await printBalances(
            wallet,
            aliceId,
            bobId,
            charlieId,
            undefined,
            true,
        );

        console.log(
            "Approving an allowance of 2 Hbar with owner Alice and spender Bob",
        );

        await (
            await (
                await (
                    await (
                        await new AccountAllowanceApproveTransaction()
                            .approveHbarAllowance(aliceId, bobId, new Hbar(2))
                            .freezeWithSigner(wallet)
                    ).sign(aliceKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        balances = await printBalances(wallet, aliceId, bobId, charlieId);

        console.log(
            "Transferring 1 Hbar from Alice to Charlie, but the transaction is signed _only_ by Bob (Bob is dipping into his allowance from Alice)",
        );

        await (
            await (
                await (
                    await (
                        await new TransferTransaction()
                            // "addApproved*Transfer()" means that the transfer has been approved by an allowance
                            .addApprovedHbarTransfer(
                                aliceId,
                                new Hbar(1).negated(),
                            )
                            .addHbarTransfer(charlieId, new Hbar(1))
                            // The allowance spender must pay the fee for the transaction.
                            // use setTransactionId() to set the account ID that will pay the fee for the transaction.
                            .setTransactionId(TransactionId.generate(bobId))
                            .freezeWithSigner(wallet)
                    ).sign(bobKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(
            "Transfer succeeded.  Bob should now have 1 Hbar left in his allowance.",
        );

        balances = await printBalances(
            wallet,
            aliceId,
            bobId,
            charlieId,
            balances,
        );

        try {
            console.log(
                "Attempting to transfer 2 Hbar from Alice to Charlie using Bob's allowance.",
            );
            console.log(
                "This should fail, because there is only 1 Hbar left in Bob's allowance.",
            );

            await (
                await (
                    await (
                        await (
                            await new TransferTransaction()
                                .addApprovedHbarTransfer(
                                    aliceId,
                                    new Hbar(2).negated(),
                                )
                                .addHbarTransfer(charlieId, new Hbar(2))
                                .setTransactionId(TransactionId.generate(bobId))
                                .freezeWithSigner(wallet)
                        ).sign(bobKey)
                    ).signWithSigner(wallet)
                ).executeWithSigner(wallet)
            ).getReceiptWithSigner(wallet);

            console.log("The transfer succeeded.  This should not happen.");
        } catch (error) {
            console.log("The transfer failed as expected.");
            console.log(/** @type {Error} */ (error).message);
        }

        console.log("Adjusting Bob's allowance to 3 Hbar.");

        await (
            await (
                await (
                    await (
                        await new AccountAllowanceApproveTransaction()
                            .approveHbarAllowance(aliceId, bobId, new Hbar(3))
                            .freezeWithSigner(wallet)
                    ).sign(aliceKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log(
            "Attempting to transfer 2 Hbar from Alice to Charlie using Bob's allowance again.",
        );
        console.log("This time it should succeed.");

        await (
            await (
                await (
                    await (
                        await new TransferTransaction()
                            .addApprovedHbarTransfer(
                                aliceId,
                                new Hbar(2).negated(),
                            )
                            .addHbarTransfer(charlieId, new Hbar(2))
                            .setTransactionId(TransactionId.generate(bobId))
                            .freezeWithSigner(wallet)
                    ).sign(bobKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log("Transfer succeeded.");

        await printBalances(wallet, aliceId, bobId, charlieId, balances);

        console.log("Deleting Bob's allowance");

        await (
            await (
                await (
                    await (
                        await new AccountAllowanceApproveTransaction()
                            .approveHbarAllowance(
                                aliceId,
                                bobId,
                                Hbar.fromTinybars(0),
                            )
                            .freezeWithSigner(wallet)
                    ).sign(aliceKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        console.log("Cleaning up...");

        await (
            await (
                await (
                    await (
                        await new AccountDeleteTransaction()
                            .setAccountId(aliceId)
                            .setTransferAccountId(wallet.getAccountId())
                            .freezeWithSigner(wallet)
                    ).sign(aliceKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        await (
            await (
                await (
                    await (
                        await new AccountDeleteTransaction()
                            .setAccountId(bobId)
                            .setTransferAccountId(wallet.getAccountId())
                            .freezeWithSigner(wallet)
                    ).sign(bobKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        await (
            await (
                await (
                    await (
                        await new AccountDeleteTransaction()
                            .setAccountId(charlieId)
                            .setTransferAccountId(wallet.getAccountId())
                            .freezeWithSigner(wallet)
                    ).sign(charlieKey)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

/**
 * @param {Wallet} wallet
 * @param {AccountId} aliceId
 * @param {AccountId} bobId
 * @param {AccountId} charlieId
 * @param {{alice: import("@hiero-ledger/sdk").AccountBalance, bob: import("@hiero-ledger/sdk").AccountBalance, charlie: import("@hiero-ledger/sdk").AccountBalance}} [previous]
 * @param {boolean} [retryMissing]
 * @returns {Promise<{alice: import("@hiero-ledger/sdk").AccountBalance, bob: import("@hiero-ledger/sdk").AccountBalance, charlie: import("@hiero-ledger/sdk").AccountBalance}>}
 */
async function printBalances(
    wallet,
    aliceId,
    bobId,
    charlieId,
    previous,
    retryMissing = false,
) {
    // HBAR balances come from the mirror node now that the consensus node no
    // longer serves them; the wallet's provider wraps that query.
    const provider = wallet.getProvider();

    if (provider == null) {
        throw new Error("wallet does not contain a provider");
    }

    const alice = await accountBalance(
        provider,
        aliceId,
        previous?.alice,
        retryMissing,
    );
    console.log(`Alice's balance: ${alice.hbars.toString()}`);

    const bob = await accountBalance(
        provider,
        bobId,
        previous?.bob,
        retryMissing,
    );
    console.log(`Bob's balance: ${bob.hbars.toString()}`);

    const charlie = await accountBalance(
        provider,
        charlieId,
        previous?.charlie,
        retryMissing,
    );
    console.log(`Charlie's balance: ${charlie.hbars.toString()}`);

    return { alice, bob, charlie };
}

/**
 * @param {import("@hiero-ledger/sdk").Provider} provider
 * @param {AccountId} accountId
 * @param {import("@hiero-ledger/sdk").AccountBalance} [previous]
 * @param {boolean} retryMissing
 * @returns {Promise<import("@hiero-ledger/sdk").AccountBalance>}
 */
function accountBalance(provider, accountId, previous, retryMissing = false) {
    return untilMirror(
        async () => {
            const balance = await provider.getAccountBalance(accountId);
            return previous != null &&
                balance.hbars.toTinybars().equals(previous.hbars.toTinybars())
                ? null
                : balance;
        },
        {
            retryError: retryMissing
                ? retryOnStatus(Status.InvalidAccountId)
                : undefined,
        },
    );
}

void main();
