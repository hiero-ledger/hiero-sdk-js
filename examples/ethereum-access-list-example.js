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
    AccessListItem,
} from "@hiero-ledger/sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// EVM chain id per Hedera network.
/** @type {Record<string, number>} */
const CHAIN_IDS = {
    mainnet: 295,
    testnet: 296,
    previewnet: 297,
    "local-node": 298,
};

/**
 * Demonstrates the structured access-list API and typed setters added for the
 * native Ethereum transaction data work:
 *
 *   - build an EIP-1559 envelope with the typed setters (Long / BigNumber /
 *     bigint / EvmAddress / hex string),
 *   - attach an EIP-2930 access list with the structured `AccessListItem`
 *     type via `addAccessListItem` (and read it back with `getAccessList`),
 *   - sign it natively and submit it.
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
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const network = process.env.HEDERA_NETWORK;
    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    const chainId = CHAIN_IDS[network];
    if (chainId == null) {
        throw new Error(`Unknown chain id for network "${network}"`);
    }

    try {
        console.log("Ethereum Access List Example Start!");

        // Deploy the contract we'll call (and reference in the access list).
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
            `Contract: ${contractId.toString()} (0x${contractAddress})`,
        );

        // Fund an ECDSA-aliased account to be the Ethereum sender.
        const senderKey = PrivateKey.generateECDSA();
        await (
            await new TransferTransaction()
                .addHbarTransfer(operatorId, new Hbar(10).negated())
                .addHbarTransfer(
                    senderKey.publicKey.toEvmAddress(),
                    new Hbar(10),
                )
                .execute(client)
        ).getReceipt(client);

        const callData = new ContractFunctionParameters()
            .addBytes(new Uint8Array([1, 2, 3, 4]))
            ._build("test");

        // Build the access list with the structured type: one entry pointing at
        // the contract, pre-warming two storage slots.
        const accessListItem = new AccessListItem(decode(contractAddress))
            .addStorageKey(new Uint8Array(32)) // slot 0x00..00
            .addStorageKey(decode(`${"00".repeat(31)}01`)); // slot 0x00..01

        // Construct an empty envelope, then populate it with the typed setters.
        const empty = new Uint8Array();
        const data = new EthereumTransactionDataEip1559({
            chainId: empty,
            nonce: empty,
            maxPriorityGas: empty,
            maxGas: empty,
            gasLimit: empty,
            to: empty,
            value: empty,
            callData: empty,
            accessList: [],
            recId: empty,
            r: empty,
            s: empty,
        })
            .setChainId(chainId) // number -> Long
            .setNonce(0) // first transaction from this account
            .setMaxPriorityGas(0n) // bigint
            .setMaxGas(900_000_000_000n) // bigint
            .setGasLimit(150_000)
            .setTo(`0x${contractAddress}`) // 0x hex string -> EvmAddress
            .setValue(0n)
            .setCallData(callData)
            .addAccessListItem(accessListItem) // structured, chainable
            .sign(senderKey);

        // Read the access list back as structured items.
        const [entry] = data.getAccessList();
        console.log(
            `Access list: 1 entry for 0x${entry.getAddress()?.toString()} ` +
                `with ${entry.getStorageKeys().length} storage keys`,
        );

        // #4186 has no setEthereumData(object) overload yet, so submit the
        // signed bytes (that overload lands with the setEthereumData PR).
        const response = await new EthereumTransaction()
            .setEthereumData(data.toBytes())
            .setMaxTransactionFee(new Hbar(10))
            .execute(client);

        const receipt = await response.getReceipt(client);
        console.log(
            `Ethereum transaction status: ${receipt.status.toString()}`,
        );
        if (receipt.status === Status.Success) {
            console.log("Ethereum Access List Example Complete!");
        }

        // For EIP-7702, the authorization list uses the same shape via the
        // `Authorization` type:
        //
        //   import { Authorization, EthereumTransactionDataEip7702 } from "@hiero-ledger/sdk";
        //   const auth = new Authorization(chainId, address, nonce, yParity, r, s);
        //   new EthereumTransactionDataEip7702({ ... }).addAuthorization(auth).sign(key);
    } finally {
        client.close();
    }
}

void main();
