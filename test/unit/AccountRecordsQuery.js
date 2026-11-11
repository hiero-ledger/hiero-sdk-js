import {
    AccountRecordsQuery,
    AccountId,
    Client,
    Query,
    Timestamp,
    TransactionId,
    TransactionRecord,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("AccountRecordsQuery", function () {
    describe("constructor and setters", function () {
        it("accountId defaults to null", function () {
            const query = new AccountRecordsQuery();

            expect(query.accountId).to.be.null;
        });

        it("should set accountId from props", function () {
            const query = new AccountRecordsQuery({
                accountId: new AccountId(0, 0, 123),
            });

            expect(query.accountId.toString()).to.equal("0.0.123");
        });

        it("should set accountId from a string", function () {
            const query = new AccountRecordsQuery().setAccountId("0.0.123");

            expect(query.accountId.toString()).to.equal("0.0.123");
        });

        it("should store a copy of the account ID instance", function () {
            const accountId = new AccountId(0, 0, 123);
            const query = new AccountRecordsQuery().setAccountId(accountId);

            expect(query.accountId.toString()).to.equal(accountId.toString());
            expect(query.accountId).to.not.equal(accountId);
        });

        it("should be chainable", function () {
            const query = new AccountRecordsQuery();

            expect(query.setAccountId(new AccountId(0, 0, 123))).to.equal(
                query,
            );
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the account ID through a round trip", function () {
            const query = new AccountRecordsQuery().setAccountId(
                new AccountId(0, 0, 123),
            );

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(AccountRecordsQuery);
            expect(decoded.accountId.toString()).to.equal("0.0.123");
        });

        it("should deserialize without an account ID", function () {
            const decoded = Query.fromBytes(
                new AccountRecordsQuery().toBytes(),
            );

            expect(decoded).to.be.instanceOf(AccountRecordsQuery);
            expect(decoded.accountId).to.be.null;
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

        /**
         * @returns {AccountId}
         */
        function checksummedAccountId() {
            // 0.0.123-vfmkw has the mainnet checksum
            const accountId = new AccountId(0, 0, 123);
            accountId._checksum = "vfmkw";
            return accountId;
        }

        it("should check the account ID checksum against the client's network", function () {
            const query = new AccountRecordsQuery().setAccountId(
                checksummedAccountId(),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip when the account ID is unset", function () {
            expect(() =>
                new AccountRecordsQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call crypto.getAccountRecords() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                crypto: {
                    getAccountRecords: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new AccountRecordsQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the cryptoGetAccountRecords header", function () {
            const header = {};
            const response = { cryptoGetAccountRecords: { header } };

            expect(
                new AccountRecordsQuery()._mapResponseHeader(response),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should map the records into TransactionRecords", async function () {
            const accountId = new AccountId(0, 0, 123);
            const response = {
                cryptoGetAccountRecords: {
                    records: [
                        {
                            receipt: {
                                status: 22, // Status.Success
                            },
                            transactionID: new TransactionId(
                                accountId,
                                new Timestamp(1596210382, 0),
                            )._toProtobuf(),
                            transactionHash: new Uint8Array([1, 2, 3]),
                            consensusTimestamp: new Timestamp(
                                1596210383,
                                0,
                            )._toProtobuf(),
                            memo: "record memo",
                        },
                    ],
                },
            };

            const records = await new AccountRecordsQuery()._mapResponse(
                response,
                new AccountId(0, 0, 3),
                {},
            );

            expect(records).to.have.lengthOf(1);
            expect(records[0]).to.be.instanceOf(TransactionRecord);
            expect(records[0].transactionId.toString()).to.equal(
                new TransactionId(
                    accountId,
                    new Timestamp(1596210382, 0),
                ).toString(),
            );
        });

        it("should return an empty list when there are no records", async function () {
            const response = { cryptoGetAccountRecords: { records: [] } };

            const records = await new AccountRecordsQuery()._mapResponse(
                response,
                new AccountId(0, 0, 3),
                {},
            );

            expect(records).to.deep.equal([]);
        });
    });

    describe("_getLogId", function () {
        it("should use the payment transaction ID valid start when set", function () {
            const VALID_START = new Timestamp(1596210382, 0);
            const query = new AccountRecordsQuery().setPaymentTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    VALID_START,
                ),
            );

            expect(query._getLogId()).to.equal(
                `AccountRecordsQuery:${VALID_START.toString()}`,
            );
        });
    });
});
