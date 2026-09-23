import {
    MirrorNodeTokenBalanceQuery,
    AccountCreateTransaction,
    PrivateKey,
    TokenCreateTransaction,
    TransferTransaction,
    AccountId,
    Client,
    TokenType,
    TokenMintTransaction,
    TokenRejectTransaction,
    TokenRejectFlow,
    NftId,
    TokenSupplyType,
} from "@hiero-ledger/sdk";
import dotenv from "dotenv";

dotenv.config();

/**
 *
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
    const CID = [
        "QmNPCiNA3Dsu3K5FxDPMG5Q3fZRwVTg14EXA92uqEeSRXn",
        "QmZ4dgAgt8owvnULxnKxNe8YqpavtVCXmc1Lt2XajFpJs9",
        "QmPzY5GxevjyfMUF5vEAjtyRoigzWp47MiKAtLBduLMC1T",
    ];
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const network = process.env.HEDERA_NETWORK;
    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    // create a treasury account
    const treasuryPrivateKey = PrivateKey.generateECDSA();
    const treasuryAccountId = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(treasuryPrivateKey)
                .setMaxAutomaticTokenAssociations(100)
                .execute(client)
        ).getReceipt(client)
    ).accountId;

    // create a receiver account with unlimited max auto associations
    const receiverPrivateKey = PrivateKey.generateECDSA();
    const receiverAccountId = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(receiverPrivateKey)
                .setMaxAutomaticTokenAssociations(-1)
                .execute(client)
        ).getReceipt(client)
    ).accountId;

    // create a nft collection
    const nftCreationTx = await (
        await new TokenCreateTransaction()
            .setTokenType(TokenType.NonFungibleUnique)
            .setTokenName("Example Fungible Token")
            .setTokenSymbol("EFT")
            .setMaxSupply(CID.length)
            .setSupplyType(TokenSupplyType.Finite)
            .setSupplyKey(operatorKey)
            .setAdminKey(operatorKey)
            .setTreasuryAccountId(treasuryAccountId)
            .freezeWith(client)
            .sign(treasuryPrivateKey)
    ).execute(client);

    const nftId = (await nftCreationTx.getReceipt(client)).tokenId;
    console.log("NFT ID: ", nftId.toString());

    // create a fungible token
    const ftCreationTx = await (
        await new TokenCreateTransaction()
            .setTokenName("Example Fungible Token")
            .setTokenSymbol("EFT")
            .setInitialSupply(100000000)
            .setSupplyKey(operatorKey)
            .setAdminKey(operatorKey)
            .setTreasuryAccountId(treasuryAccountId)
            .freezeWith(client)
            .sign(treasuryPrivateKey)
    ).execute(client);

    const ftId = (await ftCreationTx.getReceipt(client)).tokenId;
    console.log("FT ID: ", ftId.toString());

    // mint 3 NFTs to treasury
    const nftSerialIds = [];
    for (let i = 0; i < CID.length; i++) {
        const { serials } = await (
            await new TokenMintTransaction()
                .setTokenId(nftId)
                .addMetadata(Buffer.from(CID[i]))
                .execute(client)
        ).getReceipt(client);
        const [serial] = serials;
        nftSerialIds.push(new NftId(nftId, serial));
    }

    // transfer nfts to receiver
    await (
        await (
            await new TransferTransaction()
                .addNftTransfer(
                    nftSerialIds[0],
                    treasuryAccountId,
                    receiverAccountId,
                )
                .addNftTransfer(
                    nftSerialIds[1],
                    treasuryAccountId,
                    receiverAccountId,
                )
                .addNftTransfer(
                    nftSerialIds[2],
                    treasuryAccountId,
                    receiverAccountId,
                )
                .freezeWith(client)
                .sign(treasuryPrivateKey)
        ).execute(client)
    ).getReceipt(client);

    // transfer fungible tokens to receiver
    await (
        await (
            await new TransferTransaction()
                .addTokenTransfer(ftId, treasuryAccountId, -1)
                .addTokenTransfer(ftId, receiverAccountId, 1)
                .freezeWith(client)
                .sign(treasuryPrivateKey)
        ).execute(client)
    ).getReceipt(client);

    console.log("=======================");
    console.log("Before Token Reject");
    console.log("=======================");
    const receiverFTBalanceBefore = await tokenBalance(
        client,
        receiverAccountId,
        ftId,
    );
    const treasuryFTBalanceBefore = await tokenBalance(
        client,
        treasuryAccountId,
        ftId,
    );
    const receiverNFTBalanceBefore = await tokenBalance(
        client,
        receiverAccountId,
        nftId,
    );
    const treasuryNFTBalanceBefore = await tokenBalance(
        client,
        treasuryAccountId,
        nftId,
    );
    console.log("Receiver FT balance: ", receiverFTBalanceBefore.toInt());
    console.log("Treasury FT balance: ", treasuryFTBalanceBefore.toInt());
    console.log("Receiver NFT balance: ", receiverNFTBalanceBefore.toInt());
    console.log("Treasury NFT balance: ", treasuryNFTBalanceBefore.toInt());

    // reject fungible tokens back to treasury
    const tokenRejectResponse = await (
        await (
            await new TokenRejectTransaction()
                .setOwnerId(receiverAccountId)
                .addTokenId(ftId)
                .freezeWith(client)
                .sign(receiverPrivateKey)
        ).execute(client)
    ).getReceipt(client);

    // reject NFTs back to treasury
    const rejectFlowResponse = await (
        await new TokenRejectFlow()
            .setOwnerId(receiverAccountId)
            .setNftIds(nftSerialIds)
            .freezeWith(client)
            .sign(receiverPrivateKey)
            .execute(client)
    ).getReceipt(client);

    const tokenRejectStatus = tokenRejectResponse.status.toString();
    const tokenRejectFlowStatus = rejectFlowResponse.status.toString();

    console.log("=======================");
    console.log("After Token Reject Transaction and flow");
    console.log("=======================");

    const receiverFTBalanceAfter = await tokenBalance(
        client,
        receiverAccountId,
        ftId,
        receiverFTBalanceBefore,
    );

    const treasuryFTBalanceAfter = await tokenBalance(
        client,
        treasuryAccountId,
        ftId,
        treasuryFTBalanceBefore,
    );

    const receiverNFTBalanceAfter = await tokenBalance(
        client,
        receiverAccountId,
        nftId,
        receiverNFTBalanceBefore,
    );

    const treasuryNFTBalanceAfter = await tokenBalance(
        client,
        treasuryAccountId,
        nftId,
        treasuryNFTBalanceBefore,
    );

    console.log("TokenReject response:", tokenRejectStatus);
    console.log("TokenRejectFlow response:", tokenRejectFlowStatus);
    console.log("Receiver FT balance: ", receiverFTBalanceAfter.toInt());
    console.log("Treasury FT balance: ", treasuryFTBalanceAfter.toInt());
    console.log("Receiver NFT balance: ", receiverNFTBalanceAfter.toInt());
    console.log("Treasury NFT balance: ", treasuryNFTBalanceAfter.toInt());

    client.close();
}

/**
 * Read a token balance from the mirror node.
 *
 * `AccountBalanceQuery` used to return token balances, and
 * `AccountInfoQuery.tokenRelationships` is deprecated as of HIP-367, so
 * `MirrorNodeTokenBalanceQuery` is the supported way to read one.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Pass `previous` to
 * poll until the value moves; the loop is bounded so an example cannot hang.
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @param {import("@hiero-ledger/sdk").TokenId | string} tokenId
 * @param {import("long")} [previous]
 * @returns {Promise<import("long")>}
 */
async function tokenBalance(client, accountId, tokenId, previous) {
    return untilMirror(async () => {
        const { balance } = await new MirrorNodeTokenBalanceQuery()
            .setAccountId(accountId)
            .setTokenId(tokenId)
            .execute(client);

        // Without a previous value there is nothing to wait for.
        if (previous == null) {
            return balance;
        }

        return balance.equals(previous) ? null : balance;
    });
}

void main();

/**
 * Poll a mirror-node read until it reflects the transaction that just happened.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Polling to a deadline
 * beats a fixed sleep: it does not go flaky on a slow runner and does not waste
 * time on a fast one.
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
