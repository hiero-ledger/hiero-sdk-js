import {
    AccountCreateTransaction,
    AccountId,
    PrivateKey,
    Timestamp,
    TransactionId,
    BatchTransaction,
    TransferTransaction,
    FreezeTransaction,
} from "../../src/index.js";
import { expect } from "chai";

describe("BatchTransaction", function () {
    let batchTransaction;
    let mockTransaction1;
    let mockTransaction2;
    let transactionId;

    beforeEach(async function () {
        transactionId = TransactionId.generate(new AccountId(0, 0, 1));
        const batchKey = PrivateKey.generateECDSA();
        mockTransaction1 = await new TransferTransaction()
            .setTransactionId(transactionId)
            .setBatchKey(batchKey)
            .freeze()
            .sign(batchKey);

        mockTransaction2 = await new TransferTransaction()
            .setTransactionId(transactionId)
            .setBatchKey(batchKey)
            .freeze()
            .sign(batchKey);
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
            batchTransaction.setInnerTransactions([
                mockTransaction1,
                mockTransaction1,
            ]);

            const ids = batchTransaction.innerTransactionIds;

            expect(ids).to.deep.equal([transactionId, transactionId]);
        });
    });

    describe("validaty of inner transactions", function () {
        it("should throw an error if the inner transactions are not valid", function () {
            const invalidTransaction = new TransferTransaction().setBatchKey(
                PrivateKey.generateECDSA(),
            );

            expect(() =>
                batchTransaction.addInnerTransaction(invalidTransaction),
            ).to.throw(
                "Transaction must be frozen before being added to a batch",
            );
        });

        it("should throw an error if the inner transactions doesnt have batch key", async function () {
            const invalidTransaction = await new TransferTransaction()
                .setTransactionId(transactionId)
                .setNodeAccountIds([new AccountId(0, 0, 1)])
                .freeze()
                .sign(PrivateKey.generateECDSA());

            expect(() =>
                batchTransaction.addInnerTransaction(invalidTransaction),
            ).to.throw("Transaction must have a batch key");
        });

        it("should throw an error if transaction is not allowed", async function () {
            const invalidTransaction = new BatchTransaction();

            expect(() =>
                batchTransaction.addInnerTransaction(invalidTransaction),
            ).to.throw("Transaction is not allowed to be added to a batch");

            const invalidTransaction2 = new FreezeTransaction();
            expect(() =>
                batchTransaction.addInnerTransaction(invalidTransaction2),
            ).to.throw("Transaction is not allowed to be added to a batch");
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
                .setTransactionId(transactionId)
                .setBatchKey(privKey1)
                .freeze()
                .sign(privKey1);

            // Create and sign second transaction

            const privKey2 = PrivateKey.generateECDSA();
            const tx2 = await new AccountCreateTransaction()
                .setKeyWithAlias(privKey2.publicKey, privKey2)
                .setTransactionId(transactionId)
                .setBatchKey(privKey2)
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
