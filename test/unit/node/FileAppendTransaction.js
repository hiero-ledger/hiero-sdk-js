import {
    FileAppendTransaction,
    AccountId,
    Timestamp,
    Hbar,
    TransactionId,
    FileId,
} from "../../../src/index.js";
import Long from "long";

describe("FileAppendTransaction", function () {
    const spenderAccountId1 = new AccountId(7);
    const fileId = new FileId(8);
    const nodeAccountId = new AccountId(10, 11, 12);
    const timestamp1 = new Timestamp(14, 15);
    const fee = new Hbar(5);
    const chunkSize = 1000;
    const smallContent = "abcdef";

    it("setChunkSize()", function () {
        const bigContent =
            "1".repeat(1000) + "2".repeat(1000) + "3".repeat(1000);

        let transaction = new FileAppendTransaction()
            .setTransactionId(
                TransactionId.withValidStart(spenderAccountId1, timestamp1),
            )
            .setNodeAccountIds([nodeAccountId])
            .setFileId(fileId)
            .setChunkSize(chunkSize)
            .setContents(bigContent)
            .freeze();

        const transactionId = transaction.transactionId;

        expect(transaction._transactionIds.list.length).to.be.equal(3);
        expect(transaction._nodeAccountIds.list.length).to.be.equal(1);
        expect(transaction.chunkSize).to.be.equal(chunkSize);
        expect(transaction.contents.toString()).to.be.equal(bigContent);
        expect(transaction.fileId).to.be.deep.equal(fileId);

        let body = transaction._makeTransactionBody(nodeAccountId);

        expect(body.transactionID).to.deep.equal(transactionId._toProtobuf());

        expect(body.transactionFee).to.deep.equal(fee.toTinybars());
        expect(body.memo).to.be.equal("");
        expect(body.transactionID).to.deep.equal(
            transaction._transactionIds.list[0]._toProtobuf(),
        );
        expect(body.nodeAccountID).to.deep.equal(nodeAccountId._toProtobuf());
        expect(body.transactionValidDuration).to.deep.equal({
            seconds: Long.fromNumber(120),
        });
        expect(body.fileAppend.fileID).to.deep.equal(fileId._toProtobuf());
        expect(body.fileAppend.contents.length).to.be.equal(1000);
        expect(body.fileAppend.contents[0]).to.be.equal(49);

        transaction._transactionIds.advance();
        body = transaction._makeTransactionBody(nodeAccountId);

        expect(body.transactionFee).to.deep.equal(fee.toTinybars());
        expect(body.memo).to.be.equal("");
        expect(body.transactionID).to.deep.equal(
            transaction._transactionIds.list[1]._toProtobuf(),
        );
        expect(body.nodeAccountID).to.deep.equal(nodeAccountId._toProtobuf());
        expect(body.transactionValidDuration).to.deep.equal({
            seconds: Long.fromNumber(120),
        });
        expect(body.fileAppend.fileID).to.deep.equal(fileId._toProtobuf());
        expect(body.fileAppend.contents.length).to.be.equal(1000);
        expect(body.fileAppend.contents[0]).to.be.equal(50);

        transaction._transactionIds.advance();
        body = transaction._makeTransactionBody(nodeAccountId);

        expect(body.transactionFee).to.deep.equal(fee.toTinybars());
        expect(body.memo).to.be.equal("");
        expect(body.transactionID).to.deep.equal(
            transaction._transactionIds.list[2]._toProtobuf(),
        );
        expect(body.nodeAccountID).to.deep.equal(nodeAccountId._toProtobuf());
        expect(body.transactionValidDuration).to.deep.equal({
            seconds: Long.fromNumber(120),
        });
        expect(body.fileAppend.fileID).to.deep.equal(fileId._toProtobuf());
        expect(body.fileAppend.contents.length).to.be.equal(1000);
        expect(body.fileAppend.contents[0]).to.be.equal(51);
    });

    it("setChunkInterval()", function () {
        const contents = "1".repeat(1000) + "2".repeat(1000) + "3".repeat(1000);
        const chunkInterval = 200;

        let transaction = new FileAppendTransaction()
            .setTransactionId(
                TransactionId.withValidStart(spenderAccountId1, timestamp1),
            )
            .setNodeAccountIds([nodeAccountId])
            .setFileId(fileId)
            .setChunkSize(chunkSize)
            .setContents(contents)
            .setChunkInterval(chunkInterval)
            .freeze();

        expect(transaction._transactionIds.list.length).to.be.equal(3);
        const requiredChunks = contents.length / chunkSize;

        let body = transaction._makeTransactionBody(nodeAccountId);

        expect(body.transactionID).to.deep.equal(
            transaction._transactionIds.list[0]._toProtobuf(),
        );

        for (let i = 1; i < requiredChunks; i++) {
            transaction._transactionIds.advance();
            body = transaction._makeTransactionBody(nodeAccountId);
            expect(body.transactionID).to.deep.equal(
                transaction._transactionIds.list[i]._toProtobuf(),
            );

            expect(
                transaction._transactionIds.list[i].validStart.nanos.sub(
                    transaction._transactionIds.list[i - 1].validStart.nanos,
                ),
            ).to.deep.equal(Long.fromNumber(chunkInterval));
        }

        expect(
            transaction._transactionIds.list[
                requiredChunks - 1
            ].validStart.nanos.sub(
                transaction._transactionIds.list[0].validStart.nanos,
            ),
        ).to.deep.equal(Long.fromNumber(chunkInterval * (requiredChunks - 1)));
    });

    it("should not be able to build transaction with more chunks than maxRequiredChunks", function () {
        let transaction = new FileAppendTransaction()
            .setContents(smallContent)
            .setChunkSize(1)
            .setMaxChunks(smallContent.length - 1);

        expect(() => {
            transaction.toBytes();
        }).to.throw(
            `cannot build \`FileAppendTransaction\` with more than ${
                smallContent.length - 1
            } chunks`,
        );
    });

    it("should not be able to build all signed transaction with more than allowed chunks", async function () {
        const transaction = new FileAppendTransaction()
            .setNodeAccountIds([new AccountId(3)])
            .setTransactionId(TransactionId.generate(new AccountId(1)))
            .setContents(smallContent)
            .setChunkSize(1)
            .setMaxChunks(smallContent.length - 1)
            .freeze();

        expect(() => {
            transaction.toBytes();
        }).to.throw(
            `cannot build \`FileAppendTransaction\` with more than ${
                smallContent.length - 1
            } chunks`,
        );
    });

    it("should be able to build all signed transaction", async function () {
        const transaction = new FileAppendTransaction()
            .setNodeAccountIds([new AccountId(3)])
            .setTransactionId(TransactionId.generate(new AccountId(1)))
            .setContents(smallContent)
            .setChunkSize(1)
            .freeze();

        expect(transaction.isFrozen()).to.be.true;

        // calling toBytes will sign all transactions
        transaction.toBytes();

        expect(transaction._transactions.length).to.equal(smallContent.length);
        expect(transaction._signedTransactions.length).to.equal(
            smallContent.length,
        );
    });

    it("should set maxChunk if set in constructor", function () {
        const maxChunks = 10;
        const tx = new FileAppendTransaction({ maxChunks });
        expect(tx.maxChunks).to.equal(maxChunks);
    });

    it("should set chunkSize if set in constructor", function () {
        const chunkSize = 10;
        const tx = new FileAppendTransaction({ chunkSize });
        expect(tx.chunkSize).to.equal(chunkSize);
    });

    it("should not be able to set scheduled message with bigger content than chunkSize", async function () {
        const tx = new FileAppendTransaction()
            .setContents(smallContent)
            .setChunkSize(1);

        expect(() => {
            tx.schedule();
        }).to.throw(
            `cannot schedule \`FileAppendTransaction\` with message over ${tx.chunkSize} bytes`,
        );
    });

    it("should verify default chunk size fits within network transaction size limit", function () {
        const NETWORK_TRANSACTION_LIMIT = 6144;
        const ED25519_SIGNATURE_OVERHEAD = 102; // pubKeyPrefix(34) + ed25519Sig(66) + wrapping(2)
        const SIGNED_TRANSACTION_WRAPPER_OVERHEAD = 6; // bodyBytes field(3) + sigMap field(3)
        const DEFAULT_CHUNK_SIZE = 4096;

        const transaction = new FileAppendTransaction()
            .setTransactionId(
                TransactionId.withValidStart(spenderAccountId1, timestamp1),
            )
            .setNodeAccountIds([nodeAccountId])
            .setFileId(fileId)
            .setChunkSize(DEFAULT_CHUNK_SIZE)
            .setContents(new Uint8Array(DEFAULT_CHUNK_SIZE).fill(0x41))
            .freeze();

        const bodySize = transaction.bodySize;

        function totalSignedTransactionSize(sigCount) {
            return (
                SIGNED_TRANSACTION_WRAPPER_OVERHEAD +
                bodySize +
                sigCount * ED25519_SIGNATURE_OVERHEAD
            );
        }

        // Default chunk size (4096) should fit within network limits
        // for transactions with up to 19 Ed25519 signatures
        expect(totalSignedTransactionSize(1)).to.be.lessThan(
            NETWORK_TRANSACTION_LIMIT,
        );
        expect(totalSignedTransactionSize(5)).to.be.lessThan(
            NETWORK_TRANSACTION_LIMIT,
        );
        expect(totalSignedTransactionSize(10)).to.be.lessThan(
            NETWORK_TRANSACTION_LIMIT,
        );
        expect(totalSignedTransactionSize(19)).to.be.lessThan(
            NETWORK_TRANSACTION_LIMIT,
        );

        // With 20+ signatures, the default chunk size exceeds the limit
        expect(totalSignedTransactionSize(20)).to.be.greaterThanOrEqual(
            NETWORK_TRANSACTION_LIMIT,
        );
    });

    it("should determine maximum chunk size for 50 signatures", function () {
        const NETWORK_TRANSACTION_LIMIT = 6144;
        const ED25519_SIGNATURE_OVERHEAD = 102;
        const SIGNED_TRANSACTION_WRAPPER_OVERHEAD = 6;
        const SIG_COUNT = 50;

        // Binary search for the maximum chunk size that fits within the network limit
        // when 50 Ed25519 signatures are present
        let low = 1;
        let high = 4096;
        let maxChunkSize = 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);

            const tx = new FileAppendTransaction()
                .setTransactionId(
                    TransactionId.withValidStart(
                        spenderAccountId1,
                        timestamp1,
                    ),
                )
                .setNodeAccountIds([nodeAccountId])
                .setFileId(fileId)
                .setChunkSize(mid)
                .setContents(new Uint8Array(mid).fill(0x41))
                .freeze();

            const totalSize =
                SIGNED_TRANSACTION_WRAPPER_OVERHEAD +
                tx.bodySize +
                SIG_COUNT * ED25519_SIGNATURE_OVERHEAD;

            if (totalSize <= NETWORK_TRANSACTION_LIMIT) {
                maxChunkSize = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        // With 50 signatures, max chunk size should be well below the default 4096
        expect(maxChunkSize).to.be.lessThan(4096);
        expect(maxChunkSize).to.be.greaterThan(0);
    });
});
