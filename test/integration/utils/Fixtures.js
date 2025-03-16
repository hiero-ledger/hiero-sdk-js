import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    Hbar,
    PrivateKey,
    TokenCreateTransaction,
    TokenSupplyType,
    TokenType,
} from "../../../src/exports.js";
/**
 * @typedef {import("../../../src/token/TokenId.js") } TokenId
 * @typedef {import("../../../src/client/Client.js").default<ChannelT, MirrorChannelT>} Client
 */

/**
 * @param {Client} client
 * @param {?(transaction: TokenCreateTransaction) => TokenCreateTransaction} transactionModifier
 * @returns {Promise<TokenId>}
 */
export const createFungibleToken = async (client, transactionModifier) => {
    const transaction = new TokenCreateTransaction()
        .setTokenName("ffff")
        .setTokenSymbol("F")
        .setTokenMemo("asdf")
        .setDecimals(18)
        .setInitialSupply(1_000_000)
        .setTreasuryAccountId(client.operatorAccountId)
        .setFreezeKey(client.operatorPublicKey)
        .setPauseKey(client.operatorPublicKey)
        .setWipeKey(client.operatorPublicKey)
        .setFeeScheduleKey(client.operatorPublicKey)
        .setMetadataKey(client.operatorPublicKey)
        .setSupplyKey(client.operatorPublicKey)
        .setAdminKey(client.operatorPublicKey)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTokenType(TokenType.FungibleCommon);

    if (transactionModifier) {
        transactionModifier(transaction);
    }

    const tokenId = (
        await (await transaction.execute(client)).getReceipt(client)
    ).tokenId;

    return tokenId;
};

/**
 * @param {Client} client
 * @param {?(transaction: TokenCreateTransaction) => TokenCreateTransaction} transactionModifier
 * @returns {Promise<TokenId>}
 */
export const createNonFungibleToken = async (client, transactionModifier) => {
    const transaction = new TokenCreateTransaction()
        .setTokenName("ffff")
        .setTokenSymbol("F")
        .setTokenMemo("asdf")
        .setDecimals(0)
        .setInitialSupply(0)
        .setMaxSupply(10)
        .setSupplyType(TokenSupplyType.Finite)
        .setTokenType(TokenType.NonFungibleUnique)
        .setTreasuryAccountId(client.operatorAccountId)
        .setFreezeKey(client.operatorPublicKey)
        .setPauseKey(client.operatorPublicKey)
        .setWipeKey(client.operatorPublicKey)
        .setFeeScheduleKey(client.operatorPublicKey)
        .setMetadataKey(client.operatorPublicKey)
        .setSupplyKey(client.operatorPublicKey)
        .setAdminKey(client.operatorPublicKey);

    if (transactionModifier) {
        transactionModifier(transaction);
    }

    const tokenId = (
        await (await transaction.execute(client)).getReceipt(client)
    ).tokenId;

    return tokenId;
};

/**
 * @param {Client} client
 * @param {?(transaction: AccountCreateTransaction) => AccountCreateTransaction} transactionModifier
 * @returns {Promise<{ accountId: string | null, newKey: PrivateKey }>}
 */
export const createAccount = async (client, transactionModifier) => {
    const newKey = PrivateKey.generateECDSA();

    const accountCreateTransaction = new AccountCreateTransaction()
        .setKeyWithoutAlias(newKey)
        .setInitialBalance(new Hbar(1));

    if (transactionModifier) {
        transactionModifier(accountCreateTransaction);
    }

    const { accountId } = await (
        await accountCreateTransaction.execute(client)
    ).getReceipt(client);

    return { accountId, newKey };
};

/**
 * @param {Client} client
 * @param {PrivateKey} accountPrivateKey
 * @param {?(transaction: AccountDeleteTransaction) => Promise<AccountDeleteTransaction>} transactionModifier
 * @returns {Promise<void>}
 */
export const deleteAccount = async (
    client,
    accountPrivateKey,
    transactionModifier,
) => {
    const accountDeleteTransaction = new AccountDeleteTransaction();

    if (transactionModifier) {
        await transactionModifier(accountDeleteTransaction);
    }

    if (!accountDeleteTransaction.isFrozen()) {
        accountDeleteTransaction.freezeWith(client);
    }

    await (
        await (
            await accountDeleteTransaction.sign(accountPrivateKey)
        ).execute(client)
    ).getReceipt(client);
};
