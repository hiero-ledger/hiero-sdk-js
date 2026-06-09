import {
    Client,
    Transaction,
    Hbar,
    TransactionId,
    PrivateKey,
    AccountId,
} from "@hiero-ledger/sdk";

import { getKeyFromString } from "../utils/key";

interface ApplyCommonTransactionInputParams {
    readonly transactionId?: string;
    readonly maxTransactionFee?: number;
    readonly validTransactionDuration?: number;
    readonly memo?: string;
    readonly regenerateTransactionId?: boolean;
    readonly signers?: string[];
    /** HIP-1313 high-volume entity creation opt-in. */
    readonly highVolume?: boolean;
}

export const applyCommonTransactionParams = (
    params: ApplyCommonTransactionInputParams,
    transaction: Transaction,
    client: Client,
): void => {
    const {
        transactionId = "",
        maxTransactionFee = 0,
        validTransactionDuration = 0,
        memo = "",
        regenerateTransactionId = false,
        signers = [],
        highVolume,
    } = params;

    if (transactionId) {
        try {
            const txId = TransactionId.fromString(transactionId);
            transaction.setTransactionId(txId);
        } catch (error) {
            const txId = TransactionId.generate(
                AccountId.fromString(transactionId),
            );
            transaction.setTransactionId(txId);
        }
    }

    if (maxTransactionFee) {
        transaction.setMaxTransactionFee(Hbar.fromTinybars(maxTransactionFee));
    }

    if (validTransactionDuration) {
        transaction.setTransactionValidDuration(
            validTransactionDuration * 1000, // Duration is in milliseconds
        );
    }

    if (memo) {
        transaction.setTransactionMemo(memo);
    }

    if (regenerateTransactionId) {
        transaction.setRegenerateTransactionId(regenerateTransactionId);
    }

    // HIP-1313: opt into the high-volume entity creation throttle bucket.
    // Apply before freeze() so the flag is included in the signed body.
    if (highVolume != null) {
        transaction.setHighVolume(highVolume);
    }

    if (signers.length > 0) {
        transaction.freezeWith(client);

        for (const signer of signers) {
            transaction.sign(getKeyFromString(signer) as PrivateKey);
        }
    }
};
