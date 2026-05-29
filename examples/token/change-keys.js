import {
    AccountId,
    Client,
    PrivateKey,
    Logger,
    LogLevel,
    PublicKey,
    KeyList,
    TokenUpdateTransaction,
    TokenKeyValidation,
    TokenCreateTransaction,
    TokenType,
    TokenInfoQuery,
} from "@hiero-ledger/sdk";
import dotenv from "dotenv";

/**
 * @description Change ot remove token keys
 */

async function main() {
    // Ensure required environment variables are available
    dotenv.config();
    if (
        !process.env.OPERATOR_KEY ||
        !process.env.OPERATOR_ID ||
        !process.env.HEDERA_NETWORK
    ) {
        throw new Error("Please set required keys in .env file.");
    }

    const network = process.env.HEDERA_NETWORK;

    // Configure client using environment variables
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    // Set logger
    const infoLogger = new Logger(LogLevel.Info);
    client.setLogger(infoLogger);

    const adminKey = PrivateKey.generateECDSA();
    const supplyKey = PrivateKey.generateECDSA();
    const newSupplyKey = PrivateKey.generateECDSA();
    const wipeKey = PrivateKey.generateECDSA();
    const freezeKey = PrivateKey.generateECDSA();
    const pauseKey = PrivateKey.generateECDSA();
    const feeScheduleKey = PrivateKey.generateECDSA();
    const metadataKey = PrivateKey.generateECDSA();

    // This HIP introduces ability to remove lower-privilege keys (Wipe, KYC, Freeze, Pause, Supply, Fee Schedule, Metadata) from a Token:
    // - using an update with the empty KeyList;
    const emptyKeyList = KeyList.of();
    // - updating with an “invalid” key such as an Ed25519 0x0000000000000000000000000000000000000000000000000000000000000000 public key,
    // since it is (presumably) impossible to find the 32-byte string whose SHA-512 hash begins with 32 bytes of zeros.
    const unusableKey = PublicKey.unusableKey();

    console.log("=====================================================");
    console.log("Initializing token keys...");
    console.log("-----------------------------------------------------");
    console.log("Admin key:", adminKey.publicKey.toString());
    console.log("Supply key:", supplyKey.publicKey.toString());
    console.log("New supply key:", newSupplyKey.publicKey.toString());
    console.log("Wipe key:", wipeKey.publicKey.toString());
    console.log("Freeze key:", freezeKey.publicKey.toString());
    console.log("Pause key:", pauseKey.publicKey.toString());
    console.log("Fee schedule key:", feeScheduleKey.publicKey.toString());
    console.log("Metadata key:", metadataKey.publicKey.toString());
    console.log("Unusable key:", unusableKey.toString());
    console.log("=====================================================");
    console.log("\n");

    let token, tokenInfo, response, receipt, update;

    console.log("=====================================================");
    console.log("Creating token...");
    console.log("-----------------------------------------------------");
    token = new TokenCreateTransaction()
        .setTokenName("Token")
        .setTokenSymbol("T")
        .setTokenType(TokenType.NonFungibleUnique)
        .setTreasuryAccountId(operatorId)
        .setAdminKey(adminKey)
        .setWipeKey(wipeKey)
        .setFreezeKey(freezeKey)
        .setPauseKey(pauseKey)
        .setSupplyKey(supplyKey)
        .setFeeScheduleKey(feeScheduleKey)
        .setMetadataKey(metadataKey)
        .freezeWith(client);

    response = await (await token.sign(adminKey)).execute(client);

    receipt = await response.getReceipt(client);
    console.log("Token create transction status:", receipt.status.toString());

    const tokenId = receipt.tokenId;
    console.log("Token id:", tokenId.toString());
    console.log("=====================================================");
    console.log("\n");
    console.log("=====================================================");
    console.log("Token keys:");
    console.log("-----------------------------------------------------");
    tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);

    console.log("Token admin key:", tokenInfo.adminKey.toString());
    console.log("Token pause key:", tokenInfo.pauseKey.toString());
    console.log("Token freeze key:", tokenInfo.freezeKey.toString());
    console.log("Token wipe key:", tokenInfo.wipeKey.toString());
    console.log("Token supply key:", tokenInfo.supplyKey.toString());
    console.log("Token fee schedule key:", tokenInfo.feeScheduleKey.toString());
    console.log("Token metadata key:", tokenInfo.metadataKey.toString());
    console.log("=====================================================");
    console.log("\n");
    console.log("=====================================================");
    console.log("Removing Wipe Key...");
    console.log("-----------------------------------------------------");
    update = new TokenUpdateTransaction()
        .setTokenId(tokenId)
        .setWipeKey(emptyKeyList)
        .setKeyVerificationMode(TokenKeyValidation.FullValidation)
        .freezeWith(client);
    response = await (await update.sign(adminKey)).execute(client);

    receipt = await response.getReceipt(client);
    console.log("Token update transaction status:", receipt.status.toString());

    tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
    console.log("Token wipeKey is", tokenInfo.wipeKey);
    console.log("=====================================================");
    console.log("\n");
    console.log("=====================================================");
    console.log("Removing Admin Key...");
    console.log("-----------------------------------------------------");
    update = new TokenUpdateTransaction()
        .setTokenId(tokenId)
        .setAdminKey(emptyKeyList)
        .setKeyVerificationMode(TokenKeyValidation.NoValidation)
        .freezeWith(client);
    response = await (await update.sign(adminKey)).execute(client);

    receipt = await response.getReceipt(client);
    console.log("Token update transaction status:", receipt.status.toString());

    tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
    console.log("Token adminKey is", tokenInfo.adminKey);
    console.log("=====================================================");
    console.log("\n");
    console.log("=====================================================");
    console.log("Updating Supply Key...");
    console.log("-----------------------------------------------------");
    console.log(
        "Token supplyKey (before update) is",
        tokenInfo.supplyKey.toString(),
    );
    update = new TokenUpdateTransaction()
        .setTokenId(tokenId)
        .setSupplyKey(newSupplyKey)
        .setKeyVerificationMode(TokenKeyValidation.FullValidation)
        .freezeWith(client);
    response = await (
        await (await update.sign(supplyKey)).sign(newSupplyKey)
    ).execute(client);

    receipt = await response.getReceipt(client);
    console.log("Token update transaction status:", receipt.status.toString());

    tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
    console.log(
        "Token suppleyKey (after update) is",
        tokenInfo.supplyKey.toString(),
    );
    console.log("=====================================================");
    console.log("\n");
    console.log("=====================================================");
    console.log("Updating Supply Key to unusable format...");
    console.log("-----------------------------------------------------");
    console.log(
        "Token supplyKey (before update) is",
        tokenInfo.supplyKey.toString(),
    );
    update = new TokenUpdateTransaction()
        .setTokenId(tokenId)
        .setSupplyKey(unusableKey)
        .setKeyVerificationMode(TokenKeyValidation.NoValidation)
        .freezeWith(client);
    response = await (await update.sign(newSupplyKey)).execute(client);

    receipt = await response.getReceipt(client);
    console.log("Token update transaction status:", receipt.status.toString());

    tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);

    console.log(
        "Token suppleyKey (after update) is",
        tokenInfo.supplyKey.toString(),
    );
    console.log("=====================================================");

    client.close();
}

void main();
