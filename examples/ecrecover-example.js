/**
 * Example: ecrecover with Hedera SDK and @noble/hashes
 *
 * - Deploys ecrecover contract
 * - Signs a message using SDK
 * - Recovers signer address via contract calls
 * - Verifies against original address
 *
 * This example demonstrates how to use the Hedera SDK to sign and recover an Ethereum address.
 * It shows how to hash a message, sign it using the SDK, and then recover the address using a contract.
 * The example also includes a contract that can be used to recover the address.
 */

import dotenv from "dotenv";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import {
    Client,
    AccountId,
    PrivateKey,
    ContractCreateFlow,
    ContractCallQuery,
    ContractFunctionParameters,
    ContractExecuteTransaction,
} from "@hiero-ledger/sdk";

import ecrecoverCaller from "./ecrecover_caller.json" with { type: "json" };

dotenv.config();

async function main() {
    /*
     * Step 1:
     * Setup Client
     */
    if (!process.env.OPERATOR_ID || !process.env.OPERATOR_KEY) {
        throw new Error("Missing OPERATOR_ID or OPERATOR_KEY");
    }

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const client = Client.forLocalNode().setOperator(operatorId, operatorKey);

    console.log(`Operator account: ${operatorId.toString()}`);

    /*
     * Step 2:
     * Generate EVM-compatible key (ECDSA secp256k1)
     */
    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey;

    console.log(`EVM-compatible key generated: ${publicKey.toString()}`);

    /*
     * Step 3:
     * Deploy the ecrecover contract
     */
    const contractBytecode = ecrecoverCaller.evm.bytecode.object;

    const contractCreateTx = await new ContractCreateFlow()
        .setGas(8_000_000)
        .setBytecode(contractBytecode)
        .execute(client);

    const contractId = (await contractCreateTx.getReceipt(client)).contractId;

    console.log(`Contract deployed at: ${contractId.toString()}`);

    /*
     * Step 4:
     * Sign a message using the generated key
     */
    const message = "Hello, Hedera!";
    console.log(`Message to sign: "${message}"`);
    const messageBuffer = Buffer.from(message, "utf8");
    const messageHash = keccak_256(messageBuffer);

    const prefix = `\x19Ethereum Signed Message:\n${messageBuffer.length}`;
    const prefixedMessage = Buffer.concat([Buffer.from(prefix), messageBuffer]);
    const prefixedMessageHash = keccak_256(prefixedMessage);

    console.log(`Message hash:         0x${bytesToHex(messageHash)}`);
    console.log(`Prefixed message hash: 0x${bytesToHex(prefixedMessageHash)}`);

    const compactSignature = privateKey.sign(prefixedMessage);

    const r = compactSignature.slice(0, 32);
    const s = compactSignature.slice(32, 64);
    const recoveryId = privateKey.getRecoveryId(r, s, prefixedMessage);

    // Ethereum requires the recovery ID (0 or 1) to be offset by 27 when used with ecrecover.
    // This results in v being 27 or 28, per the Ethereum Yellow Paper (Appendix F).
    // Reference: https://ethereum.github.io/yellowpaper/paper.pdf (see section on the ecrecover precompile)
    const RECOVERY_ID_ETH_OFFSET = 27;

    const v = recoveryId + RECOVERY_ID_ETH_OFFSET;
    const expectedAddress = publicKey.toEvmAddress();

    console.log(`Expected Ethereum address: 0x${expectedAddress}`);

    /*
     * Step 5:
     * Recover address via callEcrecover function
     */
    console.log("Calling contract: callEcrecover()");
    const ecrecoverResult = await new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100_000)
        .setFunction(
            "callEcrecover",
            new ContractFunctionParameters()
                .addBytes32(prefixedMessageHash)
                .addUint8(v)
                .addBytes32(r)
                .addBytes32(s),
        )
        .execute(client);

    const recoveredAddress1 = ecrecoverResult.getAddress();

    console.log(`Recovered (callEcrecover): 0x${recoveredAddress1}`);
    console.log(
        recoveredAddress1.toLowerCase() === expectedAddress.toLowerCase()
            ? "Address matches!"
            : "Address mismatch!",
    );

    /*
     * Step 6:
     * Recover address via call0x1 function
     */
    const vBytes = Buffer.alloc(32);
    vBytes[31] = v;

    const callData = Buffer.concat([prefixedMessageHash, vBytes, r, s]);

    const call0x1Tx = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(100_000)
        .setFunction(
            "call0x1",
            new ContractFunctionParameters().addBytes(callData),
        )
        .execute(client);

    const call0x1Record = await call0x1Tx.getRecord(client);
    const event = call0x1Record.contractFunctionResult.logs[0];

    if (!event) throw new Error("No event emitted from call0x1");

    const recoveredBytes = event.data;

    // Ethereum addresses are 20 bytes long. The last 20 bytes of the returned log data represent the address.
    const ETHEREUM_ADDRESS_LENGTH = 20;

    const recoveredAddress2 = bytesToHex(
        recoveredBytes.slice(-ETHEREUM_ADDRESS_LENGTH),
    );

    console.log(`Recovered (call0x1): 0x${recoveredAddress2}`);
    console.log(
        recoveredAddress2.toLowerCase() === expectedAddress.toLowerCase()
            ? "Address matches!"
            : "Address mismatch!",
    );

    /*
     * Step 7:
     * Done
     */
    client.close();
    console.log("Example completed.");
}

main().catch((err) => {
    console.error("Example failed:", err);
    process.exit(1);
});
