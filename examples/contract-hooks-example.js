import fs from "fs";
import { decode } from "../src/encoding/hex.js";
import {
    ContractCreateTransaction,
    ContractUpdateTransaction,
    PrivateKey,
    Client,
    AccountId,
    HookCreationDetails,
    LambdaEvmHook,
    HookExtensionPoint,
    Long,
} from "../src/index.js";

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
        console.log("Contract Hooks Example Start!");

        /*
         * Step 1: Create the hook contract.
         */
        console.log("Creating hook contract...");

        // Create bytecode file for the hook contract
        console.log("Creating bytecode for hook contract...");
        const hookContractBytecodeHex = fs.readFileSync(
            "./contracts/HieroHookContract.bytecode.txt",
            "utf8",
        );

        // Create the hook contract
        console.log("Creating hook contract...");
        let { contractId: hookContractId } = await (
            await (
                await new ContractCreateTransaction()
                    .setAdminKey(operatorKey.publicKey)
                    .setGas(500_000)
                    .setBytecode(decode(hookContractBytecodeHex))
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        console.log(
            "Hook contract created with ID:",
            hookContractId.toString(),
        );

        /*
         * Step 2: Demonstrate creating a contract with hooks.
         */
        console.log("\n=== Creating Contract with Hooks ===");
        console.log("Creating contract with lambda EVM hook...");

        const simpleContractBytecodeHex = fs.readFileSync(
            "./contracts/HelloWorld.bytecode.txt",
            "utf8",
        );

        // Build a basic lambda EVM hook (no admin key, no storage updates)
        const lambdaHook = new LambdaEvmHook({ contractId: hookContractId });
        const hookDetails = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(1),
            hook: lambdaHook,
        });

        let { contractId: contractWithHooksId } = await (
            await (
                await new ContractCreateTransaction()
                    .setAdminKey(operatorKey.publicKey)
                    .setGas(400_000)
                    .setBytecode(decode(simpleContractBytecodeHex))
                    .addHook(hookDetails)
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        console.log(
            "Created contract with ID:",
            contractWithHooksId.toString(),
        );
        console.log("Successfully created contract with basic lambda hook!");

        /*
         * Step 3: Demonstrate adding hooks to an existing contract.
         */
        console.log("\n=== Adding Hooks to Existing Contract ===");
        console.log("Adding hooks to existing contract...");

        const adminKey = client.operatorPublicKey;

        // Hook 3: Basic lambda hook with no storage updates (using ID 3 to avoid conflict with existing hook 1)
        const basicHook = new LambdaEvmHook({ contractId: hookContractId });
        const hook3 = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(3),
            hook: basicHook,
            key: adminKey,
        });

        try {
            let contractUpdateTransaction =
                await new ContractUpdateTransaction()
                    .setContractId(contractWithHooksId)
                    .addHookToCreate(hook3)
                    .freezeWith(client);

            contractUpdateTransaction =
                await contractUpdateTransaction.sign(operatorKey);
            const contractUpdateResponse =
                await contractUpdateTransaction.execute(client);
            await contractUpdateResponse.getReceipt(client);
            console.log("Successfully added hooks to contract!");
        } catch (error) {
            console.error("Failed to execute hook transaction:", error);
        }

        /*
         * Step 4: Demonstrate hook deletion.
         */
        console.log("\n=== Deleting Hooks from Contract ===");
        console.log("Deleting hooks from contract...");

        try {
            await (
                await (
                    await new ContractUpdateTransaction()
                        .setContractId(contractWithHooksId)
                        .addHookToDelete(Long.fromNumber(1)) // Delete hook created during contract creation
                        .addHookToDelete(Long.fromNumber(3)) // Delete hook added via contract update
                        .freezeWith(client)
                        .sign(operatorKey)
                ).execute(client)
            ).getReceipt(client);

            console.log("Successfully deleted hooks with IDs: 1 and 3");
        } catch (error) {
            console.error("Failed to execute hook deletion:", error);
        }

        console.log("Contract Hooks Example Complete!");
    } catch (error) {
        console.error("Error occurred:", error);
    }

    client.close();
}

void main();
