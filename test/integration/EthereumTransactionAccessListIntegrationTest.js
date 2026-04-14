import {
    FileCreateTransaction,
    ContractFunctionParameters,
    ContractCreateTransaction,
    EthereumTransaction,
    EthereumTransactionData,
    PrivateKey,
    TransferTransaction,
    Hbar,
    Status,
} from "../../src/exports.js";
import { SMART_CONTRACT_BYTECODE } from "./contents.js";
import { encodeRlp } from "ethers";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import * as hex from "../../src/encoding/hex.js";

/**
 * @summary Integration tests for access list support in EIP-2930 (type 1),
 * EIP-1559 (type 2), and EIP-7702 (type 4) Ethereum transactions.
 *
 * @description
 * Each test deploys a contract, then submits two transactions with the same
 * call — once without an access list and once with — and verifies that the
 * access list is properly encoded/decoded and that both succeed.
 * Relates to: https://github.com/hiero-ledger/hiero-sdk-js/issues/3885
 */

describe("EthereumTransactionAccessListIntegrationTest", function () {
    let env, operatorKey, wallet, operatorId;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
        wallet = env.wallet;
        operatorKey = wallet.getAccountKey();
        operatorId = wallet.getAccountId();
    });

    /**
     * Helper: deploy a fresh contract and return its EVM address.
     */
    async function deployContract() {
        const fileResponse = await (
            await (
                await new FileCreateTransaction()
                    .setKeys([wallet.getAccountKey()])
                    .setContents(SMART_CONTRACT_BYTECODE)
                    .setMaxTransactionFee(new Hbar(2))
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const fileReceipt = await fileResponse.getReceiptWithSigner(wallet);
        expect(fileReceipt.status).to.be.equal(Status.Success);
        const fileId = fileReceipt.fileId;

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
                    .setContractMemo("[e2e::EthereumTransactionAccessList]")
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const contractReceipt =
            await contractResponse.getReceiptWithSigner(wallet);
        expect(contractReceipt.status).to.be.equal(Status.Success);
        return contractReceipt.contractId.toEvmAddress();
    }

    /**
     * Helper: fund a new ECDSA account and return the private key.
     */
    async function fundNewEcdsaAccount() {
        const privateKey = PrivateKey.generateECDSA();
        const accountAlias = privateKey.publicKey.toEvmAddress();

        const transfer = await new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(10).negated())
            .addHbarTransfer(accountAlias, new Hbar(10))
            .setMaxTransactionFee(new Hbar(1))
            .freezeWithSigner(wallet);

        const transferResponse = await transfer.executeWithSigner(wallet);
        const transferReceipt =
            await transferResponse.getReceiptWithSigner(wallet);
        expect(transferReceipt.status).to.be.equal(Status.Success);

        return privateKey;
    }

    /**
     * Helper: sign a raw Ethereum message and return { v, r, s }.
     */
    function signMessage(privateKey, message) {
        const signedBytes = privateKey.sign(message);
        const mid = signedBytes.length / 2;
        const r = signedBytes.slice(0, mid);
        const s = signedBytes.slice(mid);
        const recoveryId = privateKey.getRecoveryId(r, s, message);
        const v = new Uint8Array(recoveryId === 0 ? [] : [recoveryId]);
        return { v, r, s };
    }

    it("EIP-1559 (type 2): access list reduces or matches gas usage", async function () {
        const evmAddress = await deployContract();
        const privateKey = await fundNewEcdsaAccount();

        const type = "02";
        const chainId = hex.decode("012a");
        const maxPriorityGas = hex.decode("00");
        const maxGas = hex.decode("d1385c7bf0");
        const gasLimit = hex.decode("0249f0");
        const value = new Uint8Array();
        const to = hex.decode(evmAddress);

        // --- First call: setMessage WITHOUT access list (nonce 0) ---
        const callData1 = new ContractFunctionParameters()
            .addString("message without access list")
            ._build("setMessage");
        const nonce1 = new Uint8Array();
        const accessListEmpty = [];

        const encoded1 = encodeRlp([
            chainId,
            nonce1,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData1,
            accessListEmpty,
        ]).substring(2);

        const message1 = hex.decode(type + encoded1);
        const { v: v1, r: r1, s: s1 } = signMessage(privateKey, message1);

        const data1 = encodeRlp([
            chainId,
            nonce1,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData1,
            accessListEmpty,
            v1,
            r1,
            s1,
        ]).substring(2);

        const ethereumData1 = hex.decode(type + data1);

        const response1 = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData1)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record1 = await response1.getRecordWithSigner(wallet);
        expect(
            record1.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(1);
        const gasUsedWithout =
            record1.contractFunctionResult.gasUsed.toNumber();

        // --- Second call: setMessage WITH access list (nonce 1) ---
        const callData2 = new ContractFunctionParameters()
            .addString("message with access list")
            ._build("setMessage");
        const nonce2 = new Uint8Array([0x01]);

        const storageSlot0 = new Uint8Array(32);
        const accessListWithEntry = [[to, [storageSlot0]]];

        const encoded2 = encodeRlp([
            chainId,
            nonce2,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData2,
            accessListWithEntry,
        ]).substring(2);

        const message2 = hex.decode(type + encoded2);
        const { v: v2, r: r2, s: s2 } = signMessage(privateKey, message2);

        const data2 = encodeRlp([
            chainId,
            nonce2,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData2,
            accessListWithEntry,
            v2,
            r2,
            s2,
        ]).substring(2);

        const ethereumData2 = hex.decode(type + data2);

        // Verify fromBytes correctly parses non-empty access list
        const txData = EthereumTransactionData.fromBytes(ethereumData2);
        expect(txData.accessList).to.be.an("array");
        expect(txData.accessList.length).to.equal(1);
        expect(txData.accessList[0][0]).to.be.instanceOf(Uint8Array);
        expect(txData.accessList[0][1]).to.be.an("array");
        expect(txData.accessList[0][1].length).to.equal(1);

        // Verify toJSON format
        const json = txData.toJSON();
        expect(json.accessList[0]).to.have.property("address");
        expect(json.accessList[0]).to.have.property("storageKeys");

        // Verify roundtrip
        expect(txData.toBytes()).to.deep.equal(ethereumData2);

        const response2 = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData2)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record2 = await response2.getRecordWithSigner(wallet);
        expect(
            record2.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(2);
        const gasUsedWith = record2.contractFunctionResult.gasUsed.toNumber();

        expect(gasUsedWithout).to.be.gte(gasUsedWith);
    });

    it("EIP-2930 (type 1): access list reduces or matches gas usage", async function () {
        const evmAddress = await deployContract();
        const privateKey = await fundNewEcdsaAccount();

        const type = "01";
        const chainId = hex.decode("012a");
        const gasPrice = hex.decode("d1385c7bf0");
        const gasLimit = hex.decode("0249f0");
        const value = new Uint8Array();
        const to = hex.decode(evmAddress);

        // --- First call: setMessage WITHOUT access list (nonce 0) ---
        const callData1 = new ContractFunctionParameters()
            .addString("message without access list")
            ._build("setMessage");
        const nonce1 = new Uint8Array();
        const accessListEmpty = [];

        const encoded1 = encodeRlp([
            chainId,
            nonce1,
            gasPrice,
            gasLimit,
            to,
            value,
            callData1,
            accessListEmpty,
        ]).substring(2);

        const message1 = hex.decode(type + encoded1);
        const { v: v1, r: r1, s: s1 } = signMessage(privateKey, message1);

        const data1 = encodeRlp([
            chainId,
            nonce1,
            gasPrice,
            gasLimit,
            to,
            value,
            callData1,
            accessListEmpty,
            v1,
            r1,
            s1,
        ]).substring(2);

        const ethereumData1 = hex.decode(type + data1);

        const response1 = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData1)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record1 = await response1.getRecordWithSigner(wallet);
        expect(
            record1.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(1);
        const gasUsedWithout =
            record1.contractFunctionResult.gasUsed.toNumber();

        // --- Second call: setMessage WITH access list (nonce 1) ---
        const callData2 = new ContractFunctionParameters()
            .addString("message with access list")
            ._build("setMessage");
        const nonce2 = new Uint8Array([0x01]);

        const storageSlot0 = new Uint8Array(32);
        const accessListWithEntry = [[to, [storageSlot0]]];

        const encoded2 = encodeRlp([
            chainId,
            nonce2,
            gasPrice,
            gasLimit,
            to,
            value,
            callData2,
            accessListWithEntry,
        ]).substring(2);

        const message2 = hex.decode(type + encoded2);
        const { v: v2, r: r2, s: s2 } = signMessage(privateKey, message2);

        const data2 = encodeRlp([
            chainId,
            nonce2,
            gasPrice,
            gasLimit,
            to,
            value,
            callData2,
            accessListWithEntry,
            v2,
            r2,
            s2,
        ]).substring(2);

        const ethereumData2 = hex.decode(type + data2);

        // Verify fromBytes correctly parses non-empty access list
        const txData = EthereumTransactionData.fromBytes(ethereumData2);
        expect(txData.accessList).to.be.an("array");
        expect(txData.accessList.length).to.equal(1);
        expect(txData.accessList[0][0]).to.be.instanceOf(Uint8Array);
        expect(txData.accessList[0][1]).to.be.an("array");
        expect(txData.accessList[0][1].length).to.equal(1);

        // Verify toJSON format
        const json = txData.toJSON();
        expect(json.accessList[0]).to.have.property("address");
        expect(json.accessList[0]).to.have.property("storageKeys");

        // Verify roundtrip
        expect(txData.toBytes()).to.deep.equal(ethereumData2);

        const response2 = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData2)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record2 = await response2.getRecordWithSigner(wallet);
        expect(
            record2.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(2);
        const gasUsedWith = record2.contractFunctionResult.gasUsed.toNumber();

        expect(gasUsedWithout).to.be.gte(gasUsedWith);
    });

    // TODO: unskip when a consensus node tag supports EIP-7702 (Pectra) type 4 transactions
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("EIP-7702 (type 4): access list reduces or matches gas usage", async function () {
        const evmAddress = await deployContract();
        const privateKey = await fundNewEcdsaAccount();

        const type = "04";
        const chainId = hex.decode("012a");
        const maxPriorityGas = hex.decode("00");
        const maxGas = hex.decode("d1385c7bf0");
        const gasLimit = hex.decode("0249f0");
        const value = new Uint8Array();
        const to = hex.decode(evmAddress);

        // Empty authorization list is valid per EIP-7702.
        // Our focus here is testing access list support in type-4 transactions.
        const authorizationList = [];

        // --- First call: setMessage WITHOUT access list (nonce 0) ---
        const callData1 = new ContractFunctionParameters()
            .addString("message without access list")
            ._build("setMessage");
        const nonce1 = new Uint8Array();
        const accessListEmpty = [];

        const encoded1 = encodeRlp([
            chainId,
            nonce1,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData1,
            accessListEmpty,
            authorizationList,
        ]).substring(2);

        const message1 = hex.decode(type + encoded1);
        const { v: v1, r: r1, s: s1 } = signMessage(privateKey, message1);

        const data1 = encodeRlp([
            chainId,
            nonce1,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData1,
            accessListEmpty,
            authorizationList,
            v1,
            r1,
            s1,
        ]).substring(2);

        const ethereumData1 = hex.decode(type + data1);

        const response1 = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData1)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record1 = await response1.getRecordWithSigner(wallet);
        expect(
            record1.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(1);
        const gasUsedWithout =
            record1.contractFunctionResult.gasUsed.toNumber();

        // --- Second call: setMessage WITH access list (nonce 1) ---
        const callData2 = new ContractFunctionParameters()
            .addString("message with access list")
            ._build("setMessage");
        const nonce2 = new Uint8Array([0x01]);

        const storageSlot0 = new Uint8Array(32);
        const accessListWithEntry = [[to, [storageSlot0]]];

        const encoded2 = encodeRlp([
            chainId,
            nonce2,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData2,
            accessListWithEntry,
            authorizationList,
        ]).substring(2);

        const message2 = hex.decode(type + encoded2);
        const { v: v2, r: r2, s: s2 } = signMessage(privateKey, message2);

        const data2 = encodeRlp([
            chainId,
            nonce2,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData2,
            accessListWithEntry,
            authorizationList,
            v2,
            r2,
            s2,
        ]).substring(2);

        const ethereumData2 = hex.decode(type + data2);

        // Verify fromBytes correctly parses access list and authorization list
        const txData = EthereumTransactionData.fromBytes(ethereumData2);
        expect(txData.accessList).to.be.an("array");
        expect(txData.accessList.length).to.equal(1);
        expect(txData.accessList[0][0]).to.be.instanceOf(Uint8Array);
        expect(txData.accessList[0][1]).to.be.an("array");
        expect(txData.accessList[0][1].length).to.equal(1);

        // Verify authorization list is preserved (empty)
        expect(txData.authorizationList).to.be.an("array");
        expect(txData.authorizationList.length).to.equal(0);

        // Verify toJSON format
        const json = txData.toJSON();
        expect(json.accessList[0]).to.have.property("address");
        expect(json.accessList[0]).to.have.property("storageKeys");

        // Verify roundtrip
        expect(txData.toBytes()).to.deep.equal(ethereumData2);

        const response2 = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData2)
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record2 = await response2.getRecordWithSigner(wallet);
        expect(
            record2.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(2);
        const gasUsedWith = record2.contractFunctionResult.gasUsed.toNumber();

        expect(gasUsedWithout).to.be.gte(gasUsedWith);
    });
});
