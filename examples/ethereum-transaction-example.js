import { decode } from "../src/encoding/hex.js";
import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    Status,
    FileCreateTransaction,
    ContractCreateTransaction,
    ContractFunctionParameters,
    TransferTransaction,
    EthereumTransaction,
    EthereumTransactionDataEip1559,
} from "@hiero-ledger/sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

/** @type {Record<string, number>} */
const CHAIN_IDS = {
    mainnet: 295,
    testnet: 296,
    previewnet: 297,
    "local-node": 298,
};

/** Builds, natively signs and submits an EIP-1559 transaction via the setEthereumData object overload. */
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
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const network = process.env.HEDERA_NETWORK;
    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    const chainId = CHAIN_IDS[network];
    if (chainId == null) {
        throw new Error(`Unknown chain id for network "${network}"`);
    }

    try {
        console.log("Ethereum Transaction Example Start!");

        console.log("Deploying the contract...");
        const bytecode = fs.readFileSync(
            "./contracts/HelloWorld.bytecode.txt",
            "utf8",
        );

        const fileId = (
            await (
                await new FileCreateTransaction()
                    .setKeys([operatorKey])
                    .setContents(bytecode)
                    .setMaxTransactionFee(new Hbar(2))
                    .execute(client)
            ).getReceipt(client)
        ).fileId;

        const contractId = (
            await (
                await new ContractCreateTransaction()
                    .setAdminKey(operatorKey)
                    .setGas(200_000)
                    .setBytecodeFileId(fileId)
                    .execute(client)
            ).getReceipt(client)
        ).contractId;
        const contractAddress = contractId.toEvmAddress();
        console.log(
            `Contract deployed: ${contractId.toString()} (0x${contractAddress})`,
        );

        console.log("Funding the Ethereum sender account...");
        const senderKey = PrivateKey.generateECDSA();
        const senderAlias = senderKey.publicKey.toEvmAddress();

        await (
            await new TransferTransaction()
                .addHbarTransfer(operatorId, new Hbar(10).negated())
                .addHbarTransfer(senderAlias, new Hbar(10))
                .execute(client)
        ).getReceipt(client);

        const callData = new ContractFunctionParameters()
            .addBytes(new Uint8Array([1, 2, 3, 4]))
            ._build("test");

        const unsignedData = new EthereumTransactionDataEip1559({
            chainId: numberToBytes(chainId),
            nonce: new Uint8Array(),
            maxPriorityGas: new Uint8Array(),
            maxGas: decode("d1385c7bf0"),
            gasLimit: decode("0249f0"),
            to: decode(contractAddress),
            value: new Uint8Array(),
            callData,
            accessList: [],
            recId: new Uint8Array(),
            r: new Uint8Array(),
            s: new Uint8Array(),
        });

        console.log("Is the envelope signed yet?", unsignedData.isSigned());
        try {
            new EthereumTransaction().setEthereumData(unsignedData);
        } catch (error) {
            console.log(
                `Rejected unsigned envelope as expected: ${
                    /** @type {Error} */ (error).message
                }`,
            );
        }

        const signedData = unsignedData.sign(senderKey);
        console.log("Signed?", signedData.isSigned());

        const response = await new EthereumTransaction()
            .setEthereumData(signedData)
            .setMaxTransactionFee(new Hbar(10))
            .execute(client);

        const receipt = await response.getReceipt(client);
        console.log(
            `Ethereum transaction status: ${receipt.status.toString()}`,
        );
        if (receipt.status === Status.Success) {
            console.log("Ethereum Transaction Example Complete!");
        }
    } finally {
        client.close();
    }
}

/**
 * @param {number} value
 * @returns {Uint8Array}
 */
function numberToBytes(value) {
    if (value <= 0) {
        return new Uint8Array();
    }
    const bytes = [];
    let remaining = value;
    while (remaining > 0) {
        bytes.unshift(remaining & 0xff);
        remaining = Math.floor(remaining / 256);
    }
    return new Uint8Array(bytes);
}

void main();
