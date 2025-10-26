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
    LambdaEvmHook,
    AccountCreateTransaction,
} from "@hashgraph/sdk";

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
    const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);
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
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);
        const hookContractId = hookContractCreateReceipt.contractId;

        const hookId = Long.fromInt(1);
        const hookDetails = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: hookId,
            hook: new LambdaEvmHook({ contractId: hookContractId }),
        });

        await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(operatorKey.publicKey)
                    .setInitialBalance(new Hbar(1))
                    .addHook(hookDetails)
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        // Use existing accounts (operator as sender, node 0.0.3 as receiver)
        const senderAccountId = operatorId;
        const receiverAccountId = new AccountId(0, 0, 3);

        console.log("Creating fungible token...");
        let { tokenId: fungibleTokenId } = await (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("Example Fungible Token")
                    .setTokenSymbol("EFT")
                    .setTokenType(TokenType.FungibleCommon)
                    .setDecimals(2)
                    .setInitialSupply(10000)
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(operatorKey.publicKey)
                    .setSupplyKey(operatorKey.publicKey)
                    .freezeWith(client)
                    .sign(operatorKey)
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
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(operatorKey.publicKey)
                    .setSupplyKey(operatorKey.publicKey)
                    .freezeWith(client)
                    .sign(operatorKey)
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
                    .sign(operatorKey)
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

        // Build TransferTransaction with hooks (demonstration)
        console.log("Building TransferTransaction with hooks...");
        new TransferTransaction()
            // HBAR transfers with hook
            .addHbarTransferWithHook(
                senderAccountId,
                Long.fromInt(-100),
                hbarHook,
            )
            .addHbarTransfer(receiverAccountId, Long.fromInt(100))

            // NFT transfer with sender and receiver hooks
            .addNftTransferWithHook(
                nftId,
                senderAccountId,
                receiverAccountId,
                nftSenderHook,
                nftReceiverHook,
            )

            // Fungible token transfers with hook
            .addTokenTransferWithHook(
                fungibleTokenId,
                senderAccountId,
                Long.fromInt(-1000),
                fungibleTokenHook,
            )
            .addTokenTransfer(fungibleTokenId, receiverAccountId, 1000);

        console.log(
            "TransferTransaction built successfully with the following hook calls:",
        );
        console.log("  - HBAR transfer with pre-tx allowance hook (ID: 1001)");
        console.log(
            "  - NFT transfer with sender hook (ID: 1002) and receiver hook (ID: 1003)",
        );
        console.log(
            "  - Fungible token transfer with pre-post allowance hook (ID: 1004)",
        );

        // Demonstrate the API without executing (since hooks don't exist)
        console.log(
            "\nNote: This demonstrates the TransferTransaction API with hooks.",
        );
        console.log(
            "To actually execute this transaction, the hooks (IDs 1001-1004) must exist on the network.",
        );
        console.log(
            "The transaction would be executed with: transferTx.execute(client)",
        );

        /*
         * Step 3: Execute a simple transfer without hooks that actually works
         */
        console.log("\n=== Executing Simple Transfer (without hooks) ===");
        try {
            await (
                await (
                    await new TransferTransaction()
                        .addHbarTransfer(senderAccountId, new Hbar(-1))
                        .addHbarTransfer(receiverAccountId, new Hbar(1))
                        .freezeWith(client)
                        .sign(operatorKey)
                ).execute(client)
            ).getReceipt(client);

            console.log("Successfully executed simple HBAR transfer!");
        } catch (error) {
            console.error("Failed to execute simple transfer:", error);
        }

        console.log("Transfer Transaction Hooks Example Complete!");
    } catch (error) {
        console.error("Error occurred:", error);
    }

    client.close();
}

void main();
