import {
    AccountDeleteTransaction,
    AccountId,
    TransactionId,
} from "../../src/index.js";
import { describeTransaction } from "./utils/transactionTests.js";

describe("AccountDeleteTransaction", function () {
    describeTransaction(AccountDeleteTransaction, {
        dataCase: "cryptoDelete",
        execute: ["crypto", "cryptoDelete"],
        fields: [
            {
                name: "accountId",
                value: new AccountId(0, 0, 3333),
                entityId: true,
            },
            {
                name: "transferAccountId",
                value: new AccountId(0, 0, 4444),
                entityId: true,
            },
        ],
    });

    let accountId;
    let transferAccountId;
    let transactionId;
    let nodeId;

    beforeEach(function () {
        accountId = new AccountId(0, 0, 3333);
        transferAccountId = new AccountId(0, 0, 4444);
        transactionId = TransactionId.generate(new AccountId(0, 0, 5555));
        nodeId = new AccountId(0, 0, 3);
    });

    describe("getters and setters", function () {
        it("should set accountId from string", function () {
            const transaction = new AccountDeleteTransaction().setAccountId(
                accountId.toString(),
            );

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should set transferAccountId from string", function () {
            const transaction =
                new AccountDeleteTransaction().setTransferAccountId(
                    transferAccountId.toString(),
                );

            expect(transaction.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
        });
    });

    describe("_fromProtobuf", function () {
        it("should deserialize from protobuf correctly", function () {
            // Create mock protobuf objects
            const mockAccountDeleteBody = {
                cryptoDelete: {
                    deleteAccountID: accountId._toProtobuf(),
                    transferAccountID: transferAccountId._toProtobuf(),
                },
            };

            const mockTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            const mockSignedTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            // Execute fromProtobuf
            const transaction = AccountDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockAccountDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(AccountDeleteTransaction);
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
            expect(transaction.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
        });

        it("should handle null values in protobuf", function () {
            // Create minimal mock protobuf objects
            const mockAccountDeleteBody = {
                cryptoDelete: {},
            };

            const mockTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            const mockSignedTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            // Execute fromProtobuf
            const transaction = AccountDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockAccountDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(AccountDeleteTransaction);
            expect(transaction.accountId).to.be.null;
            expect(transaction.transferAccountId).to.be.null;
        });
    });

    describe("_makeTransactionData", function () {
        it("should create transaction data with all fields", function () {
            const transaction = new AccountDeleteTransaction()
                .setAccountId(accountId)
                .setTransferAccountId(transferAccountId);

            const transactionData = transaction._makeTransactionData();

            expect(transactionData.deleteAccountID).to.not.be.null;
            expect(transactionData.transferAccountID).to.not.be.null;

            if (transactionData.deleteAccountID) {
                expect(
                    new AccountId(
                        transactionData.deleteAccountID.shardNum,
                        transactionData.deleteAccountID.realmNum,
                        transactionData.deleteAccountID.accountNum,
                    ).toString(),
                ).to.equal(accountId.toString());
            }

            if (transactionData.transferAccountID) {
                expect(
                    new AccountId(
                        transactionData.transferAccountID.shardNum,
                        transactionData.transferAccountID.realmNum,
                        transactionData.transferAccountID.accountNum,
                    ).toString(),
                ).to.equal(transferAccountId.toString());
            }
        });

        it("should handle null fields", function () {
            const transaction = new AccountDeleteTransaction();
            // Both IDs are null in a new transaction

            const transactionData = transaction._makeTransactionData();

            expect(transactionData.deleteAccountID).to.be.null;
            expect(transactionData.transferAccountID).to.be.null;
        });
    });
});
