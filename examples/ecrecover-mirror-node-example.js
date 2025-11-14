/**
 * Example: ecrecover with Hedera SDK and MirrorNodeContractCallQuery
 *
 * This example is nearly identical to the standard ecrecover example,
 * but instead of using `ContractCallQuery`, it demonstrates usage
 * of `MirrorNodeContractCallQuery` for read-only EVM calls.
 */

import dotenv from "dotenv";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import {
    Client,
    AccountId,
    PrivateKey,
    ContractCreateFlow,
    ContractFunctionParameters,
    MirrorNodeContractCallQuery,
} from "@hiero-ledger/sdk";

import ecrecoverCaller from "./ecrecover_caller.json" with { type: "json" };
import { setTimeout } from "node:timers/promises";

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
     * Recover address via MirrorNodeContractCallQuery (ecrecover)
     */

    // Wait for the contract to be indexed
    await setTimeout(5000);

    const mirrorQuery = new MirrorNodeContractCallQuery()
        .setContractId(contractId)
        .setFunction(
            "callEcrecover",
            new ContractFunctionParameters()
                .addBytes32(prefixedMessageHash)
                .addUint8(v)
                .addBytes32(r)
                .addBytes32(s),
        );

    const mirrorResult = await mirrorQuery.execute(client);
    const hexString = mirrorResult.slice(2); // Returns zero-padded hex string
    const recoveredBytes = hexToBytes(hexString);

    // Ethereum addresses are 20 bytes long. The last 20 bytes of the returned log data represent the address.
    const ETHEREUM_ADDRESS_LENGTH = 20;

    const recoveredAddress = bytesToHex(
        recoveredBytes.slice(-ETHEREUM_ADDRESS_LENGTH),
    );

    console.log(`Recovered (MirrorNode callEcrecover): 0x${recoveredAddress}`);
    console.log(
        recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
            ? "Address matches!"
            : "Address mismatch!",
    );

    /*
     * Step 6:
     * Done
     */
    client.close();
    console.log("Example completed.");
}

main().catch((err) => {
    console.error("Example failed:", err);
    process.exit(1);
});
