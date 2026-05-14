import {
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
    AccountBalanceQuery,
    TokenSupplyType,
} from "@hiero-ledger/sdk";
import dotenv from "dotenv";

dotenv.config();

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
    const receiverFTBalanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(receiverAccountId)
            .execute(client)
    ).tokens.get(ftId);
    const treasuryFTBalanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(treasuryAccountId)
            .execute(client)
    ).tokens.get(ftId);
    const receiverNFTBalanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(receiverAccountId)
            .execute(client)
    ).tokens.get(nftId);
    const treasuryNFTBalanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(treasuryAccountId)
            .execute(client)
    ).tokens.get(nftId);
    console.log("Receiver FT balance: ", receiverFTBalanceBefore.toInt());
    console.log("Treasury FT balance: ", treasuryFTBalanceBefore.toInt());
    console.log(
        "Receiver NFT balance: ",
        receiverNFTBalanceBefore ? receiverNFTBalanceBefore.toInt() : 0,
    );
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

    const receiverFTBalanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(receiverAccountId)
            .execute(client)
    ).tokens.get(ftId);

    const treasuryFTBalanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(treasuryAccountId)
            .execute(client)
    ).tokens.get(ftId);

    const receiverNFTBalanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(receiverAccountId)
            .execute(client)
    ).tokens.get(nftId);

    const treasuryNFTBalanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(treasuryAccountId)
            .execute(client)
    ).tokens.get(nftId);

    console.log("TokenReject response:", tokenRejectStatus);
    console.log("TokenRejectFlow response:", tokenRejectFlowStatus);
    console.log("Receiver FT balance: ", receiverFTBalanceAfter.toInt());
    console.log("Treasury FT balance: ", treasuryFTBalanceAfter.toInt());
    console.log(
        "Receiver NFT balance: ",
        receiverNFTBalanceAfter ? receiverNFTBalanceAfter.toInt() : 0,
    );
    console.log("Treasury NFT balance: ", treasuryNFTBalanceAfter.toInt());

    client.close();
}

void main();
