import {
    Wallet,
    LocalProvider,
    PrivateKey,
    PublicKey,
    Hbar,
    AccountId,
    AccountBalanceQuery,
    AccountInfoQuery,
    TransferTransaction,
} from "@hashgraph/sdk";

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

    /*
     * Hedera supports a form of auto account creation.
     *
     * You can "create" an account by generating a private key, and then deriving the public key,
     * without any need to interact with the Hedera network.  The public key more or less acts as the user's
     * account ID.  This public key is an account's aliasKey: a public key that aliases (or will eventually alias)
     * to a Hedera account.
     *
     * An AccountId takes one of two forms: a normal AccountId with a null aliasKey member takes the form 0.0.123,
     * while an account ID with a non-null aliasKey member takes the form
     * 0.0.302a300506032b6570032100114e6abc371b82dab5c15ea149f02d34a012087b163516dd70f44acafabf7777
     * Note the prefix of "0.0." indicating the shard and realm.  Also note that the aliasKey is stringified
     * as a hex-encoded ASN1 DER representation of the key.
     *
     * An AccountId with an aliasKey can be used just like a normal AccountId for the purposes of queries and
     * transactions, however most queries and transactions involving such an AccountId won't work until Hbar has
     * been transferred to the aliasKey account.
     *
     * There is no record in the Hedera network of an account associated with a given aliasKey
     * until an amount of Hbar is transferred to the account.  The moment that Hbar is transferred to that aliasKey
     * AccountId is the moment that that account actually begins to exist in the Hiero ledger.
     */

    console.log('"Creating" a new account');

    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;

    // Assuming that the target shard and realm are known.
    // For now they are virtually always 0 and 0.
    const aliasAccountId = publicKey.toAccountId(0, 0);

    console.log(`New account ID: ${aliasAccountId.toString()}`);
    console.log(`Just the aliasKey: ${aliasAccountId.aliasKey.toString()}`);

    /*
     * Note that no queries or transactions have taken place yet.
     * This account "creation" process is entirely local.
     *
     * AccountId.fromString() can construct an AccountId with an aliasKey.
     * It expects a string of the form 0.0.123 in the case of a normal AccountId, or of the form
     * 0.0.302a300506032b6570032100114e6abc371b82dab5c15ea149f02d34a012087b163516dd70f44acafabf7777
     * in the case of an AccountId with aliasKey.  Note the prefix of "0.0." to indicate the shard and realm.
     *
     * If the shard and realm are known, you may use PublicKey.fromString().toAccountId() to construct the
     * aliasKey AccountId
     */

    AccountId.fromString(
        "0.0.302a300506032b6570032100114e6abc371b82dab5c15ea149f02d34a012087b163516dd70f44acafabf7777",
    );

    PublicKey.fromString(
        "302a300506032b6570032100114e6abc371b82dab5c15ea149f02d34a012087b163516dd70f44acafabf7777",
    ).toAccountId(0, 0);

    console.log("Transferring some Hbar to the new account");
    try {
        let transaction = await new TransferTransaction()
            .addHbarTransfer(wallet.getAccountId(), new Hbar(10).negated())
            .addHbarTransfer(aliasAccountId, new Hbar(10))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);

        const response = await transaction.executeWithSigner(wallet);
        await response.getReceiptWithSigner(wallet);

        const balance = await new AccountBalanceQuery()
            .setNodeAccountIds([response.nodeId])
            .setAccountId(aliasAccountId)
            .executeWithSigner(wallet);

        console.log(`Balances of the new account: ${balance.toString()}`);

        const info = await new AccountInfoQuery()
            .setNodeAccountIds([response.nodeId])
            .setAccountId(aliasAccountId)
            .executeWithSigner(wallet);

        console.log(`Info about the new account: ${info.toString()}`);

        /*
         * Note that once an account exists in the ledger, it is assigned a normal AccountId, which can be retrieved
         * via an AccountInfoQuery.
         *
         * Users may continue to refer to the account by its aliasKey AccountId, but they may also
         * now refer to it by its normal AccountId
         */

        console.log(`The normal account ID: ${info.accountId.toString()}`);
        console.log(`The alias key: ${info.aliasKey.toString()}`);

        console.log("Example complete!");
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
