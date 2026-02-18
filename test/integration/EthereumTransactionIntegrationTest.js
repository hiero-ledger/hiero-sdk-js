import {
    FileCreateTransaction,
    ContractFunctionParameters,
    ContractCreateTransaction,
    EthereumTransaction,
    EthereumTransactionDataEip7702,
    PrivateKey,
    TransferTransaction,
    Hbar,
    TransactionResponse,
    TransactionReceipt,
    FileId,
    ContractId,
    Status,
    TransactionRecord,
    MirrorNodeContractEstimateQuery,
} from "../../src/exports.js";
import {
    SMART_CONTRACT_BYTECODE,
    SMART_CONTRACT_BYTECODE_JUMBO,
} from "./contents.js";
import * as rlp from "@ethersproject/rlp";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import * as hex from "../../src/encoding/hex.js";
import { keccak256 } from "../../src/cryptography/keccak.js";

/**
 * @summary E2E-HIP-844
 * @url https://hips.hedera.com/hip/hip-844
 *
 * @description
 * At the moment the ethereum transaction behavior is not stable.
 * Occasionally the test fails with the following error INVALID_ACCOUNT_ID.
 * The test suite will be skipped until the problem is investigated and fixed.
 */

// eslint-disable-next-line vitest/no-disabled-tests
describe("EthereumTransactionIntegrationTest", function () {
    let env, operatorKey, wallet, contractAddress, operatorId;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
        wallet = env.wallet;
        operatorKey = wallet.getAccountKey();
        operatorId = wallet.getAccountId();
    });

    it("Signer nonce changed on Ethereum transaction", async function () {
        try {
            const fileResponse = await (
                await (
                    await new FileCreateTransaction()
                        .setKeys([wallet.getAccountKey()])
                        .setContents(SMART_CONTRACT_BYTECODE)
                        .setMaxTransactionFee(new Hbar(2))
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet);
            expect(fileResponse).to.be.instanceof(TransactionResponse);

            const fileReceipt = await fileResponse.getReceiptWithSigner(wallet);
            expect(fileReceipt).to.be.instanceof(TransactionReceipt);
            expect(fileReceipt.status).to.be.equal(Status.Success);
            const fileId = fileReceipt.fileId;
            expect(fileId).to.be.instanceof(FileId);

            const contractResponse = await (
                await (
                    await new ContractCreateTransaction()
                        .setAdminKey(operatorKey)
                        .setGas(300_000)
                        .setConstructorParameters(
                            new ContractFunctionParameters()
                                .addString("Hello from Hedera.")
                                ._build(),
                        )
                        .setBytecodeFileId(fileId)
                        .setContractMemo("[e2e::ContractCreateTransaction]")
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet);

            expect(contractResponse).to.be.instanceof(TransactionResponse);
            const contractReceipt =
                await contractResponse.getReceiptWithSigner(wallet);
            expect(contractReceipt).to.be.instanceof(TransactionReceipt);
            expect(contractReceipt.status).to.be.equal(Status.Success);
            const contractId = contractReceipt.contractId;
            expect(contractId).to.be.instanceof(ContractId);
            contractAddress = contractId.toEvmAddress();
        } catch (error) {
            console.error(error);
        }

        const type = "02";
        const chainId = hex.decode("012a");
        const nonce = new Uint8Array();
        const maxPriorityGas = hex.decode("00");
        const maxGas = hex.decode("d1385c7bf0");
        const gasLimit = hex.decode("0249f0");
        const value = new Uint8Array();
        console.log({ contractAddress });
        const to = hex.decode(contractAddress);
        const callData = new ContractFunctionParameters()
            .addString("new message")
            ._build("setMessage");
        const accessList = [];

        const encoded = rlp
            .encode([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
            ])
            .substring(2);
        expect(typeof encoded).to.equal("string");

        const privateKey = PrivateKey.generateECDSA();
        expect(privateKey).to.be.instanceof(PrivateKey);

        const accountAlias = privateKey.publicKey.toEvmAddress();

        const transfer = await new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(10).negated())
            .addHbarTransfer(accountAlias, new Hbar(10))
            .setMaxTransactionFee(new Hbar(1))
            .freezeWithSigner(wallet);

        const transferResponse = await transfer.executeWithSigner(wallet);
        expect(transferResponse).to.be.instanceof(TransactionResponse);
        const transferReceipt =
            await transferResponse.getReceiptWithSigner(wallet);
        expect(transferReceipt).to.be.instanceof(TransactionReceipt);
        expect(transferReceipt.status).to.be.equal(Status.Success);

        const message = hex.decode(type + encoded);
        const signedBytes = privateKey.sign(message);
        const middleOfSignedBytes = signedBytes.length / 2;
        const r = signedBytes.slice(0, middleOfSignedBytes);
        const s = signedBytes.slice(middleOfSignedBytes, signedBytes.length);
        const recoveryId = privateKey.getRecoveryId(r, s, message);

        // When `recoveryId` is 0, we set `v` to an empty Uint8Array (`[]`).
        // This is intentional: during RLP encoding, an empty value is interpreted as zero,
        // but without explicitly encoding a `0x00` byte.
        //
        // Explicitly setting `v = new Uint8Array([0])` causes RLP to encode `0x00`,
        // which Ethereum considers non-canonical in some contexts — particularly
        // with EIP-1559 (type 0x02) transactions. This can result in transaction rejection.
        //
        // For `recoveryId` values 1–3, we safely encode them as a single-byte Uint8Array.
        const v = new Uint8Array(recoveryId === 0 ? [] : [recoveryId]);

        const data = rlp
            .encode([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
                v,
                r,
                s,
            ])
            .substring(2);
        expect(typeof data).to.equal("string");

        const ethereumData = hex.decode(type + data);
        expect(ethereumData.length).to.be.gt(0);

        const response = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record = await response.getRecordWithSigner(wallet);
        expect(record).to.be.instanceof(TransactionRecord);
        expect(response).to.be.instanceof(TransactionResponse);

        const receipt = await response.getReceiptWithSigner(wallet);
        expect(receipt).to.be.instanceof(TransactionReceipt);
        expect(receipt.status).to.be.equal(Status.Success);

        expect(
            record.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(1);
    });

    it("Jumbo transaction", async function () {
        const fileResponse = await (
            await (
                await new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents(SMART_CONTRACT_BYTECODE_JUMBO)
                    .setMaxTransactionFee(new Hbar(2))
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);
        expect(fileResponse).to.be.instanceof(TransactionResponse);

        const fileReceipt = await fileResponse.getReceiptWithSigner(wallet);
        expect(fileReceipt).to.be.instanceof(TransactionReceipt);
        expect(fileReceipt.status).to.be.equal(Status.Success);
        const fileId = fileReceipt.fileId;
        expect(fileId).to.be.instanceof(FileId);

        const contractResponse = await (
            await (
                await new ContractCreateTransaction()
                    .setAdminKey(operatorKey)
                    .setGas(300_000)
                    .setBytecodeFileId(fileId)
                    .setContractMemo("[e2e::ContractCreateTransaction]")
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        expect(contractResponse).to.be.instanceof(TransactionResponse);
        const contractReceipt =
            await contractResponse.getReceiptWithSigner(wallet);
        expect(contractReceipt).to.be.instanceof(TransactionReceipt);
        expect(contractReceipt.status).to.be.equal(Status.Success);
        const contractId = contractReceipt.contractId;
        expect(contractId).to.be.instanceof(ContractId);
        contractAddress = contractId.toSolidityAddress();

        const contractEstime = await new MirrorNodeContractEstimateQuery()
            .setFunction(
                "test",
                new ContractFunctionParameters().addBytes(
                    new Uint8Array(1024 * 127).fill(1),
                ),
            )
            .setContractId(contractId)
            .execute(env.client);

        const type = "02";
        const chainId = hex.decode("012a"); // change to 0128 for testnet
        const nonce = new Uint8Array();
        const maxPriorityGas = hex.decode("00");
        const maxGas = hex.decode("d1385c7bf0");
        const gasLimit = hex.decode(contractEstime.toString(16));
        const value = new Uint8Array();
        const to = hex.decode(contractAddress);
        // THIS IS THE MAXIMUM CALL DATA ITS POSSIBLE TO SEND TO THE CONTRACT
        // without the transaction being rejected by the network
        // for being oversize
        const MAXIMUM_CALL_DATA = 1024 * 127 + 928;
        const largeData = new Uint8Array(MAXIMUM_CALL_DATA).fill(1);
        const callData = new ContractFunctionParameters()
            .addBytes(largeData)
            ._build("test");
        const accessList = [];

        const encoded = rlp
            .encode([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
            ])
            .substring(2);
        expect(typeof encoded).to.equal("string");

        const privateKey = PrivateKey.generateECDSA();
        expect(privateKey).to.be.instanceof(PrivateKey);

        const accountAlias = privateKey.publicKey.toEvmAddress();

        const transfer = await new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(1000).negated())
            .addHbarTransfer(accountAlias, new Hbar(1000))
            .setMaxTransactionFee(new Hbar(1))
            .freezeWithSigner(wallet);

        const transferResponse = await transfer.executeWithSigner(wallet);
        expect(transferResponse).to.be.instanceof(TransactionResponse);
        const transferReceipt =
            await transferResponse.getReceiptWithSigner(wallet);
        expect(transferReceipt).to.be.instanceof(TransactionReceipt);
        expect(transferReceipt.status).to.be.equal(Status.Success);

        const message = hex.decode(type + encoded);
        const signedBytes = privateKey.sign(message);
        const middleOfSignedBytes = signedBytes.length / 2;
        const r = signedBytes.slice(0, middleOfSignedBytes);
        const s = signedBytes.slice(middleOfSignedBytes, signedBytes.length);
        const recoveryId = privateKey.getRecoveryId(r, s, message);

        // When `recoveryId` is 0, we set `v` to an empty Uint8Array (`[]`).
        // This is intentional: during RLP encoding, an empty value is interpreted as zero,
        // but without explicitly encoding a `0x00` byte.
        //
        // Explicitly setting `v = new Uint8Array([0])` causes RLP to encode `0x00`,
        // which Ethereum considers non-canonical in some contexts — particularly
        // with EIP-1559 (type 0x02) transactions. This can result in transaction rejection.
        //
        // For `recoveryId` values 1–3, we safely encode them as a single-byte Uint8Array.
        const v = new Uint8Array(recoveryId === 0 ? [] : [recoveryId]);

        const data = rlp
            .encode([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
                v,
                r,
                s,
            ])
            .substring(2);
        expect(typeof data).to.equal("string");

        const ethereumData = hex.decode(type + data);
        expect(ethereumData.length).to.be.gt(0);

        const response = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record = await response.getRecordWithSigner(wallet);
        expect(record).to.be.instanceof(TransactionRecord);
        expect(response).to.be.instanceof(TransactionResponse);

        const receipt = await response.getReceiptWithSigner(wallet);
        expect(receipt).to.be.instanceof(TransactionReceipt);
        expect(receipt.status).to.be.equal(Status.Success);

        expect(
            record.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(1);
    });

    it("EIP-7702 (type 4) transaction", async function () {
        const EMPTY_CONTRACT_BYTECODE =
            "608060405234801561001057600080fd5b5060b88061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063f8a8fd6d14602d575b600080fd5b60336047565b604051603e9190605d565b60405180910390f35b60006001905090565b6057816076565b82525050565b6000602082019050607060008301846050565b92915050565b6000811515905091905056fea2646970667358221220b4a7b9f1eedd2080ba6dc510555bb650f1ab8aa6ee958ba753ad2cd1665559bd64736f6c63430008000033";
        let testContractAddress;

        const fileResponse = await (
            await (
                await new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents(EMPTY_CONTRACT_BYTECODE)
                    .setMaxTransactionFee(new Hbar(2))
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);
        expect(fileResponse).to.be.instanceof(TransactionResponse);

        const fileReceipt = await fileResponse.getReceiptWithSigner(wallet);
        expect(fileReceipt).to.be.instanceof(TransactionReceipt);
        expect(fileReceipt.status).to.be.equal(Status.Success);
        const fileId = fileReceipt.fileId;
        expect(fileId).to.be.instanceof(FileId);

        const contractResponse = await (
            await (
                await new ContractCreateTransaction()
                    .setAdminKey(operatorKey)
                    .setGas(500_000)
                    .setBytecodeFileId(fileId)
                    .setContractMemo("[e2e::ContractCreateTransaction]")
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        expect(contractResponse).to.be.instanceof(TransactionResponse);
        const contractReceipt =
            await contractResponse.getReceiptWithSigner(wallet);
        expect(contractReceipt).to.be.instanceof(TransactionReceipt);
        expect(contractReceipt.status).to.be.equal(Status.Success);
        const contractId = contractReceipt.contractId;
        expect(contractId).to.be.instanceof(ContractId);
        testContractAddress = contractId.toEvmAddress();

        const privateKey = PrivateKey.generateECDSA();
        expect(privateKey).to.be.instanceof(PrivateKey);

        const accountAlias = privateKey.publicKey.toEvmAddress();

        const transfer = await new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(10).negated())
            .addHbarTransfer(accountAlias, new Hbar(10))
            .setMaxTransactionFee(new Hbar(1))
            .freezeWithSigner(wallet);

        const transferResponse = await transfer.executeWithSigner(wallet);
        expect(transferResponse).to.be.instanceof(TransactionResponse);
        const transferReceipt =
            await transferResponse.getReceiptWithSigner(wallet);
        expect(transferReceipt).to.be.instanceof(TransactionReceipt);
        expect(transferReceipt.status).to.be.equal(Status.Success);

        const chainId = hex.decode("012a");
        const nonce = new Uint8Array();
        const maxPriorityGas = hex.decode("01");
        const maxGas = hex.decode("d1385c7bf0");
        const gasLimit = hex.decode("07A120");
        const value = new Uint8Array();

        const to = hex.decode(testContractAddress);
        const callData = new ContractFunctionParameters()._build("test");
        const accessList = [];

        console.log({ value });
        // EIP-7702 specific: authorization_list = [[chain_id, address, nonce, y_parity, r, s], ...]
        // The authorization sets the EOA's code to match a contract's code.
        // The 'address' in authorization is the contract whose code will be delegated to the EOA.
        // The signature is from the EOA owner (privateKey) authorizing this delegation.
        // Note: The authorization 'address' and transaction 'to' are SEPARATE:
        //   - authorization 'address': contract whose code the EOA will get
        //   - transaction 'to': where the transaction executes
        // In this test, they happen to be the same (both testContractAddress), but they don't have to be.
        const contractAddressForAuthorization = hex.decode(testContractAddress); // Contract whose code EOA will get (as Uint8Array)
        // The authorization message is: keccak(0x05 || rlp([chain_id, address, nonce]))
        const EIP_7702_MAGIC = new Uint8Array([0x05]);
        // Convert Uint8Arrays to hex strings for RLP encoding
        const authRlpEncoded = rlp.encode([
            `0x${hex.encode(chainId)}`,
            `0x${hex.encode(contractAddressForAuthorization)}`,
            `0x${hex.encode(nonce)}`,
        ]);
        const authRlpBytes = hex.decode(authRlpEncoded.substring(2));
        const authPreimage = new Uint8Array(
            EIP_7702_MAGIC.length + authRlpBytes.length,
        );
        authPreimage.set(EIP_7702_MAGIC, 0);
        authPreimage.set(authRlpBytes, EIP_7702_MAGIC.length);
        const authMessage = hex.decode(
            keccak256(`0x${hex.encode(authPreimage)}`),
        );
        const authSignedBytes = privateKey.sign(authMessage);
        const authMiddleOfSignedBytes = authSignedBytes.length / 2;
        const authR = authSignedBytes.slice(0, authMiddleOfSignedBytes);
        const authS = authSignedBytes.slice(
            authMiddleOfSignedBytes,
            authSignedBytes.length,
        );
        const authRecoveryId = privateKey.getRecoveryId(
            authR,
            authS,
            authMessage,
        );

        const authYParity = new Uint8Array(
            authRecoveryId === 0 ? [] : [authRecoveryId],
        );
        // Authorization: EOA (accountAlias) will get code from contractAddressForAuthorization
        // The signature proves the EOA owner authorizes this delegation
        const authorizationList = [
            [
                chainId,
                contractAddressForAuthorization, // Contract whose code EOA will get
                nonce,
                authYParity,
                authR,
                authS,
            ],
        ];

        // Convert authorization list items to hex strings for RLP encoding (same as EthereumTransactionDataEip7702.toBytes())
        // Note: RLP encoder needs hex strings with 0x prefix for nested arrays
        const encodedAuthorizationList = authorizationList.map(
            ([
                authChainId,
                authAddress,
                authNonce,
                authYParity,
                authR,
                authS,
            ]) => [
                `0x${hex.encode(authChainId)}`,
                `0x${hex.encode(authAddress)}`,
                `0x${hex.encode(authNonce)}`,
                `0x${hex.encode(authYParity)}`,
                `0x${hex.encode(authR)}`,
                `0x${hex.encode(authS)}`,
            ],
        );

        // First encode without the outer transaction signature for signing
        const encoded = rlp
            .encode([
                chainId, // 1. chain_id
                nonce, // 2. nonce
                maxPriorityGas, // 3. max_priority_fee_per_gas
                maxGas, // 4. max_fee_per_gas
                gasLimit, // 5. gas_limit
                to, // 6. destination
                value, // 7. value
                callData, // 8. data
                accessList, // 9. access_list
                encodedAuthorizationList, // 10. [[chain_id, address, nonce, y_parity, r, s], ...]
            ])
            .substring(2);
        console.log({ encoded });
        expect(typeof encoded).to.equal("string");

        // Sign the transaction
        const type = "04";
        const message = hex.decode(type + encoded);
        const signedBytes = privateKey.sign(message);
        const middleOfSignedBytes = signedBytes.length / 2;
        const r = signedBytes.slice(0, middleOfSignedBytes);
        const s = signedBytes.slice(middleOfSignedBytes, signedBytes.length);
        const recoveryId = privateKey.getRecoveryId(r, s, message);
        const recId = new Uint8Array(recoveryId === 0 ? [] : [recoveryId]);

        // Create EthereumTransactionDataEip7702 instance with all fields including signature
        const ethereumTransactionData = new EthereumTransactionDataEip7702({
            chainId,
            nonce,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData,
            authorizationList,
            accessList,
            recId,
            r,
            s,
        });

        // Use toBytes() to get the final encoded transaction data
        const ethereumData = ethereumTransactionData.toBytes();
        const transactionHex = hex.encode(ethereumData);

        // Console log transaction properties for debugging
        console.log("\n" + "=".repeat(80));
        console.log("EIP-7702 Transaction Debug Info");
        console.log("=".repeat(80));
        console.log("\nTransaction Hex (for debug-transaction.js):");
        console.log(transactionHex);
        console.log("\nTransaction Properties:");
        console.log("  Chain ID:", hex.encode(chainId));
        console.log("  Nonce:", hex.encode(nonce) || "(empty)");
        console.log("  Max Priority Gas:", hex.encode(maxPriorityGas));
        console.log("  Max Gas:", hex.encode(maxGas));
        console.log("  Gas Limit:", hex.encode(gasLimit));
        console.log("  From:", accountAlias);
        console.log("  To (destination):", hex.encode(to));
        console.log("  Value:", hex.encode(value));
        console.log("  Call Data:", hex.encode(callData));
        console.log(
            "  Access List:",
            accessList.length > 0 ? JSON.stringify(accessList) : "(empty)",
        );
        console.log("\nAuthorization List:");
        console.log(
            "  (This sets the EOA's code to match the contract address below)",
        );
        authorizationList.forEach((auth, index) => {
            console.log(`  Authorization ${index + 1}:`);
            console.log(`    Chain ID: ${hex.encode(auth[0])}`);
            console.log(
                `    Contract Address (code source): ${hex.encode(auth[1])}`,
            );
            console.log(`    Nonce: ${hex.encode(auth[2]) || "(empty)"}`);
            console.log(`    yParity: ${hex.encode(auth[3]) || "(empty)"}`);
            console.log(`    r: ${hex.encode(auth[4])}`);
            console.log(`    s: ${hex.encode(auth[5])}`);
        });
        console.log("\nTransaction Signature:");
        console.log("  recId (yParity):", hex.encode(recId) || "(empty)");
        console.log("  r:", hex.encode(r));
        console.log("  s:", hex.encode(s));
        console.log(
            "\nFull Transaction Hex (copy this to debug-transaction.js):",
        );
        console.log(transactionHex);
        console.log("=".repeat(80) + "\n");

        expect(ethereumData.length).to.be.gt(0);

        const response = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record = await response.getRecordWithSigner(wallet);
        expect(record).to.be.instanceof(TransactionRecord);
        expect(response).to.be.instanceof(TransactionResponse);

        const receipt = await response.getReceiptWithSigner(wallet);
        expect(receipt).to.be.instanceof(TransactionReceipt);
        expect(receipt.status).to.be.equal(Status.Success);
    });
});
