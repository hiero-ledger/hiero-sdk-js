import {
    FileCreateTransaction,
    ContractFunctionParameters,
    ContractCreateTransaction,
    EthereumFlow,
    PrivateKey,
    TransferTransaction,
    Hbar,
    TransactionResponse,
    TransactionReceipt,
    FileId,
    ContractId,
    Status,
    TransactionRecord,
} from "../../src/exports.js";
import { wait } from "../../src/util.js";
import { SMART_CONTRACT_BYTECODE_JUMBO } from "./contents.js";
import * as rlp from "@ethersproject/rlp";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import * as hex from "../../src/encoding/hex.js";

/**
 * @description
 * Integration test for EthereumFlow class.
 * Note: EthereumFlow is deprecated in favor of EthereumTransaction.
 * This test demonstrates the basic functionality of EthereumFlow.
 */

describe("EthereumFlowIntegrationTest", function () {
    let env, operatorKey, client, contractAddress, operatorId;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
        client = env.client;
        operatorKey = env.operatorKey;
        operatorId = env.operatorId;
    });

    it("EthereumFlow jumbo transaction", async function () {
        // Create a smart contract first
        const fileResponse = await (
            await (
                await new FileCreateTransaction()
                    .setKeys([operatorKey.publicKey])
                    .setContents(SMART_CONTRACT_BYTECODE_JUMBO)
                    .setMaxTransactionFee(new Hbar(2))
                    .freezeWith(client)
            ).sign(operatorKey)
        ).execute(client);
        expect(fileResponse).to.be.instanceof(TransactionResponse);

        const fileReceipt = await fileResponse.getReceipt(client);
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
                    .freezeWith(client)
            ).sign(operatorKey)
        ).execute(client);

        await wait(2500);
        expect(contractResponse).to.be.instanceof(TransactionResponse);
        const contractReceipt = await contractResponse.getReceipt(client);
        expect(contractReceipt).to.be.instanceof(TransactionReceipt);
        expect(contractReceipt.status).to.be.equal(Status.Success);
        const contractId = contractReceipt.contractId;
        expect(contractId).to.be.instanceof(ContractId);
        contractAddress = contractId.toSolidityAddress();

        // Create Ethereum transaction data
        const type = "02";
        const chainId = hex.decode("012a");
        const nonce = new Uint8Array();
        const maxPriorityGas = hex.decode("00");
        const maxGas = hex.decode("d1385c7bf0");
        const gasLimit = hex.decode(Number(1_500_000).toString(16));
        const value = new Uint8Array();
        const to = hex.decode(contractAddress);
        const callData = new ContractFunctionParameters()
            .addBytes(new Uint8Array(1024 * 50).fill(1))
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

        // Transfer HBAR to the ECDSA account
        const transfer = await new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(10).negated())
            .addHbarTransfer(accountAlias, new Hbar(10))
            .setMaxTransactionFee(new Hbar(1))
            .freezeWith(client);

        const transferResponse = await transfer.execute(client);
        expect(transferResponse).to.be.instanceof(TransactionResponse);
        const transferReceipt = await transferResponse.getReceipt(client);
        expect(transferReceipt).to.be.instanceof(TransactionReceipt);
        expect(transferReceipt.status).to.be.equal(Status.Success);

        // Sign the transaction
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

        // Create and execute EthereumFlow transaction
        const ethereumFlow = new EthereumFlow()
            .setEthereumData(ethereumData)
            .setMaxGasAllowanceHbar(new Hbar(1));

        const response = await ethereumFlow.execute(client);

        const record = await response.getRecord(client);
        expect(record).to.be.instanceof(TransactionRecord);
        expect(response).to.be.instanceof(TransactionResponse);

        const receipt = await response.getReceipt(client);
        expect(receipt).to.be.instanceof(TransactionReceipt);
        expect(receipt.status).to.be.equal(Status.Success);

        expect(
            record.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(1);
    });
});
