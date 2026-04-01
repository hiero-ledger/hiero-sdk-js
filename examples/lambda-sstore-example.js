import { decode } from "../src/encoding/hex.js";
import fs from "fs";
import {
    AccountCreateTransaction,
    ContractCreateTransaction,
    HookCreationDetails,
    HookStoreTransaction,
    PrivateKey,
    Hbar,
    Client,
    AccountId,
    EvmHook,
    HookExtensionPoint,
    HookId,
    HookEntityId,
    EvmHookStorageSlot,
    Long,
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
        console.log("EVM Hook Store Example Start!");

        /*
         * Step 1: Set up prerequisites - create hook contract and account with EVM hook
         */
        console.log("Setting up prerequisites...");

        // Create the hook contract
        console.log("Creating hook contract...");
        const contractBytecodeHex = fs.readFileSync(
            "./contracts/HieroHookContract.bytecode.txt",
            "utf8",
        );

        let { contractId } = await (
            await (
                await new ContractCreateTransaction()
                    .setAdminKey(operatorKey.publicKey)
                    .setGas(500_000)
                    .setBytecode(decode(contractBytecodeHex))
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        console.log("Hook contract created with ID:", contractId.toString());

        // Create account with EVM hook
        console.log("Creating account with EVM hook...");
        const accountKey = PrivateKey.generate();
        const accountPublicKey = accountKey.publicKey;

        // Create an EVM hook
        const evmHook = new EvmHook({ contractId });

        // Create hook creation details
        const adminKey = client.operatorPublicKey;
        const hookDetails = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(1),
            evmHook: evmHook,
            adminKey: adminKey,
        });

        let { accountId } = await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(accountPublicKey)
                    .setInitialBalance(new Hbar(1))
                    .addHook(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        console.log(`account id = ${accountId.toString()}`);
        console.log("Successfully created account with EVM hook!");

        /*
         * Step 2: Demonstrate EVM Hook Store Transaction - the core functionality.
         */
        console.log("\n=== EVM Hook Store Transaction Example ===");

        const storageKey = new Uint8Array(1);
        storageKey.fill(1); // Fill with byte value 1
        const storageValue = new Uint8Array(32);
        storageValue.fill(200); // Fill with byte value 200

        const storageUpdate = new EvmHookStorageSlot({
            key: storageKey,
            value: storageValue,
        });

        // Create HookId for the existing hook (accountId with hook ID 1)
        const hookEntityId = new HookEntityId({ accountId });
        const hookId = new HookId({
            entityId: hookEntityId,
            hookId: Long.fromInt(1),
        });

        console.log("Storage update created:");
        console.log("  Storage Key:", Array.from(storageKey).join(" "));
        console.log("  Storage Value:", Array.from(storageValue).join(" "));
        console.log("  Hook ID:", hookId.hookId.toString());
        console.log("  Hook Entity ID:", hookId.entityId.accountId.toString());

        // Execute HookStoreTransaction
        console.log("Executing HookStoreTransaction...");
        const hookStoreResponse = await (
            await (
                await new HookStoreTransaction()
                    .setHookId(hookId)
                    .addStorageUpdate(storageUpdate)
                    .freezeWith(client)
                    .sign(accountKey)
            ).execute(client)
        ).getReceipt(client);

        console.log("Successfully updated EVM hook storage!");
        console.log("Transaction completed successfully!");
        console.log("Receipt status:", hookStoreResponse.status.toString());

        console.log("\nEVM Hook Store Example Complete!");
    } catch (error) {
        console.error("Error occurred:", error);
    }

    client.close();
}

void main();
