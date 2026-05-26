import { AccountId, PrivateKey } from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

function main() {
    /* Source and context: https://hips.hedera.com/hip/hip-583

        In hedera Hedera, we have the concept of 4 different account representations
            -   An account can have an account ID in shard.realm.accountNumber format (0.0.10)
            -   An account can have a public key alias in 0.0.CIQNOWUYAGBLCCVX2VF75U6JMQDTUDXBOLZ5VJRDEWXQEGTI64DVCGQ format
            -   An account can have an AccountId that is represented in 0x000000000000000000000000000000000000000a (for account ID 0.0.10) long zero format
            -   An account has been represented by an Ethereum public address 0xb794f5ea0ba39494ce839613fffba74279579268
    */

    /*
        Account ID    -   shard.realm.number format, i.e. `0.0.10` with the corresponding `0x000000000000000000000000000000000000000a` ethereum address
    */
    const hederaFormat = AccountId.fromString("0.0.10");
    console.log(`Account ID: ${hederaFormat.toString()}`);
    console.log(
        `Account 0.0.10 corresponding Long-Zero address: ${hederaFormat.toEvmAddress()}`,
    );

    /*
        Hedera Long-Form Account ID    -   0.0.aliasPublicKey, i.e. `0.0.CIQNOWUYAGBLCCVX2VF75U6JMQDTUDXBOLZ5VJRDEWXQEGTI64DVCGQ`
   */
    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey;

    // Assuming that the target shard and realm are known.
    // For now they are virtually always 0 and 0.
    const aliasAccountId = publicKey.toAccountId(0, 0);
    console.log(`Hedera Long-Form Account ID: ${aliasAccountId.toString()}`);

    /*
        Hedera Account Long-Zero address    -   0x000000000000000000000000000000000000000a (for accountId 0.0.10)
    */
    const longZeroAddress = AccountId.fromString(
        "0x000000000000000000000000000000000000000a",
    );
    console.log(
        `Hedera Account Long-Zero address: ${longZeroAddress.toString()}`,
    );

    /*
        Ethereum Account Address / public-address   -   0xb794f5ea0ba39494ce839613fffba74279579268
    */
    const evmAddress = AccountId.fromString(
        "0xb794f5ea0ba39494ce839613fffba74279579268",
    );
    console.log(
        `Ethereum Account Address / public-address: ${evmAddress.toString()}`,
    );

    if (
        hederaFormat.toString() &&
        longZeroAddress.toString() &&
        aliasAccountId.toString() &&
        evmAddress.toString()
    ) {
        process.exit(0);
    }

    process.exit(1);
}

void main();
