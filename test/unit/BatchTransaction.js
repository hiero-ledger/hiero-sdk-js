import {
    AccountCreateTransaction,
    AccountId,
    PrivateKey,
    Timestamp,
    TransactionId,
    BatchTransaction,
    Transaction,
} from "../../src/index.js";
import { expect } from "chai";

describe("BatchTransaction", function () {
    let batchTransaction;
    let mockTransaction1;
    let mockTransaction2;

    beforeEach(function () {
        mockTransaction1 = new Transaction();
        mockTransaction2 = new Transaction();
        batchTransaction = new BatchTransaction();
    });

    describe("constructor", function () {
        it("should initialize with empty transactions array when no options provided", function () {
            expect(batchTransaction.innerTransactions).to.deep.equal([]);
        });

        it("should initialize with provided transactions", function () {
            const transactions = [mockTransaction1, mockTransaction2];
            batchTransaction = new BatchTransaction({ transactions });
            expect(batchTransaction.innerTransactions).to.be.equal(
                transactions,
            );
        });
    });

    describe("setInnerTransactions", function () {
        it("should set transactions and return this for chaining", function () {
            const transactions = [mockTransaction1, mockTransaction2];
            const result = batchTransaction.setInnerTransactions(transactions);

            expect(batchTransaction.innerTransactions).to.be.eql(transactions);
            expect(result).to.equal(batchTransaction);
        });
    });

    describe("addInnerTransaction", function () {
        it("should add a transaction and return this for chaining", function () {
            const result =
                batchTransaction.addInnerTransaction(mockTransaction1);

            expect(batchTransaction.innerTransactions).to.contain(
                mockTransaction1,
            );
            expect(result).to.contain(batchTransaction);
        });
    });

    describe("getTransactionIds", function () {
        it("should return array of transaction IDs", function () {
            const mockTransactionId1 = new TransactionId(
                new AccountId(0, 0, 1),
            );
            const mockTransactionId2 = new TransactionId(
                new AccountId(0, 0, 2),
            );

            const tx = new Transaction().setTransactionId(mockTransactionId1);
            const tx2 = new Transaction().setTransactionId(mockTransactionId2);

            batchTransaction.setInnerTransactions([tx, tx2]);

            const ids = batchTransaction.innerTransactionIds;

            expect(ids).to.deep.equal([mockTransactionId1, mockTransactionId2]);
        });
    });

    describe("fromBytes/toBytes", function () {
        it("should correctly convert to and from bytes", async function () {
            const accountId = new AccountId(0, 0, 1);
            const nodeAccountId = new AccountId(0, 0, 3);
            const transactionId = new TransactionId(
                accountId,
                Timestamp.generate(),
            );

            // Create two transactions to batch
            const privKey1 = PrivateKey.generateECDSA();
            const tx1 = await new AccountCreateTransaction()
                .setKeyWithAlias(privKey1.publicKey, privKey1)
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(transactionId)
                .freeze()
                .sign(privKey1);

            // Create and sign second transaction

            const privKey2 = PrivateKey.generateECDSA();
            const tx2 = await new AccountCreateTransaction()
                .setKeyWithAlias(privKey2.publicKey, privKey2)
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(transactionId)
                .freeze()
                .sign(privKey1);

            // Create and freeze the batch transaction
            const batchTx = new BatchTransaction()
                .setInnerTransactions([tx1, tx2])
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(transactionId)
                .freeze();

            // Convert to bytes and back
            const batchTxBytes = batchTx.toBytes();
            const restoredTx = BatchTransaction.fromBytes(batchTxBytes);

            expect(restoredTx.innerTransactions[0].alias.toString()).to.equal(
                privKey1.publicKey.toEvmAddress(),
            );
            expect(restoredTx.innerTransactions[1].alias.toString()).to.equal(
                privKey2.publicKey.toEvmAddress(),
            );
            expect(restoredTx.innerTransactions[0].key.toString()).to.equal(
                privKey1.publicKey.toString(),
            );
            expect(restoredTx.innerTransactions[1].key.toString()).to.equal(
                privKey2.publicKey.toString(),
            );
            expect(restoredTx.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });
    });
});
