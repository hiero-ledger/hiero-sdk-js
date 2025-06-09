import {
    Wallet,
    LocalProvider,
    ContractCreateTransaction,
    ContractExecuteTransaction,
    FileCreateTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    Hbar,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

// Import the compiled contract
import stateful from "./stateful.json" with { type: "json" };

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

    const provider = new LocalProvider();

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        provider,
    );

    // The contract bytecode is located on the `object` field
    const contractByteCode = /** @type {string} */ (stateful.object);

    try {
        // Create a file on Hedera which contains the contact bytecode.
        // Note: The contract bytecode **must** be hex encoded, it should not
        // be the actual data the hex represents
        let transaction = await new FileCreateTransaction()
            .setKeys([wallet.getAccountKey()])
            .setContents(contractByteCode)
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        const fileTransactionResponse =
            await transaction.executeWithSigner(wallet);

        // Fetch the receipt for transaction that created the file
        const fileReceipt =
            await fileTransactionResponse.getReceiptWithSigner(wallet);

        // The file ID is located on the transaction receipt
        const fileId = fileReceipt.fileId;

        console.log(`contract bytecode file: ${fileId.toString()}`);

        // Create the contract
        let contractCreateTransaction = await new ContractCreateTransaction()
            // Set the parameters that should be passed to the contract constructor
            // In this case we are passing in a string with the value "hello from hedera!"
            // as the only parameter that is passed to the contract
            .setConstructorParameters(
                new ContractFunctionParameters().addString(
                    "hello from hedera!",
                ),
            )
            // Set gas to create the contract
            .setGas(300000)
            // The contract bytecode must be set to the file ID containing the contract bytecode
            .setBytecodeFileId(fileId)
            // Set the admin key on the contract in case the contract should be deleted or
            // updated in the future
            .setAdminKey(wallet.getAccountKey())
            .freezeWithSigner(wallet);
        contractCreateTransaction =
            await contractCreateTransaction.signWithSigner(wallet);
        const contractTransactionResponse =
            await contractCreateTransaction.executeWithSigner(wallet);

        // Fetch the receipt for the transaction that created the contract
        const contractReceipt =
            await contractTransactionResponse.getReceiptWithSigner(wallet);

        // The contract ID is located on the transaction receipt
        const contractId = contractReceipt.contractId;

        console.log(`new contract ID: ${contractId.toString()}`);

        // Call a method on a contract that exists on Hedera
        // Note: `ContractCallQuery` cannot mutate a contract, it will only return the last state
        // of the contract
        const contractCallResult = await new ContractCallQuery()
            // Set the gas to execute a contract call
            .setGas(75000)
            // Set which contract
            .setContractId(contractId)
            // Set the function to call on the contract
            .setFunction("get_message")
            .setQueryPayment(new Hbar(1))
            .executeWithSigner(wallet);

        // Check if an error was returned
        if (
            contractCallResult.errorMessage != null &&
            contractCallResult.errorMessage != ""
        ) {
            console.log(
                `error calling contract: ${contractCallResult.errorMessage}`,
            );
        }

        // Get the message from the result
        // The `0` is the index to fetch a particular type from
        //
        // e.g.
        // If the return type of `get_message` was `(string[], uint32, string)`
        // then you'd need to get each field separately using:
        //      const stringArray = contractCallResult.getStringArray(0);
        //      const uint32 = contractCallResult.getUint32(1);
        //      const string = contractCallResult.getString(2);
        const message = contractCallResult.getString(0);
        console.log(`contract message: ${message}`);

        // Call a method on a contract exists on Hedera, but is allowed to mutate the contract state
        let contractExecuteTransaction = await new ContractExecuteTransaction()
            // Set which contract
            .setContractId(contractId)
            // Set the gas to execute the contract call
            .setGas(75000)
            // Set the function to call and the parameters to send
            // in this case we're calling function "set_message" with a single
            // string parameter of value "hello from hedera again!"
            // If instead the "set_message" method were to require "string[], uint32, string"
            // parameters then you must do:
            //      new ContractFunctionParameters()
            //          .addStringArray(["string 1", "string 2"])
            //          .addUint32(1)
            //          .addString("string 3")
            .setFunction(
                "set_message",
                new ContractFunctionParameters().addString(
                    "hello from hedera again!",
                ),
            )
            .freezeWithSigner(wallet);
        await contractExecuteTransaction.signWithSigner(wallet);
        const contractExecTransactionResponse =
            await contractExecuteTransaction.executeWithSigner(wallet);

        await contractExecTransactionResponse.getReceiptWithSigner(wallet);

        // Call a method on a contract that exists on Hedera
        const contractUpdateResult = await new ContractCallQuery()
            // Set which contract
            .setContractId(contractId)
            // Set gas to use
            .setGas(75000)
            // Set the function to call on the contract
            .setFunction("get_message")
            // Set query payment explicitly
            .setQueryPayment(new Hbar(3))
            .executeWithSigner(wallet);

        // Check if there were any errors
        if (
            contractUpdateResult.errorMessage != null &&
            contractUpdateResult.errorMessage != ""
        ) {
            console.log(
                `error calling contract: ${contractUpdateResult.errorMessage}`,
            );
            return;
        }

        // Get a string from the result at index 0
        const message2 = contractUpdateResult.getString(0);
        console.log(`contract returned message: ${message2}`);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
