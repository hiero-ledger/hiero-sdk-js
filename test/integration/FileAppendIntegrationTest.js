import {
    AccountId,
    FileAppendTransaction,
    FileContentsQuery,
    FileCreateTransaction,
    FileDeleteTransaction,
    FileInfoQuery,
    Hbar,
    Status,
    Timestamp,
    TransactionId,
} from "../../src/exports.js";
import { bigContents } from "./contents.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("FileAppend", function () {
    let env;
    let newContentsLength;
    let newContents;
    let operatorKey;

    before(async function () {
        env = await IntegrationTestEnv.new();
        newContentsLength = 5000;
        newContents = generateUInt8Array(newContentsLength);
        operatorKey = env.operatorKey.publicKey;
    });

    it("should be executable", async function () {
        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents("[e2e::FileCreateTransaction]")
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        let info = await new FileInfoQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(22))
            .execute(env.client);

        expect(info.fileId.toString()).to.be.equal(file.toString());
        expect(info.size.toInt()).to.be.equal(28);
        expect(info.isDeleted).to.be.false;
        expect(info.keys.toArray().length).to.be.equal(1);

        // There should only be one key
        for (const key of info.keys) {
            expect(key.toString()).to.be.equal(operatorKey.toString());
        }

        await (
            await new FileAppendTransaction()
                .setFileId(file)
                .setContents("[e2e::FileAppendTransaction]")
                .execute(env.client)
        ).getReceipt(env.client);

        info = await new FileInfoQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(info.fileId.toString()).to.be.equal(file.toString());
        expect(info.size.toInt()).to.be.equal(56);
        expect(info.isDeleted).to.be.false;
        expect(info.keys.toArray().length).to.be.equal(1);

        // There should only be one key
        for (const key of info.keys) {
            expect(key.toString()).to.be.equal(operatorKey.toString());
        }

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should be chunk contents", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents("[e2e::FileCreateTransaction]")
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        let info = await new FileInfoQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(22))
            .execute(env.client);

        expect(info.fileId.toString()).to.be.equal(file.toString());
        expect(info.size.toInt()).to.be.equal(28);
        expect(info.isDeleted).to.be.false;
        expect(info.keys.toArray().length).to.be.equal(1);

        // There should only be one key
        for (const key of info.keys) {
            expect(key.toString()).to.be.equal(operatorKey.toString());
        }

        await (
            await new FileAppendTransaction()
                .setFileId(file)
                .setContents(bigContents)
                .execute(env.client)
        ).getReceipt(env.client);

        info = await new FileInfoQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(info.fileId.toString()).to.be.equal(file.toString());
        expect(info.size.toInt()).to.be.equal(13523);
        expect(info.isDeleted).to.be.false;
        expect(info.keys.toArray().length).to.be.equal(1);

        // There should only be one key
        for (const key of info.keys) {
            expect(key.toString()).to.be.equal(operatorKey.toString());
        }

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error with no file ID set", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents("[e2e::FileCreateTransaction]")
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        let err = false;

        try {
            await (
                await new FileAppendTransaction()
                    .setContents("[e2e::FileAppendTransaction]")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidFileId);
        }

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);

        if (!err) {
            throw new Error("file append transaction did not error");
        }
    });

    it("should not error with no contents appended", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents("[e2e::FileCreateTransaction]")
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        await (
            await new FileAppendTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should keep content after deserialization", async function () {
        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(Buffer.from(""))
            .execute(env.client);

        let { fileId } = await response.getReceipt(env.client);

        expect(fileId).to.not.be.null;
        expect(fileId != null ? fileId.num > 0 : false).to.be.true;

        const tx = new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(newContents);

        const txBytes = tx.toBytes();
        const txFromBytes = FileAppendTransaction.fromBytes(txBytes);

        await (await txFromBytes.execute(env.client)).getReceipt(env.client);

        const content = await new FileInfoQuery()
            .setFileId(fileId)
            .execute(env.client);

        expect(content.size.toInt()).to.be.equal(newContentsLength);
    });

    it("should be able to freeze after deserialize", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(Buffer.from(""))
            .execute(env.client);

        let { fileId } = await response.getReceipt(env.client);

        expect(fileId).to.not.be.null;
        expect(fileId != null ? fileId.num > 0 : false).to.be.true;

        const tx = new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(newContents);

        const txBytes = tx.toBytes();
        const txFromBytes = FileAppendTransaction.fromBytes(txBytes);

        txFromBytes.freezeWith(env.client);

        expect(txFromBytes.isFrozen()).to.be.true;
    });

    it("should be able to work with one chunk", async function () {
        const CHUNK_SIZE = 4096;
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(Buffer.from(""))
            .execute(env.client);

        let { fileId } = await response.getReceipt(env.client);

        expect(fileId).to.not.be.null;
        expect(fileId != null ? fileId.num > 0 : false).to.be.true;

        const tx = await new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(generateUInt8Array(CHUNK_SIZE))
            .setChunkSize(CHUNK_SIZE)
            .execute(env.client);

        const receipt = await tx.getReceipt(env.client);
        expect(receipt.status).to.be.equal(Status.Success);

        const fileInfo = await new FileContentsQuery()
            .setFileId(fileId)
            .execute(env.client);

        expect(fileInfo.length).to.be.equal(CHUNK_SIZE);
    });

    it("should be able to sign transaction with 1 chunk", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(Buffer.from(""))
            .execute(env.client);

        let { fileId } = await response.getReceipt(env.client);

        const txBytes = new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(Buffer.from("test"))
            .toBytes();

        const fromBytesTx = FileAppendTransaction.fromBytes(txBytes).freezeWith(
            env.client,
        );
        // should start empty before adding signature
        expect(fromBytesTx._signerPublicKeys).to.be.empty;

        // should have 1 signature after adding signature
        const signature = env.operatorKey.signTransaction(fromBytesTx);
        fromBytesTx.addSignature(env.operatorKey.publicKey, signature);
        expect(fromBytesTx._signerPublicKeys).to.have.length(1);

        const receipt = await (
            await fromBytesTx.execute(env.client)
        ).getReceipt(env.client);
        expect(receipt.status).to.be.equal(Status.Success);
    });

    it("should keep transaction id after non-frozen deserialization", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(Buffer.from(""))
            .execute(env.client);

        let { fileId } = await response.getReceipt(env.client);

        const chunkInterval = 230;
        const validStart = Timestamp.fromDate(new Date());

        const tx = new FileAppendTransaction()
            .setTransactionId(
                TransactionId.withValidStart(env.operatorId, validStart),
            )
            .setFileId(fileId)
            .setChunkInterval(chunkInterval)
            .setChunkSize(1000)
            .setContents(newContents);

        const txBytes = tx.toBytes();
        const txFromBytes = FileAppendTransaction.fromBytes(txBytes);

        expect(
            txFromBytes.transactionId.accountId._toProtobuf(),
        ).to.be.deep.equal(env.operatorId?._toProtobuf());
        expect(txFromBytes.transactionId.validStart).to.be.deep.equal(
            validStart,
        );

        txFromBytes._transactionIds.list.forEach(
            (transactionId, index, array) => {
                if (index > 0) {
                    const previousTimestamp = array[index - 1].validStart;
                    const currentTimestamp = transactionId.validStart;
                    const difference =
                        currentTimestamp.nanos - previousTimestamp.nanos;
                    expect(difference).to.be.equal(chunkInterval);
                }
            },
        );

        txFromBytes.freezeWith(env.client);
        await txFromBytes.sign(env.operatorKey);

        const receipt = await (
            await txFromBytes.execute(env.client)
        ).getReceipt(env.client);
        expect(receipt.status).to.be.equal(Status.Success);
    });

    it("should keep chunk size, chunk interval and correct max chunks after deserialization", async function () {
        const operatorKey = env.operatorKey.publicKey;
        const chunkSize = 1024;
        const chunkInterval = 230;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(Buffer.from(""))
            .execute(env.client);

        let { fileId } = await response.getReceipt(env.client);

        const tx = new FileAppendTransaction()
            .setFileId(fileId)
            .setChunkSize(chunkSize)
            .setChunkInterval(chunkInterval)
            .setMaxChunks(99999)
            .setContents(newContents);

        const txBytes = tx.toBytes();
        const txFromBytes = FileAppendTransaction.fromBytes(txBytes);

        expect(txFromBytes.chunkSize).to.be.equal(1024);
        expect(txFromBytes.maxChunks).to.be.equal(
            txFromBytes.getRequiredChunks(),
        );
        expect(txFromBytes.chunkInterval).to.be.equal(230);

        txFromBytes.freezeWith(env.client);
        await txFromBytes.sign(env.operatorKey);

        const receipt = await (
            await txFromBytes.execute(env.client)
        ).getReceipt(env.client);
        expect(receipt.status).to.be.equal(Status.Success);
    });

    it("should return transaction bytes when content is empty", async function () {
        const operatorKey = env.operatorKey.publicKey;
        const validStart = Timestamp.fromDate(new Date());

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(Buffer.from(""))
            .execute(env.client);

        let { fileId } = await response.getReceipt(env.client);

        const transaction = new FileAppendTransaction()
            .setTransactionId(
                TransactionId.withValidStart(env.operatorId, validStart),
            )
            .setFileId(fileId);

        const transactionBytes = transaction.toBytes();

        const deserializedTransaction =
            FileAppendTransaction.fromBytes(transactionBytes);

        expect(transactionBytes.length).to.be.greaterThan(0);
        expect(transaction.transactionId).to.be.deep.equal(
            deserializedTransaction.transactionId,
        );
    });

    it("should serialize an incomplete transaction with node account ids set", async function () {
        const chunkSize = 1024;
        const chunkInterval = 230;
        const nodeAccountIds = [
            AccountId.fromString("0.0.3"),
            AccountId.fromString("0.0.4"),
        ];
        const tx = new FileAppendTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setChunkSize(chunkSize)
            .setChunkInterval(chunkInterval)
            .setMaxChunks(99999)
            .setContents(newContents);

        const txBytes = tx.toBytes();
        const txFromBytes = FileAppendTransaction.fromBytes(txBytes);

        expect(txFromBytes.nodeAccountIds).to.have.length(2);
        expect(txFromBytes.nodeAccountIds[0]).to.be.deep.equal(
            nodeAccountIds[0],
        );
        expect(txFromBytes.nodeAccountIds[1]).to.be.deep.equal(
            nodeAccountIds[1],
        );
        expect(txFromBytes.chunkSize).to.be.equal(1024);
        expect(txFromBytes.chunkInterval).to.be.equal(230);
        expect(txFromBytes.maxChunks).to.be.equal(
            txFromBytes.getRequiredChunks(),
        );
        expect(txFromBytes.contents).to.be.deep.equal(newContents);
    });

    after(async function () {
        await env.close();
    });
});

function generateUInt8Array(length) {
    const uint8Array = new Uint8Array(length);
    return uint8Array.fill(1);
}
