import {
    AccountId,
    Client,
    PrivateKey,
    TokenCreateTransaction,
    TokenType,
    TokenMintTransaction,
    TokenInfoQuery,
    Long,
    Status,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    let tokenCreate = await new TokenCreateTransaction()
        .setTokenName("Token")
        .setTokenSymbol("T")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(8)
        .setTreasuryAccountId(operatorId)
        .setSupplyKey(operatorKey)
        .execute(client);

    let tokenCreateReceipt = await tokenCreate.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId;
    console.log(`TokenId is ${tokenId.toString()}.`);

    // If the number of tokens that should be minted is bigger
    // than Number.MAX_SAFE_INTEGER it should be passed as a Long number
    const amount = Long.fromValue("25817858423044461");
    console.log(`Token balance will be set to ${amount.toString()}.`);

    let tokenMint = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .execute(client);

    const tokenMintReciept = await tokenMint.getReceipt(client);
    if (tokenMintReciept.status === Status.Success) {
        console.log("Token has been minted!");
    } else {
        console.error("Token mint transaction failed.");
    }

    let tokenInfo = await new TokenInfoQuery()
        .setTokenId(tokenId)
        .execute(client);

    if (tokenInfo) {
        console.log(`Token Balance = ${tokenInfo.totalSupply.toString()}`);
    } else {
        console.error("Token query failed.");
    }

    client.close();
}

void main();
