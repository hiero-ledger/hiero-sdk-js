import {
    FileAppendTransaction,
    AccountId,
    Timestamp,
    Transaction,
    TransactionId,
    FileId,
} from "../../src/index.js";

describe("FileAppendTransaction", function () {
    it("should throw an error if chunk size is 0", () => {
        const tx = new FileAppendTransaction();

        let err = false;
        try {
            tx.setChunkSize(0);
        } catch (error) {
            if (error.message.includes("Chunk size must be greater than 0"))
                err = true;
        }

        expect(err).to.be.true;
    });

    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );
        const contents = Uint8Array.from({ length: 25 }, (_, i) => i);

        const tx = new FileAppendTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setFileId(FileId.fromString("0.0.5005"))
            .setContents(contents)
            .setChunkSize(10)
            .setMaxChunks(3)
            .setChunkInterval(100)
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(FileAppendTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.fileId.toString()).to.equal("0.0.5005");
        expect(tx2.contents).to.deep.equal(contents);
        expect(tx2.chunkSize).to.equal(10);
        // maxChunks isn't in the protobuf; fromBytes() sets it to the number
        // of chunks, which is why the test uses exactly 3.
        expect(tx2.maxChunks).to.equal(3);
        expect(tx2.chunkInterval).to.equal(100);
    });
});
