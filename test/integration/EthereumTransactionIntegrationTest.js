import {
    FileCreateTransaction,
    ContractFunctionParameters,
    ContractCreateTransaction,
    EthereumTransaction,
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
import { SMART_CONTRACT_BYTECODE } from "./contents.js";
import * as rlp from "@ethersproject/rlp";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import * as hex from "../../src/encoding/hex.js";

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
});
