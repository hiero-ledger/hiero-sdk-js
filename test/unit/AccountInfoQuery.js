import { vi } from "vitest";
import {
    AccountId,
    AccountInfo,
    AccountInfoQuery,
    Client,
    Hbar,
    PrivateKey,
    Query,
    Timestamp,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";

describe("AccountInfoQuery", function () {
    describe("constructor and setters", function () {
        it("accountId defaults to null", function () {
            const query = new AccountInfoQuery();

            expect(query.accountId).to.be.null;
        });

        it("should set accountId from props", function () {
            const query = new AccountInfoQuery({
                accountId: new AccountId(0, 0, 123),
            });

            expect(query.accountId.toString()).to.equal("0.0.123");
        });

        it("should set accountId from a string", function () {
            const query = new AccountInfoQuery().setAccountId("0.0.123");

            expect(query.accountId.toString()).to.equal("0.0.123");
        });

        it("should store a copy of the account ID instance", function () {
            const accountId = new AccountId(0, 0, 123);
            const query = new AccountInfoQuery().setAccountId(accountId);

            expect(query.accountId.toString()).to.equal(accountId.toString());
            expect(query.accountId).to.not.equal(accountId);
        });

        it("should be chainable", function () {
            const query = new AccountInfoQuery();

            expect(query.setAccountId(new AccountId(0, 0, 123))).to.equal(
                query,
            );
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("[to|from]Bytes()", function () {
            const accountId = new AccountId(10);

            const query = Query.fromBytes(
                new AccountInfoQuery().setAccountId(accountId).toBytes(),
            );

            expect(query instanceof AccountInfoQuery).to.be.true;
            expect(query.accountId.toString()).to.be.equal(
                accountId.toString(),
            );
        });

        it("should deserialize without an account ID", function () {
            const query = Query.fromBytes(new AccountInfoQuery().toBytes());

            expect(query).to.be.instanceOf(AccountInfoQuery);
            expect(query.accountId).to.be.null;
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
            const accountId = new AccountId(0, 0, 123);
            accountId._checksum = "vfmkw";
            return accountId;
        }

        it("should check the account ID checksum against the client's network", function () {
            const query = new AccountInfoQuery().setAccountId(
                checksummedAccountId(),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip when the account ID is unset", function () {
            expect(() =>
                new AccountInfoQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call crypto.getAccountInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                crypto: {
                    getAccountInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new AccountInfoQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
        });
    });

    describe("getCost", function () {
        afterEach(function () {
            vi.restoreAllMocks();
        });

        it("should return the cost reported by the base query", async function () {
            const cost = new Hbar(1);
            const client = {};
            const getCost = vi
                .spyOn(Query.prototype, "getCost")
                .mockResolvedValue(cost);

            expect(await new AccountInfoQuery().getCost(client)).to.equal(cost);
            expect(getCost).toHaveBeenCalledTimes(1);
            expect(getCost.mock.calls[0][0]).to.equal(client);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the cryptoGetInfo header", function () {
            const header = {};
            const response = { cryptoGetInfo: { header } };

            expect(
                new AccountInfoQuery()._mapResponseHeader(response),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should map the protobuf response into an AccountInfo", async function () {
            const key = PrivateKey.generateED25519().publicKey;
            const response = {
                cryptoGetInfo: {
                    header: {},
                    accountInfo: {
                        accountID: new AccountId(0, 0, 123)._toProtobuf(),
                        key: { ed25519: key.toBytesRaw() },
                        expirationTime: {
                            seconds: Long.fromNumber(10),
                            nanos: 9,
                        },
                        alias: null,
                        balance: Long.fromNumber(100),
                        memo: "account memo",
                    },
                },
            };

            const info = await new AccountInfoQuery()._mapResponse(response);

            expect(info).to.be.instanceOf(AccountInfo);
            expect(info.accountId.toString()).to.equal("0.0.123");
            expect(info.key.toString()).to.equal(key.toString());
            expect(info.accountMemo).to.equal("account memo");
            expect(info.balance.toTinybars().toNumber()).to.equal(100);
        });
    });

    describe("_getLogId", function () {
        it("should use the payment transaction ID valid start when set", function () {
            const VALID_START = new Timestamp(1596210382, 0);
            const query = new AccountInfoQuery().setPaymentTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    VALID_START,
                ),
            );

            expect(query._getLogId()).to.equal(
                `AccountInfoQuery:${VALID_START.toString()}`,
            );
        });

        it("should fall back to the timestamp of the query", function () {
            const query = new AccountInfoQuery();

            expect(query._getLogId()).to.equal(
                `AccountInfoQuery:${query._timestamp}`,
            );
        });
    });
});
