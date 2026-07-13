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
    MirrorNodeContractEstimateQuery,
} from "../../src/exports.js";
import {
    SMART_CONTRACT_BYTECODE,
    SMART_CONTRACT_BYTECODE_JUMBO,
} from "./contents.js";
import { encodeRlp } from "ethers";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import * as hex from "../../src/encoding/hex.js";
import EthereumTransactionDataEip1559 from "../../src/EthereumTransactionDataEip1559.js";
import EthereumTransactionDataEip7702 from "../../src/EthereumTransactionDataEip7702.js";

/**
 * @summary E2E-HIP-844
 * @url https://hips.hedera.com/hip/hip-844
 *
 * @description
 * At the moment the ethereum transaction behavior is not stable.
 * Occasionally the test fails with the following error INVALID_ACCOUNT_ID.
 * The test suite will be skipped until the problem is investigated and fixed.
 */

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

        const encoded = encodeRlp([
            chainId,
            nonce,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData,
            accessList,
        ]).substring(2);
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

        const data = encodeRlp([
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
        ]).substring(2);
        expect(typeof data).to.equal("string");

        const ethereumData = hex.decode(type + data);
        expect(ethereumData.length).to.be.gt(0);

        const response = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData)
                    .setMaxTransactionFee(new Hbar(10))
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

    it("accepts a natively signed EthereumTransactionData via the object overload", async function () {
        // Deploy the contract to call.
        const fileReceipt = await (
            await (
                await (
                    await new FileCreateTransaction()
                        .setKeys([wallet.getAccountKey()])
                        .setContents(SMART_CONTRACT_BYTECODE)
                        .setMaxTransactionFee(new Hbar(2))
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);
        const fileId = fileReceipt.fileId;
        expect(fileId).to.be.instanceof(FileId);

        const contractReceipt = await (
            await (
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
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);
        expect(contractReceipt.status).to.be.equal(Status.Success);
        const localContractAddress = contractReceipt.contractId.toEvmAddress();

        // Fund an ECDSA alias to act as the Ethereum sender.
        const privateKey = PrivateKey.generateECDSA();
        const accountAlias = privateKey.publicKey.toEvmAddress();
        await (
            await (
                await new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(10).negated())
                    .addHbarTransfer(accountAlias, new Hbar(10))
                    .setMaxTransactionFee(new Hbar(1))
                    .freezeWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        const callData = new ContractFunctionParameters()
            .addString("new message")
            ._build("setMessage");

        // Build the envelope as a structured object and sign it natively -
        // no manual RLP / r / s / v threading required.
        const data = new EthereumTransactionDataEip1559({
            chainId: hex.decode("012a"),
            nonce: new Uint8Array(),
            maxPriorityGas: hex.decode("00"),
            maxGas: hex.decode("d1385c7bf0"),
            gasLimit: hex.decode("0249f0"),
            to: hex.decode(localContractAddress),
            value: new Uint8Array(),
            callData,
            accessList: [],
            recId: new Uint8Array(),
            r: new Uint8Array(),
            s: new Uint8Array(),
        }).sign(privateKey);

        expect(data.isSigned()).to.be.true;

        // The object overload accepts the signed envelope directly.
        const response = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(data)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record = await response.getRecordWithSigner(wallet);
        expect(record).to.be.instanceof(TransactionRecord);

        const receipt = await response.getReceiptWithSigner(wallet);
        expect(receipt).to.be.instanceof(TransactionReceipt);
        expect(receipt.status).to.be.equal(Status.Success);
        expect(
            record.contractFunctionResult.signerNonce.toNumber(),
        ).to.be.equal(1);
    });

    it("rejects an unsigned EthereumTransactionData before submission", function () {
        const data = new EthereumTransactionDataEip1559({
            chainId: hex.decode("012a"),
            nonce: new Uint8Array(),
            maxPriorityGas: hex.decode("00"),
            maxGas: hex.decode("d1385c7bf0"),
            gasLimit: hex.decode("0249f0"),
            to: new Uint8Array(),
            value: new Uint8Array(),
            callData: new Uint8Array(),
            accessList: [],
            recId: new Uint8Array(),
            r: new Uint8Array(),
            s: new Uint8Array(),
        });

        expect(() => new EthereumTransaction().setEthereumData(data)).to.throw(
            /not signed/,
        );
    });

    // Skipped until the target network executes EIP-7702 / HIP-1340 type-4
    // transactions. Consensus v0.74.0 ships only the protobuf changes, so the
    // node rejects the envelope at precheck with INVALID_ETHEREUM_TRANSACTION —
    // a status that is indistinguishable from a malformed envelope, so we do
    // NOT swallow it dynamically (that would mask a real encoding bug). Enable
    // this test and validate the authorization encoding once a capable node is
    // available.
    it.skip("signs and submits an EIP-7702 delegation (HIP-1340)", async function () {
        const chainId = hex.decode("012a");

        // Deploy the contract whose code the EOA will delegate to.
        const fileReceipt = await (
            await (
                await (
                    await new FileCreateTransaction()
                        .setKeys([wallet.getAccountKey()])
                        .setContents(SMART_CONTRACT_BYTECODE)
                        .setMaxTransactionFee(new Hbar(2))
                        .freezeWithSigner(wallet)
                ).signWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);
        const fileId = fileReceipt.fileId;

        const contractReceipt = await (
            await (
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
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);
        expect(contractReceipt.status).to.be.equal(Status.Success);
        const delegateAddress = hex.decode(
            contractReceipt.contractId.toEvmAddress(),
        );

        // Fund the ECDSA account that is both the authority and the sender
        // (self-sponsored delegation).
        const key = PrivateKey.generateECDSA();
        const accountAlias = key.publicKey.toEvmAddress();
        await (
            await (
                await new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(10).negated())
                    .addHbarTransfer(accountAlias, new Hbar(10))
                    .setMaxTransactionFee(new Hbar(1))
                    .freezeWithSigner(wallet)
            ).executeWithSigner(wallet)
        ).getReceiptWithSigner(wallet);

        // Build and sign the authorization tuple [chainId, address, nonce,
        // yParity, r, s]. The authority signs keccak256(0x05 ‖ rlp([chainId,
        // address, nonce])). For a self-sponsored tx the authority nonce is the
        // sender's tx nonce + 1 (the tx consumes nonce 0).
        const authNonce = hex.decode("01");
        const authMessage = hex.decode(
            "05" +
                encodeRlp([chainId, delegateAddress, authNonce]).substring(2),
        );
        const authSignature = key.sign(authMessage);
        const authR = authSignature.slice(0, 32);
        const authS = authSignature.slice(32, 64);
        const authRecId = key.getRecoveryId(authR, authS, authMessage);
        const authorizationTuple = [
            chainId,
            delegateAddress,
            authNonce,
            new Uint8Array(authRecId === 0 ? [] : [authRecId]),
            authR,
            authS,
        ];

        const callData = new ContractFunctionParameters()
            .addString("new message")
            ._build("setMessage");

        // Build the type-4 envelope (to = the EOA itself, now carrying the
        // delegated code) and sign it natively with the sender key.
        const data = new EthereumTransactionDataEip7702({
            chainId,
            nonce: new Uint8Array(),
            maxPriorityGas: hex.decode("00"),
            maxGas: hex.decode("d1385c7bf0"),
            gasLimit: hex.decode("0249f0"),
            to: hex.decode(accountAlias),
            value: new Uint8Array(),
            callData,
            accessList: [],
            authorizationList: [authorizationTuple],
            recId: new Uint8Array(),
            r: new Uint8Array(),
            s: new Uint8Array(),
        }).sign(key);

        expect(data.isSigned()).to.be.true;

        const response = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(data)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWithSigner(wallet)
            ).signWithSigner(wallet)
        ).executeWithSigner(wallet);

        const receipt = await response.getReceiptWithSigner(wallet);
        expect(receipt).to.be.instanceof(TransactionReceipt);
        expect(receipt.status).to.be.equal(Status.Success);
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

        const encoded = encodeRlp([
            chainId,
            nonce,
            maxPriorityGas,
            maxGas,
            gasLimit,
            to,
            value,
            callData,
            accessList,
        ]).substring(2);
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

        const data = encodeRlp([
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
        ]).substring(2);
        expect(typeof data).to.equal("string");

        const ethereumData = hex.decode(type + data);
        expect(ethereumData.length).to.be.gt(0);

        const response = await (
            await (
                await new EthereumTransaction()
                    .setEthereumData(ethereumData)
                    .setMaxTransactionFee(new Hbar(100))
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
