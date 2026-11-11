import { vi } from "vitest";
import {
    Client,
    FileAppendTransaction,
    ScheduleCreateTransaction,
    AccountId,
    Timestamp,
    Transaction,
    TransactionId,
    FileId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

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

    describe("fields", function () {
        const VALID_START = new Timestamp(1596210382, 0);

        let fileId, contents, transactionId, nodeId;

        beforeEach(function () {
            fileId = new FileId(0, 0, 5005);
            contents = Uint8Array.from({ length: 25 }, (_, i) => i);
            transactionId = TransactionId.withValidStart(
                new AccountId(0, 0, 1001),
                VALID_START,
            );
            nodeId = new AccountId(0, 0, 3);
        });

        /**
         * @param {FileAppendTransaction} transaction
         * @returns {FileAppendTransaction}
         */
        function freezeWithIds(transaction) {
            return transaction
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze();
        }

        describe("constructor", function () {
            it("should use the defaults", function () {
                const transaction = new FileAppendTransaction();

                expect(transaction.fileId).to.be.null;
                expect(transaction.contents).to.be.null;
                expect(transaction.maxChunks).to.equal(20);
                expect(transaction.chunkSize).to.equal(4096);
                expect(transaction.chunkInterval).to.equal(10);
            });

            it("should set the fields given in props", function () {
                const transaction = new FileAppendTransaction({
                    fileId,
                    contents,
                    maxChunks: 5,
                    chunkSize: 10,
                    chunkInterval: 100,
                });

                expect(transaction.fileId.toString()).to.equal(
                    fileId.toString(),
                );
                expect(transaction.contents).to.equal(contents);
                expect(transaction.maxChunks).to.equal(5);
                expect(transaction.chunkSize).to.equal(10);
                expect(transaction.chunkInterval).to.equal(100);
            });

            it("should accept strings in props", function () {
                const transaction = new FileAppendTransaction({
                    fileId: "0.0.5005",
                    contents: "contents",
                });

                expect(transaction.fileId.toString()).to.equal("0.0.5005");
                expect(transaction.contents).to.deep.equal(
                    new TextEncoder().encode("contents"),
                );
            });
        });

        describe("setFileId", function () {
            it("should accept an instance or a string", function () {
                expect(
                    new FileAppendTransaction()
                        .setFileId(fileId)
                        .fileId.toString(),
                ).to.equal(fileId.toString());
                expect(
                    new FileAppendTransaction()
                        .setFileId("0.0.5005")
                        .fileId.toString(),
                ).to.equal("0.0.5005");
            });

            it("should store a copy of the instance", function () {
                const transaction = new FileAppendTransaction().setFileId(
                    fileId,
                );

                expect(transaction.fileId).to.not.equal(fileId);
            });

            it("should throw once frozen", function () {
                const transaction = freezeWithIds(new FileAppendTransaction());

                expect(() => transaction.setFileId(fileId)).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("setContents", function () {
            it("should accept bytes or a string", function () {
                expect(
                    new FileAppendTransaction().setContents(contents).contents,
                ).to.equal(contents);
                expect(
                    new FileAppendTransaction().setContents("ℏbar").contents,
                ).to.deep.equal(new TextEncoder().encode("ℏbar"));
            });

            it("should throw once frozen", function () {
                const transaction = freezeWithIds(new FileAppendTransaction());

                expect(() => transaction.setContents(contents)).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("setMaxChunks", function () {
            it("should set the value and be chainable", function () {
                const transaction = new FileAppendTransaction();

                expect(transaction.setMaxChunks(5)).to.equal(transaction);
                expect(transaction.maxChunks).to.equal(5);
            });

            it("should throw for 0", function () {
                expect(() =>
                    new FileAppendTransaction().setMaxChunks(0),
                ).to.throw("Max chunks must be greater than 0");
            });

            it("should throw once frozen", function () {
                const transaction = freezeWithIds(new FileAppendTransaction());

                expect(() => transaction.setMaxChunks(5)).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("setChunkSize", function () {
            it("should set the value and be chainable", function () {
                const transaction = new FileAppendTransaction();

                expect(transaction.setChunkSize(10)).to.equal(transaction);
                expect(transaction.chunkSize).to.equal(10);
            });

            // TODO(#4754): setChunkSize() doesn't check that the transaction isn't frozen.
            it.skip("should throw once frozen", function () {
                const transaction = freezeWithIds(new FileAppendTransaction());

                expect(() => transaction.setChunkSize(10)).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("chunkInterval", function () {
            it("should return the value set with setChunkInterval()", function () {
                const transaction = new FileAppendTransaction();

                expect(transaction.setChunkInterval(100)).to.equal(transaction);
                expect(transaction.chunkInterval).to.equal(100);
            });

            it("should space the chunk transaction IDs by the interval", function () {
                const transaction = freezeWithIds(
                    new FileAppendTransaction()
                        .setFileId(fileId)
                        .setContents(contents)
                        .setChunkSize(10)
                        .setChunkInterval(100),
                );

                expect(
                    transaction._transactionIds.list.map((id) =>
                        id.validStart.toString(),
                    ),
                ).to.deep.equal([
                    "1596210382.000000000",
                    "1596210382.000000100",
                    "1596210382.000000200",
                ]);
            });

            // TODO(#4753): freeze() doesn't carry the nanoseconds into the seconds.
            it.skip("should carry the chunk transaction IDs into the next second", function () {
                const transaction = new FileAppendTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(
                        TransactionId.withValidStart(
                            new AccountId(0, 0, 1001),
                            new Timestamp(1596210382, 999999995),
                        ),
                    )
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(10)
                    .freeze();

                expect(
                    transaction._transactionIds.list.map((id) =>
                        id.validStart.toString(),
                    ),
                ).to.deep.equal([
                    "1596210382.999999995",
                    "1596210383.000000005",
                    "1596210383.000000015",
                ]);
            });

            // TODO(#4753): fromBytes() computes the interval from the nanoseconds only.
            it.skip("should be kept by fromBytes() when the chunk transaction IDs cross a second", function () {
                const transaction = new FileAppendTransaction()
                    .setTransactionId(
                        TransactionId.withValidStart(
                            new AccountId(0, 0, 1001),
                            new Timestamp(1596210382, 999999995),
                        ),
                    )
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(10)
                    .setChunkInterval(10);

                const decoded = Transaction.fromBytes(transaction.toBytes());

                expect(decoded.chunkInterval).to.equal(10);
            });

            // TODO(#4754): setChunkInterval() doesn't check that the transaction isn't frozen.
            it.skip("setChunkInterval() should throw once frozen", function () {
                const transaction = freezeWithIds(new FileAppendTransaction());

                expect(() => transaction.setChunkInterval(100)).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("getRequiredChunks", function () {
            it("should return 1 without contents", function () {
                expect(
                    new FileAppendTransaction().getRequiredChunks(),
                ).to.equal(1);
            });

            it("should round the number of chunks up", function () {
                expect(
                    new FileAppendTransaction()
                        .setContents(contents)
                        .setChunkSize(10)
                        .getRequiredChunks(),
                ).to.equal(3);
            });
        });

        describe("schedule", function () {
            it("should return a ScheduleCreateTransaction for contents that fit in one chunk", function () {
                const scheduled = new FileAppendTransaction()
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(25)
                    .schedule();

                expect(scheduled).to.be.instanceOf(ScheduleCreateTransaction);
            });

            it("should throw for contents larger than one chunk", function () {
                expect(() =>
                    new FileAppendTransaction()
                        .setFileId(fileId)
                        .setContents(contents)
                        .setChunkSize(10)
                        .schedule(),
                ).to.throw(
                    "cannot schedule `FileAppendTransaction` with message over 10 bytes",
                );
            });

            it("should throw once frozen", function () {
                const transaction = freezeWithIds(new FileAppendTransaction());

                expect(() => transaction.schedule()).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("toBytes() before freeze()", function () {
            it("should build one transaction per chunk, spaced by the interval", function () {
                const transaction = new FileAppendTransaction()
                    .setTransactionId(transactionId)
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(10)
                    .setChunkInterval(100);

                const decoded = Transaction.fromBytes(transaction.toBytes());

                expect(decoded).to.be.instanceOf(FileAppendTransaction);
                expect(
                    decoded._transactionIds.list.map((id) =>
                        id.validStart.toString(),
                    ),
                ).to.deep.equal([
                    "1596210382.000000000",
                    "1596210382.000000100",
                    "1596210382.000000200",
                ]);
                expect(decoded.contents).to.deep.equal(contents);
                expect(decoded.chunkInterval).to.equal(100);
            });

            it("should throw for more chunks than maxChunks", function () {
                const transaction = new FileAppendTransaction()
                    .setTransactionId(transactionId)
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(10)
                    .setMaxChunks(2);

                expect(() => transaction.toBytes()).to.throw(
                    "cannot build `FileAppendTransaction` with more than 2 chunks",
                );
            });
        });

        describe("execute() and executeAll()", function () {
            let client;

            beforeEach(function () {
                client = Client.forNetwork(
                    { "127.0.0.1:50211": "0.0.3" },
                    { scheduleNetworkUpdate: false },
                );
            });

            afterEach(function () {
                client.close();
                vi.restoreAllMocks();
            });

            /**
             * Replaces the network call of each chunk with a response whose
             * getReceipt() resolves.
             *
             * @returns {{ execute: import("vitest").MockInstance, responses: object[] }}
             */
            function stubChunkExecution() {
                const responses = [];
                const execute = vi
                    .spyOn(Transaction.prototype, "execute")
                    .mockImplementation(() => {
                        const response = {
                            getReceipt: vi.fn().mockResolvedValue({}),
                        };
                        responses.push(response);
                        return Promise.resolve(response);
                    });

                return { execute, responses };
            }

            it("executeAll() executes each chunk and waits for its receipt", async function () {
                const { execute, responses } = stubChunkExecution();
                const transaction = new FileAppendTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(10);

                const result = await transaction.executeAll(client);

                expect(execute).toHaveBeenCalledTimes(3);
                expect(result).to.deep.equal(responses);
                for (const response of responses) {
                    expect(response.getReceipt).toHaveBeenCalledWith(client);
                }
            });

            it("execute() returns the response of the first chunk", async function () {
                const { responses } = stubChunkExecution();
                const transaction = new FileAppendTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(10);

                expect(await transaction.execute(client)).to.equal(
                    responses[0],
                );
                expect(responses).to.have.length(3);
            });

            it("executeAll() throws for more chunks than maxChunks", async function () {
                const { execute } = stubChunkExecution();
                const transaction = new FileAppendTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .setFileId(fileId)
                    .setContents(contents)
                    .setChunkSize(10)
                    .setMaxChunks(2);

                await expect(transaction.executeAll(client)).rejects.toThrow(
                    "cannot execute `FileAppendTransaction` with more than 2 chunks",
                );
                expect(execute).not.toHaveBeenCalled();
            });
        });

        describe("_validateChecksums", function () {
            let mainnet, testnet;

            beforeEach(function () {
                mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
                testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
            });

            afterEach(function () {
                mainnet.close();
                testnet.close();
            });

            it("should check the file ID checksum against the client's network", function () {
                // 0.0.123-vfmkw has the mainnet checksum
                const transaction = new FileAppendTransaction().setFileId(
                    FileId.fromString("0.0.123-vfmkw"),
                );

                expect(() =>
                    transaction._validateChecksums(mainnet),
                ).to.not.throw();
                expect(() => transaction._validateChecksums(testnet)).to.throw(
                    BadEntityIdError,
                );
            });

            it("should skip unset fields", function () {
                expect(() =>
                    new FileAppendTransaction()._validateChecksums(testnet),
                ).to.not.throw();
            });
        });

        describe("_execute", function () {
            it("should call file.appendContent() with the request", async function () {
                const request = {};
                const response = {};
                const calls = [];
                const channel = {
                    file: {
                        appendContent: (arg) => {
                            calls.push(arg);
                            return Promise.resolve(response);
                        },
                    },
                };

                expect(
                    await new FileAppendTransaction()._execute(
                        channel,
                        request,
                    ),
                ).to.equal(response);
                expect(calls).to.deep.equal([request]);
                expect(calls[0]).to.equal(request);
            });
        });

        describe("_getTransactionDataCase", function () {
            it("should return fileAppend", function () {
                expect(
                    new FileAppendTransaction()._getTransactionDataCase(),
                ).to.equal("fileAppend");
            });
        });

        describe("_getLogId", function () {
            it("should include the class name and valid start", function () {
                const transaction = freezeWithIds(new FileAppendTransaction());

                expect(transaction._getLogId()).to.equal(
                    `FileAppendTransaction:${VALID_START.toString()}`,
                );
            });
        });
    });
});
