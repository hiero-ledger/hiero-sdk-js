import Long from "long";
import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    AccountInfoQuery,
    ContractInfoQuery,
    Hbar,
    PrivateKey,
    TokenCreateTransaction,
    TokenSupplyType,
    TokenType,
} from "../../../src/exports.js";
import TokenBalanceMap from "../../../src/account/TokenBalanceMap.js";
/**
 * @typedef {import("../../../src/token/TokenId.js") } TokenId
 * @typedef {import("../../../src/client/Client.js").default<ChannelT, MirrorChannelT>} Client
 * @typedef {import("../../../src/account/AccountId.js").default} AccountId
 * @typedef {import("../../../src/contract/ContractId.js").default} ContractId
 */

/**
 * @typedef {object} Balance
 * @property {Hbar} hbars
 * @property {TokenBalanceMap} tokens
 */

/**
 * Read an account's HBAR and token balances.
 *
 * Replaces the removed `AccountBalanceQuery`. This deliberately uses
 * `AccountInfoQuery` rather than `MirrorNodeAccountBalanceQuery`: the mirror
 * node ingests consensus state asynchronously and lags by a few seconds, so
 * asserting a balance immediately after a transaction against it would be
 * flaky. `AccountInfoQuery` is served by the consensus node and is
 * immediately consistent.
 *
 * The returned shape mirrors the old `AccountBalance` (`hbars` plus a
 * `tokens` map) so assertions read the same as before.
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @returns {Promise<Balance>}
 */
export const getAccountBalance = async (client, accountId) => {
    const info = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client);

    return { hbars: info.balance, tokens: toTokenBalanceMap(info) };
};

/**
 * The contract equivalent of {@link getAccountBalance}.
 *
 * @param {Client} client
 * @param {ContractId | string} contractId
 * @returns {Promise<Balance>}
 */
export const getContractBalance = async (client, contractId) => {
    const info = await new ContractInfoQuery()
        .setContractId(contractId)
        .execute(client);

    return { hbars: info.balance, tokens: toTokenBalanceMap(info) };
};

/**
 * Project the token relationships of an account or contract onto the
 * `tokenId -> balance` map that `AccountBalance.tokens` used to expose.
 *
 * @param {{tokenRelationships: ?import("../../../src/account/TokenRelationshipMap.js").default}} info
 * @returns {TokenBalanceMap}
 */
const toTokenBalanceMap = (info) => {
    const tokens = new TokenBalanceMap();

    for (const [tokenId, relationship] of info.tokenRelationships ?? []) {
        tokens._set(tokenId, relationship.balance ?? Long.ZERO);
    }

    return tokens;
};

/**
 * @param {Client} client
 * @param {?(transaction: TokenCreateTransaction) => Promise<TokenCreateTransaction>} transactionModifier
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
        await transactionModifier(transaction);
    }

    const tokenId = (
        await (await transaction.execute(client)).getReceipt(client)
    ).tokenId;

    return tokenId;
};

/**
 * @param {Client} client
 * @param {?(transaction: TokenCreateTransaction) => Promise<TokenCreateTransaction>} transactionModifier
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
