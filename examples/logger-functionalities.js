import {
    Wallet,
    Client,
    LocalProvider,
    PrivateKey,
    Hbar,
    HbarUnit,
    AccountId,
    TransferTransaction,
    TopicCreateTransaction,
    Logger,
    LogLevel,
} from "@hashgraph/sdk";

import dotenv from "dotenv";
dotenv.config();

/**
 * Main concept notes!
 *
 * If the logger on the request is not set, the logger in client will be applied
 * If the client does not have a previously set logger, there will be no logs
 * (Setting a logger to a transaction will have priority over the logger in the client)
 *
 *
 * If you change/enhance property or functionality of a given logger,
 * this will be applied in every other usage of the same logger
 *
 * A suggestion is to use different logger instance in the client
 * and in each different transaction for best experience
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

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);

    let debugLogger = new Logger(LogLevel.Debug);
    let infoLogger = new Logger(LogLevel.Info);

    // Displays the different available log levels
    // namely: trace, debug, info, warn, error, fatal (weighted in that order)
    console.log(`Logger levels: ${JSON.stringify(debugLogger.levels)}`);

    const client = Client.forName(process.env.HEDERA_NETWORK)
        // Set the client's logger to `debugLogger` with debug mode
        .setLogger(debugLogger)
        .setOperator(operatorId, operatorKey);

    const provider = new LocalProvider();

    const wallet = new Wallet(client.operatorAccountId, operatorKey, provider);

    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey;
    const aliasAccountId = publicKey.toAccountId(0, 0);

    try {
        let transferTransaction = await new TransferTransaction()
            .addHbarTransfer(wallet.accountId, Hbar.from(-10, HbarUnit.Hbar))
            .addHbarTransfer(aliasAccountId, Hbar.from(10, HbarUnit.Hbar))
            .setTransactionMemo("")
            .freezeWithSigner(wallet);

        await transferTransaction.executeWithSigner(wallet);

        let topicTransaction = await new TopicCreateTransaction()
            .setLogger(infoLogger)
            .setTopicMemo("topic memo")
            .freezeWithSigner(wallet);

        await topicTransaction.executeWithSigner(wallet);

        // Set the level of the `infoLogger` from `info` to `warn`
        infoLogger.setLevel(LogLevel.Warn);

        // This should not display any logs because currently there are no `warn` logs predefined in the SDK
        let topicTransaction2 = await new TopicCreateTransaction()
            .setLogger(infoLogger)
            .setTopicMemo("topic memo")
            .freezeWithSigner(wallet);

        await topicTransaction2.executeWithSigner(wallet);

        // Silence the `debugLogger` - no logs should be shown
        // This can also be achieved by calling `.setLevel(LogLevel.Silent)`
        debugLogger.setSilent(true);

        let topicTransaction3 = await new TopicCreateTransaction()
            .setLogger(debugLogger)
            .setTopicMemo("topic memo")
            .freezeWithSigner(wallet);

        await topicTransaction3.executeWithSigner(wallet);

        // Unsilence the `debugLogger` - applies back the old log level before silencing
        debugLogger.setSilent(false);

        let topicTransaction4 = await new TopicCreateTransaction()
            .setLogger(debugLogger)
            .setTopicMemo("topic memo")
            .freezeWithSigner(wallet);

        await topicTransaction4.executeWithSigner(wallet);
    } catch (error) {
        console.error(error);
    }

    provider.close();
    client.close();
}

void main();
