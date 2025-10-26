import { decode } from "../src/encoding/hex.js";
import fs from "fs";
import {
    AccountCreateTransaction,
    AccountUpdateTransaction,
    AccountInfoQuery,
    ContractCreateTransaction,
    PrivateKey,
    Hbar,
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
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        console.log("Hook contract created with ID:", contractId.toString());

        /*
         * Step 2: Demonstrate creating an account with hooks.
         */
        console.log("\n=== Creating Account with Hooks ===");
        console.log("Creating account with lambda EVM hook...");

        const accountKey = PrivateKey.generate();
        const accountPublicKey = accountKey.publicKey;

        console.log(`private key = ${accountKey.toString()}`);
        console.log(`public key = ${accountPublicKey.toString()}`);

        // Create a lambda EVM hook
        const lambdaHook = new LambdaEvmHook({ contractId });

        // Create hook creation details
        const adminKey = client.operatorPublicKey;
        const hookDetails = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(1002),
            hook: lambdaHook,
            key: adminKey,
        });

        let { accountId } = await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(accountPublicKey)
                    .setInitialBalance(new Hbar(1))
                    .addHook(hookDetails)
                    .freezeWith(client)
                    .sign(operatorKey)
            ).execute(client)
        ).getReceipt(client);

        console.log(`account id = ${accountId.toString()}`);
        console.log("Successfully created account with lambda hook!");

        /*
         * Step 3: Demonstrate adding hooks to an existing account.
         */
        console.log("\n=== Adding Hooks to Existing Account ===");
        console.log("Adding hooks to existing account...");

        // Create basic lambda hooks with no storage updates
        const basicHook = new LambdaEvmHook({ contractId });
        const hook1 = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(1),
            hook: basicHook,
            key: adminKey,
        });

        const basicHook2 = new LambdaEvmHook({ contractId });
        const hook2 = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            hookId: Long.fromInt(2),
            hook: basicHook2,
            key: adminKey,
        });

        try {
            let accountUpdateTransaction = await new AccountUpdateTransaction()
                .setAccountId(accountId)
                .addHookToCreate(hook1)
                .addHookToCreate(hook2)
                .freezeWith(client);

            accountUpdateTransaction =
                await accountUpdateTransaction.sign(accountKey);
            const accountUpdateResponse =
                await accountUpdateTransaction.execute(client);
            await accountUpdateResponse.getReceipt(client);
            console.log("Successfully added hooks to account!");
        } catch (error) {
            console.error("Failed to execute hook transaction:", error);
        }

        // Verify the account by querying account info
        try {
            const accountInfo = await new AccountInfoQuery()
                .setAccountId(accountId)
                .execute(client);

            console.log("Account ID:", accountInfo.accountId.toString());
            console.log("Account balance:", accountInfo.balance.toString());
        } catch (error) {
            console.error("Failed to query account info:", error);
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
