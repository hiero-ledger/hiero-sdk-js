import {
    Client,
    AccountId,
    PrivateKey,
    AccountBalanceQuery,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to validate account ID checksum.
 *
 * Entity IDs, such as TokenId and AccountId, can be constructed from strings.
 * For example, the AccountId.fromString(inputString) static method will attempt to parse
 * the input string and construct the expected AccountId object, and will throw an
 * Error if the string is incorrectly formatted.
 *
 * From here on, we'll talk about methods on accountId, but equivalent methods exist
 * on every entity ID type.
 *
 * fromString() expects the input to look something like this: "1.2.3-asdfg".
 * Here, 1 is the shard, 2 is the realm, 3 is the number, and "asdfg" is the checksum.
 *
 * The checksum can be used to ensure that an entity ID was inputted correctly.
 * For example, if the string being parsed is from a config file, or from user input,
 * it could contain typos.
 *
 * You can use accountId.checksum to get the checksum of an accountId object that was constructed
 * using fromString(). This will be the checksum from the input string. fromString() will merely
 * parse the string and create an AccountId object with the expected shard, realm, num, and checksum
 * values. fromString() will NOT verify that the AccountId maps to a valid account on the Hedera
 * network, and it will not verify the checksum.
 *
 * To verify a checksum, call accountId.validateChecksum(client). If the checksum
 * is invalid, validateChecksum() will throw a BadEntityIdError, otherwise it will return normally.
 *
 * The validity of a checksum depends on which network the client is connected to (e.g. mainnet or
 * testnet or previewnet). For example, a checksum that is valid for a particular shard/realm/num
 * on mainnet will be INVALID for the same shard/realm/num on testnet.
 *
 * As far as fromString() is concerned, the checksum is optional.
 * If you use fromString() to generate an AccountId from a string that does not include a checksum,
 * such as "1.2.3", fromString() will work, but a read of the checksum property on the resulting
 * AccountId object will return null.
 *
 * Generally speaking, AccountId objects can come from three places:
 *   1) AccountId.fromString(inString)
 *   2) new AccountId(shard, realm, num)
 *   3) From the result of a query.
 *
 * In the first case, the AccountId object will have a checksum (the checksum property will not be
 * null) if the input string included a checksum, and it will not have a checksum if the string did
 * not include a checksum.
 *
 * In the second and third cases, the AccountId object will not have a checksum.
 *
 * If you call accountId.validateChecksum(client) and accountId has no checksum to validate,
 * validateChecksum() will silently pass, and will not throw an exception.
 *
 * accountId.toString() will stringify the account ID with no checksum,
 * accountId.toStringWithChecksum(client) will stringify the account ID with the correct checksum
 * for that shard/realm/num on the client's network.
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

    console.log("Validate Checksum Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Derive a correct-checksum form of the operator's ID for this network.
    const goodIdString = operatorId.toStringWithChecksum(client);
    // Build a deliberately corrupted checksum by replacing the 5-char checksum.
    const badIdString = goodIdString.replace(/-.{5}$/, "-aaaaa");

    // ---- Manual validation demo ----
    console.log("An example of manual checksum validation:");

    // (1) Parse without checksum: getChecksum() returns null.
    const noChecksumId = AccountId.fromString(operatorId.toString());
    console.log(`Parsed without checksum: ${noChecksumId.toString()}`);
    console.log(
        `Stored checksum: ${noChecksumId.checksum ?? "(none — fromString did not include one)"}`,
    );
    console.log(
        `Correct-for-this-network checksum form: ${noChecksumId.toStringWithChecksum(client)}`,
    );

    // (2) Parse a correct-checksum string: validateChecksum passes silently.
    const goodId = AccountId.fromString(goodIdString);
    goodId.validateChecksum(client);
    console.log(`Validated correct-checksum ID: ${goodIdString} (OK)`);

    // (3) Parse a bad-checksum string: validateChecksum throws.
    const badId = AccountId.fromString(badIdString);
    try {
        badId.validateChecksum(client);
        console.error(`Expected ${badIdString} to be rejected, but it passed.`);
    } catch (error) {
        console.log(
            `Rejected bad-checksum ID: ${badIdString} (${error instanceof Error ? error.message : String(error)})`,
        );
    }

    // ---- Automatic validation demo ----
    console.log("An example of automatic checksum validation:");
    client.setAutoValidateChecksums(true);

    // Happy path: a balance query with a good checksum succeeds.
    const balance = await new AccountBalanceQuery()
        .setAccountId(goodId)
        .execute(client);
    console.log(
        `Account Balance (good checksum ${goodIdString}): ${balance.hbars.toString()}`,
    );

    // Sad path: same query with a bad-checksum ID throws.
    try {
        await new AccountBalanceQuery().setAccountId(badId).execute(client);
        console.error(
            `Expected ${badIdString} to be rejected by auto-validation, but it passed.`,
        );
    } catch (error) {
        console.log(
            `Auto-validation rejected: ${badIdString} (${error instanceof Error ? error.message : String(error)})`,
        );
    }

    client.close();
    console.log("Validate Checksum Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
