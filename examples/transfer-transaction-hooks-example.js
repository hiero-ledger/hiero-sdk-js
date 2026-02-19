import fs from "fs";
import { decode } from "../src/encoding/hex.js";
import {
    TransferTransaction,
    TokenCreateTransaction,
    TokenMintTransaction,
    TokenType,
    NftId,
    PrivateKey,
    Hbar,
    Client,
    AccountId,
    FungibleHookCall,
    NftHookCall,
    EvmHookCall,
    FungibleHookType,
    NftHookType,
    Long,
    ContractCreateTransaction,
    HookExtensionPoint,
    HookCreationDetails,
    EvmHook,
    AccountCreateTransaction,
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

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const network = process.env.HEDERA_NETWORK;
    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    try {
        console.log("Transfer Transaction Hooks Example Start!");

        /*
         * Step 1: Set up prerequisites - create tokens and NFTs
         */
        console.log("Setting up prerequisites...");

        const hookBytecode = fs.readFileSync(
            "./contracts/HieroHookContract.bytecode.txt",
            "utf8",
        );

        const hookContractCreateReceipt = await (
            await (
                await new ContractCreateTransaction()
                    .setAdminKey(operatorKey.publicKey)
                    .setGas(1000000)
                    .setBytecode(decode(hookBytecode))
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);
        const hookContractId = hookContractCreateReceipt.contractId;

        const hookId = Long.fromInt(1);
        const hookDetails = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: hookId,
            evmHook: new EvmHook({ contractId: hookContractId }),
        });

        const senderPrivateKey = PrivateKey.generateECDSA();
        const { accountId: senderAccountId } = await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(senderPrivateKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .addHook(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(client)
                    .sign(senderPrivateKey)
            ).execute(client)
        ).getReceipt(client);

        const { accountId: receiverAccountId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(PrivateKey.generateECDSA().publicKey)
                .setMaxAutomaticTokenAssociations(-1)
                .setInitialBalance(new Hbar(10))
                .addHook(hookDetails)
                .setMaxTransactionFee(new Hbar(10))
                .execute(client)
        ).getReceipt(client);

        console.log("Creating fungible token...");
        let { tokenId: fungibleTokenId } = await (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("Example Fungible Token")
                    .setTokenSymbol("EFT")
                    .setTokenType(TokenType.FungibleCommon)
                    .setDecimals(2)
                    .setInitialSupply(10000)
                    .setTreasuryAccountId(senderAccountId)
                    .setAdminKey(senderPrivateKey.publicKey)
                    .setSupplyKey(senderPrivateKey.publicKey)
                    .freezeWith(client)
                    .sign(senderPrivateKey)
            ).execute(client)
        ).getReceipt(client);

        console.log(
            "Created fungible token with ID:",
            fungibleTokenId.toString(),
        );

        console.log("Creating NFT token...");
        let { tokenId: nftTokenId } = await (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("Example NFT Token")
                    .setTokenSymbol("ENT")
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setTreasuryAccountId(senderAccountId)
                    .setAdminKey(senderPrivateKey.publicKey)
                    .setSupplyKey(senderPrivateKey.publicKey)
                    .freezeWith(client)
                    .sign(senderPrivateKey)
            ).execute(client)
        ).getReceipt(client);

        console.log("Created NFT token with ID:", nftTokenId.toString());

        console.log("Minting NFT...");
        const metadata = Buffer.from("Example NFT Metadata", "utf8");
        let { serials } = await (
            await (
                await new TokenMintTransaction()
                    .setTokenId(nftTokenId)
                    .addMetadata(metadata)
                    .freezeWith(client)
                    .sign(senderPrivateKey)
            ).execute(client)
        ).getReceipt(client);

        const nftId = new NftId(nftTokenId, serials[0]);
        console.log("Minted NFT with ID:", nftId.toString());

        /*
         * Step 2: Demonstrate TransferTransaction API with hooks (demonstration only)
         */
        console.log(
            "\n=== TransferTransaction with Hooks API Demonstration ===",
        );

        // Create different hooks for different transfer types (for demonstration)
        console.log("Creating hook call objects (demonstration)...");

        // HBAR transfer with pre-tx allowance hook
        const hbarHook = new FungibleHookCall({
            hookId,
            evmHookCall: new EvmHookCall({
                data: new Uint8Array([0x01, 0x02]),
                gasLimit: Long.fromNumber(20000),
            }),
            type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
        });

        // NFT sender hook (pre-hook)
        const nftSenderHook = new NftHookCall({
            hookId,
            evmHookCall: new EvmHookCall({
                data: new Uint8Array([0x03, 0x04]),
                gasLimit: Long.fromNumber(20000),
            }),
            type: NftHookType.PRE_HOOK_SENDER,
        });

        // NFT receiver hook (pre-hook)
        const nftReceiverHook = new NftHookCall({
            hookId,
            evmHookCall: new EvmHookCall({
                data: new Uint8Array([0x05, 0x06]),
                gasLimit: Long.fromNumber(20000),
            }),
            type: NftHookType.PRE_HOOK_RECEIVER,
        });

        // Fungible token transfer with pre-post allowance hook
        const fungibleTokenHook = new FungibleHookCall({
            hookId,
            evmHookCall: new EvmHookCall({
                data: new Uint8Array([0x07, 0x08]),
                gasLimit: Long.fromNumber(20000),
            }),
            type: FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
        });

        // Build separate TransferTransactions with hooks (demonstration)
        console.log("Building separate TransferTransactions with hooks...");

        // Transaction 1: HBAR transfers with hook
        console.log("\n1. Building HBAR TransferTransaction with hook...");
        await (
            await new TransferTransaction()
                .addHbarTransferWithHook(
                    senderAccountId,
                    Long.fromInt(-1),
                    hbarHook,
                )
                .addHbarTransfer(receiverAccountId, Long.fromInt(1))
                .setMaxTransactionFee(new Hbar(10))
                .execute(client)
        ).getReceipt(client);

        // Transaction 2: NFT transfer with sender and receiver hooks
        console.log("\n2. Building NFT TransferTransaction with hooks...");
        await (
            await new TransferTransaction()
                .addNftTransferWithHook(
                    nftId,
                    senderAccountId,
                    receiverAccountId,
                    nftSenderHook,
                    nftReceiverHook,
                )
                .setMaxTransactionFee(new Hbar(10))
                .execute(client)
        ).getReceipt(client);

        // Transaction 3: Fungible token transfers with hook
        console.log(
            "\n3. Building Fungible Token TransferTransaction with hook...",
        );
        await (
            await new TransferTransaction()
                .addTokenTransferWithHook(
                    fungibleTokenId,
                    senderAccountId,
                    Long.fromInt(-1000),
                    fungibleTokenHook,
                )
                .addTokenTransfer(fungibleTokenId, receiverAccountId, 1000)
                .setMaxTransactionFee(new Hbar(10))
                .execute(client)
        ).getReceipt(client);

        console.log(
            "\nAll TransferTransactions executed successfully with the following hook calls:",
        );
        console.log(
            "  - Transaction 1: HBAR transfer with pre-tx allowance hook",
        );
        console.log(
            "  - Transaction 2: NFT transfer with sender and receiver hooks",
        );
        console.log(
            "  - Transaction 3: Fungible token transfer with pre-post allowance hook",
        );

        console.log("Transfer Transaction Hooks Example Complete!");
    } catch (error) {
        console.error("Error occurred:", error);
    }

    client.close();
}

void main();
