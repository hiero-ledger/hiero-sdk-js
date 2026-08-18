import { Wallet, LocalProvider } from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to read the HBAR balance of the wallet's own account.
 *
 * `Wallet.getAccountBalance()` is backed by the mirror node now that the
 * consensus node no longer serves `CryptoService/cryptoGetBalance`. Two things
 * follow from that:
 *
 * - The `tokens` and `tokenDecimals` maps on the result are always empty. Use
 *   `MirrorNodeTokenBalanceQuery` to read a token balance.
 * - The mirror node lags consensus by a few seconds, so a balance read straight
 *   after a transfer may still show the pre-transfer value.
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

    try {
        const balance = await wallet.getAccountBalance();

        console.log(
            `${wallet
                .getAccountId()
                .toString()} balance = ${balance.hbars.toString()}`,
        );
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
