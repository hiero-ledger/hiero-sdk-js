import {
    MirrorNodeTokenBalanceQuery,
    AccountId,
    PrivateKey,
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TransferTransaction,
    TokenNftInfoQuery,
    NftId,
    AccountInfoQuery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TransactionReceipt,
} from "@hiero-ledger/sdk";
import dotenv from "dotenv";

dotenv.config();

/*
Example for HIP-542.

## Example 1:

### Steps
1. Create an NFT using the Hedera Token Service
2. Mint the NFT
3. Create an ECDSA public key alias
4. Transfer the NFT to the public key alias using the transfer transaction
5. Return the new account ID in the child record
6. Show the new account ID owns the NFT

## Example 2:
### Steps
1. Create a fungible HTS token using the Hedera Token Service
2. Create an ECDSA public key alias
3. Transfer the fungible token to the public key alias
4. Return the new account ID in the child record
5. Show the new account ID owns the fungible token

*/

/**
 *
 */
async function main() {
    // Configure accounts and client, and generate needed keys
    const supplyKey = PrivateKey.generateECDSA();
    const freezeKey = PrivateKey.generateECDSA();
    const wipeKey = PrivateKey.generateECDSA();
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required.",
        );
    }
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const nodes = {
        "127.0.0.1:50211": new AccountId(3),
    };

    const client = Client.forNetwork(nodes);
    client.setOperator(operatorId, operatorKey);

    /**
     *     Example 1
     *
     * Step 1
     *
     * Create an NFT using the Hedera Token Service
     */
    console.log(`Example 1`);

    // IPFS content identifiers for the NFT metadata
    const CID = [
        "QmNPCiNA3Dsu3K5FxDPMG5Q3fZRwVTg14EXA92uqEeSRXn",
        "QmZ4dgAgt8owvnULxnKxNe8YqpavtVCXmc1Lt2XajFpJs9",
        "QmPzY5GxevjyfMUF5vEAjtyRoigzWp47MiKAtLBduLMC1T",
        "Qmd3kGgSrAwwSrhesYcY7K54f3qD7MDo38r7Po2dChtQx5",
        "QmWgkKz3ozgqtnvbCLeh7EaR1H8u5Sshx3ZJzxkcrT3jbw",
    ];

    let nftCreateTx = new TokenCreateTransaction()
        .setTokenName("HIP-542 Example Collection")
        .setTokenSymbol("HIP-542")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setMaxSupply(CID.length)
        .setTreasuryAccountId(operatorId)
        .setSupplyType(TokenSupplyType.Finite)
        .setAdminKey(operatorKey)
        .setFreezeKey(freezeKey)
        .setWipeKey(wipeKey)
        .setSupplyKey(supplyKey)
        .freezeWith(client);

    // Sign the transaction with the operator key
    let nftCreateTxSign = await nftCreateTx.sign(operatorKey);

    // Submit the transaction to the Hedera network
    let nftCreateSubmit = await nftCreateTxSign.execute(client);

    // Get transaction receipt information
    let nftCreateRx = await nftCreateSubmit.getReceipt(client);
    let nftTokenId = nftCreateRx.tokenId;
    console.log(`Created NFT with token id: ${nftTokenId.toString()}`);

    /**
     * Step 2
     *
     * Mint the NFT
     */
    const nftCollection = [];
    for (var i = 0; i < CID.length; i++) {
        nftCollection[i] = await tokenMinterFcn(CID[i]);
        console.log(
            `Created NFT ${nftTokenId.toString()} with serial: ${nftCollection[
                i
            ].serials[0].toString()}`,
        );
    }

    let exampleNftId = nftCollection[0].serials[0];

    /**
     * Step 3
     *
     * Create an ECDSA public key alias
     */
    console.log("Creating a new account...");

    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey;

    // Assuming that the target shard and realm are known.
    // For now they are virtually always 0 and 0.
    const aliasAccountId = publicKey.toAccountId(0, 0);

    console.log(`New account ID: ${aliasAccountId.toString()}`);
    console.log(`Just the aliasKey: ${aliasAccountId.aliasKey.toString()}`);

    /**
     * Step 4
     *
     * Transfer the NFT to the public key alias using the transfer transaction
     */
    let nftTransferTx = new TransferTransaction()
        .addNftTransfer(nftTokenId, exampleNftId, operatorId, aliasAccountId)
        .freezeWith(client);

    // Sign the transaction with the operator key
    let nftTransferTxSign = await nftTransferTx.sign(operatorKey);

    // Submit the transaction to the Hedera network
    let nftTransferSubmit = await nftTransferTxSign.execute(client);

    // Get transaction receipt information here
    await nftTransferSubmit.getReceipt(client);

    /**
     * Step 5
     *
     * Return the new account ID in the child record
     */

    //Returns the info for the specified NFT id
    const nftInfo = await new TokenNftInfoQuery()
        .setNftId(new NftId(nftTokenId, exampleNftId))
        .execute(client);

    let nftOwnerAccountId = nftInfo[0].accountId.toString();
    console.log(`Current owner account id: ${nftOwnerAccountId}`);

    /**
     * Step 6
     *
     * Show the new account ID owns the NFT
     */
    const accountId = (
        await new AccountInfoQuery()
            .setAccountId(aliasAccountId)
            .execute(client)
    ).accountId.toString();

    console.log(`The normal account ID of the given alias: ${accountId}`);

    nftOwnerAccountId === accountId
        ? console.log(
              `The NFT owner accountId matches the accountId created with the HTS\n`,
          )
        : console.log(`The two account IDs does not match\n`);

    /**
     *     Example 2
     *
     * Step 1
     *
     * Create a fungible HTS token using the Hedera Token Service
     */
    console.log(`Example 2`);

    const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName("HIP-542 Token")
        .setTokenSymbol("H542")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(operatorId)
        .setInitialSupply(10000) // Total supply = 10000 / 10 ^ 2
        .setDecimals(2)
        .setAutoRenewAccountId(operatorId)
        .freezeWith(client);

    // Sign the transaction with the operator key
    let tokenCreateTxSign = await tokenCreateTx.sign(operatorKey);

    // Submit the transaction to the Hedera network
    let tokenCreateSubmit = await tokenCreateTxSign.execute(client);

    // Get transaction receipt information
    let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    let tokenId = tokenCreateRx.tokenId.toString();
    console.log(`Created token with token id: ${tokenId}`);

    /**
     * Step 2
     *
     * Create an ECDSA public key alias
     */
    console.log("Creating a new account...");

    const privateKey2 = PrivateKey.generateECDSA();
    const publicKey2 = privateKey2.publicKey;

    // Assuming that the target shard and realm are known.
    // For now they are virtually always 0 and 0.
    const aliasAccountId2 = publicKey2.toAccountId(0, 0);

    console.log(`New account ID: ${aliasAccountId2.toString()}`);
    console.log(`Just the aliasKey: ${aliasAccountId2.aliasKey.toString()}`);

    /**
     * Step 3
     *
     * Transfer the fungible token to the public key alias
     */
    let tokenTransferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -10)
        .addTokenTransfer(tokenId, aliasAccountId2, 10)
        .freezeWith(client);

    // Sign the transaction with the operator key
    let tokenTransferTxSign = await tokenTransferTx.sign(operatorKey);

    // Submit the transaction to the Hedera network
    let tokenTransferSubmit = await tokenTransferTxSign.execute(client);

    // Get transaction receipt information
    await tokenTransferSubmit.getReceipt(client);

    /**
     * Step 4
     *
     * Return the new account ID in the child record
     */
    const accountId2 = (
        await new AccountInfoQuery()
            .setAccountId(aliasAccountId2)
            .execute(client)
    ).accountId.toString();

    console.log(`The normal account ID of the given alias: ${accountId2}`);

    /**
     * Step 5
     *
     * Show the new account ID owns the fungible token
     */

    // `MirrorNodeTokenBalanceQuery` reads the token balance from the mirror
    // node, which replaces the removed `AccountBalanceQuery`. The mirror node ingests
    // consensus state asynchronously, so poll to a deadline rather than sleeping
    // for a guessed interval.
    try {
        const balance = await untilMirror(async () => {
            const { balance } = await new MirrorNodeTokenBalanceQuery()
                .setAccountId(accountId2)
                .setTokenId(tokenId)
                .execute(client);

            return balance.toInt() === 10 ? balance : null;
        });

        balance.toInt() === 10
            ? console.log(
                  `Account is created successfully using HTS 'TransferTransaction'`,
              )
            : console.log(
                  "Creating account with HTS using public key alias failed",
              );
    } catch (e) {
        console.log(e);
    }

    /**
     * TOKEN MINTER FUNCTION
     * @param {string} CID
     * @returns {Promise<TransactionReceipt>}
     */
    async function tokenMinterFcn(CID) {
        const mintTx = new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .setMetadata([Buffer.from(CID)])
            .freezeWith(client);
        let mintTxSign = await mintTx.sign(supplyKey);
        let mintTxSubmit = await mintTxSign.execute(client);
        return mintTxSubmit.getReceipt(client);
    }

    client.close();
}

void main();

/**
 * Poll a mirror-node read until it reflects the transaction that just happened.
 *
 * @template T
 * @param {() => Promise<T | null>} read - resolves the value once it is ready
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
async function untilMirror(read, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = await read();
        if (result != null) {
            return result;
        }
        if (Date.now() >= deadline) {
            throw new Error("mirror node did not ingest in time");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}
