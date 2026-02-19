import { decode } from "../src/encoding/hex.js";
import fs from "fs";
import {
    AccountCreateTransaction,
    AccountUpdateTransaction,
    ContractCreateTransaction,
    PrivateKey,
    Hbar,
    Client,
    AccountId,
    HookCreationDetails,
    EvmHook,
    HookExtensionPoint,
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
        console.log("Account Hooks Example Start!");

        /*
         * Step 1: Create the hook contract.
         */
        console.log("Creating hook contract...");

        // Create bytecode file for the hook contract
        console.log("Creating bytecode for hook contract...");
        const contractBytecodeHex = fs.readFileSync(
            "./contracts/HieroHookContract.bytecode.txt",
            "utf8",
        );

        // Create the hook contract
        console.log("Creating hook contract...");
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

        /*
         * Step 2: Demonstrate creating an account with hooks.
         */
        console.log("\n=== Creating Account with Hooks ===");
        console.log("Creating account with EVM hook...");

        const accountKey = PrivateKey.generate();
        const accountPublicKey = accountKey.publicKey;

        // Create a EVM hook
        const evmHook = new EvmHook({ contractId });

        // Create hook creation details
        const adminKey = client.operatorPublicKey;
        const hookWithId1002 = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(1002),
            evmHook: evmHook,
            adminKey: adminKey,
        });

        let { accountId } = await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(accountPublicKey)
                    .setInitialBalance(new Hbar(1))
                    .addHook(hookWithId1002)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        console.log(`account id = ${accountId.toString()}`);
        console.log("Successfully created account with EVM hook!");

        /*
         * Step 3: Demonstrate adding hooks to an existing account.
         */
        console.log("\n=== Adding Hooks to Existing Account ===");
        console.log("Adding hooks to existing account...");

        // Create basic hooks with no storage updates
        const basicHook = new EvmHook({ contractId });
        const hookWithId1 = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(1),
            evmHook: basicHook,
            adminKey: adminKey,
        });

        const basicHook2 = new EvmHook({ contractId });
        const hookWithId2 = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(2),
            evmHook: basicHook2,
            adminKey: adminKey,
        });

        try {
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .addHookToCreate(hookWithId1)
                        .addHookToCreate(hookWithId2)
                        .setMaxTransactionFee(new Hbar(10))
                        .freezeWith(client)
                        .sign(accountKey)
                ).execute(client)
            ).getReceipt(client);

            console.log("Successfully added hooks to account!");
        } catch (error) {
            console.error("Failed to execute hook transaction:", error);
        }

        /*
         * Step 4: Demonstrate hook deletion.
         */
        console.log("\n=== Deleting Hooks from Account ===");
        console.log("Deleting hooks from account...");

        try {
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .addHookToDelete(Long.fromNumber(1))
                        .addHookToDelete(Long.fromNumber(2))
                        .setMaxTransactionFee(new Hbar(10))
                        .freezeWith(client)
                        .sign(accountKey)
                ).execute(client)
            ).getReceipt(client);

            console.log("Successfully deleted hooks (IDs: 1, 2)");
        } catch (error) {
            console.error("Failed to execute hook deletion:", error);
        }

        console.log("Account Hooks Example Complete!");
    } catch (error) {
        console.error("Error occurred:", error);
    }

    client.close();
}

void main();
