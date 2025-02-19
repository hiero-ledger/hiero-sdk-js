import {
    AccountCreateTransaction,
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
 * @param {Partial<TokenCreateTransaction>} propOverwrites
 * @returns {Promise<TokenId>}
 */
export const createToken = async (client, propOverwrites = {}) => {
    return (
        await (
            await new TokenCreateTransaction({
                tokenName: "ffff",
                tokenSymbol: "F",
                tokenMemo: "asdf",
                decimals: 18,
                initialSupply: 1_000_000,
                treasuryAccountId: client.operatorAccountId,
                freezeKey: client.operatorPublicKey,
                pauseKey: client.operatorPublicKey,
                wipeKey: client.operatorPublicKey,
                feeScheduleKey: client.operatorPublicKey,
                metadataKey: client.operatorPublicKey,
                supplyKey: client.operatorPublicKey,
                adminKey: client.operatorPublicKey,
                supplyType: TokenSupplyType.Infinite,
                tokenType: TokenType.FungibleCommon,
                ...propOverwrites,
            })
                .freezeWith(client)
                .execute(client)
        ).getReceipt(client)
    ).tokenId;
};

/**
 * @param {Client} client
 * @param {Partial<AccountCreateTransaction>} propOverwrites
 * @returns {Promise<{ accountId: string, privateKey: PrivateKey }>}
 */
export const createAccount = async (client, propOverwrites = {}) => {
    const privateKey = propOverwrites.key
        ? propOverwrites.key
        : PrivateKey.generateECDSA();

    const accountCreateTransaction = new AccountCreateTransaction({
        initialBalance: new Hbar(1),
        key: privateKey,
        ...propOverwrites,
    });

    const { accountId } = await (
        await accountCreateTransaction.execute(client)
    ).getReceipt(client);

    return { accountId, privateKey };
};
