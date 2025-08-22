import {
    ContractDeleteTransaction,
    ContractId,
    AccountId,
    TransactionId,
    Client,
    LedgerId,
    Transaction,
    PrivateKey,
} from "../../src/index.js";

describe("ContractDeleteTransaction", function () {
    let contractId;
    let transferAccountId;
    let transferContractId;
    let transactionId;
    let nodeId;
    let privateKey;

    beforeEach(function () {
        contractId = new ContractId(0, 0, 5005);
        transferAccountId = new AccountId(0, 0, 3333);
        transferContractId = new ContractId(0, 0, 4444);
        transactionId = TransactionId.generate(new AccountId(0, 0, 5555));
        nodeId = new AccountId(0, 0, 3);
        privateKey = PrivateKey.generateED25519();
    });

    describe("_fromProtobuf", function () {
        it("should deserialize from protobuf correctly with all fields", function () {
            // Create mock protobuf objects
            const mockContractDeleteBody = {
                contractDeleteInstance: {
                    contractID: contractId._toProtobuf(),
                    transferAccountID: transferAccountId._toProtobuf(),
                    transferContractID: transferContractId._toProtobuf(),
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
            const transaction = ContractDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockContractDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(ContractDeleteTransaction);
            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(transaction.transferAccountId).to.be.null;
            expect(transaction.transferContractId.toString()).to.equal(
                transferContractId.toString(),
            );
            expect(transaction.permanentRemoval).to.be.false;
        });

        it("should deserialize from protobuf with only contractId", function () {
            // Create mock protobuf objects
            const mockContractDeleteBody = {
                contractDeleteInstance: {
                    contractID: contractId._toProtobuf(),
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
            const transaction = ContractDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockContractDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(ContractDeleteTransaction);
            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(transaction.transferAccountId).to.be.null;
            expect(transaction.transferContractId).to.be.null;
        });

        it("should deserialize from protobuf with only transferAccountId", function () {
            // Create mock protobuf objects
            const mockContractDeleteBody = {
                contractDeleteInstance: {
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
            const transaction = ContractDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockContractDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(ContractDeleteTransaction);
            expect(transaction.contractId).to.be.null;
            expect(transaction.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
            expect(transaction.transferContractId).to.be.null;
        });

        it("should deserialize from protobuf with only transferContractId", function () {
            // Create mock protobuf objects
            const mockContractDeleteBody = {
                contractDeleteInstance: {
                    transferContractID: transferContractId._toProtobuf(),
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
            const transaction = ContractDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockContractDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(ContractDeleteTransaction);
            expect(transaction.contractId).to.be.null;
            expect(transaction.transferAccountId).to.be.null;
            expect(transaction.transferContractId.toString()).to.equal(
                transferContractId.toString(),
            );
        });

        it("should handle null values in protobuf", function () {
            // Create minimal mock protobuf objects
            const mockContractDeleteBody = {
                contractDeleteInstance: {},
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
            const transaction = ContractDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockContractDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(ContractDeleteTransaction);
            expect(transaction.contractId).to.be.null;
            expect(transaction.transferAccountId).to.be.null;
            expect(transaction.transferContractId).to.be.null;
        });
    });

    describe("_validateChecksums", function () {
        it("should validate all IDs checksums when all are present", function () {
            // Create a client with a ledger ID
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            // Create mock objects with validation tracking
            const mockContractId = {
                shard: 0,
                realm: 0,
                contract: 5005,
                _checksum: "abcde",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const mockTransferAccountId = {
                shard: 0,
                realm: 0,
                account: 3333,
                _checksum: "fghij",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const mockTransferContractId = {
                shard: 0,
                realm: 0,
                contract: 4444,
                _checksum: "klmno",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            // Create a transaction with mock objects
            const transaction = new ContractDeleteTransaction();
            transaction._contractId = mockContractId;
            transaction._transferAccountId = mockTransferAccountId;
            transaction._transferContractId = mockTransferContractId;

            // Validate checksums
            transaction._validateChecksums(client);

            // Verify validation was called for all IDs
            expect(mockContractId.validateChecksumCalled).to.be.true;
            expect(mockTransferAccountId.validateChecksumCalled).to.be.true;
            expect(mockTransferContractId.validateChecksumCalled).to.be.true;
        });

        it("should validate only contractId when others are null", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const mockContractId = {
                shard: 0,
                realm: 0,
                contract: 5005,
                _checksum: "abcde",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const transaction = new ContractDeleteTransaction();
            transaction._contractId = mockContractId;
            // transferAccountId and transferContractId are already null

            // Should not throw an error
            transaction._validateChecksums(client);

            // Verify validation was called only for contractId
            expect(mockContractId.validateChecksumCalled).to.be.true;
        });

        it("should validate only transferAccountId when others are null", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const mockTransferAccountId = {
                shard: 0,
                realm: 0,
                account: 3333,
                _checksum: "fghij",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const transaction = new ContractDeleteTransaction();
            // contractId is already null
            transaction._transferAccountId = mockTransferAccountId;
            // transferContractId is already null

            // Should not throw an error
            transaction._validateChecksums(client);

            // Verify validation was called only for transferAccountId
            expect(mockTransferAccountId.validateChecksumCalled).to.be.true;
        });

        it("should validate only transferContractId when others are null", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const mockTransferContractId = {
                shard: 0,
                realm: 0,
                contract: 4444,
                _checksum: "klmno",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const transaction = new ContractDeleteTransaction();
            // contractId is already null
            // transferAccountId is already null
            transaction._transferContractId = mockTransferContractId;

            // Should not throw an error
            transaction._validateChecksums(client);

            // Verify validation was called only for transferContractId
            expect(mockTransferContractId.validateChecksumCalled).to.be.true;
        });

        it("should handle all null IDs during checksum validation", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const transaction = new ContractDeleteTransaction();
            // All IDs are already null in a new transaction

            // Should not throw an error
            expect(() => transaction._validateChecksums(client)).to.not.throw();
        });
    });

    describe("serialization/deserialization", function () {
        it("should serialize and deserialize correctly", async function () {
            // Create a transaction with all properties set
            const transaction = await new ContractDeleteTransaction()
                .setContractId(contractId)
                .setTransferAccountId(transferAccountId)
                .setTransferContractId(transferContractId)
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze()
                .sign(privateKey);

            // Convert to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize from bytes
            const deserialized = Transaction.fromBytes(transactionBytes);

            // Verify the transaction properties
            expect(deserialized).to.be.instanceOf(ContractDeleteTransaction);

            const deserializedDelete =
                /** @type {ContractDeleteTransaction} */ (deserialized);

            expect(deserializedDelete.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(deserializedDelete.transferAccountId).to.be.null;
            expect(deserializedDelete.transferContractId.toString()).to.equal(
                transferContractId.toString(),
            );
        });
    });
});
