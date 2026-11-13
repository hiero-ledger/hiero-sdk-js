import { vi } from "vitest";
import {
    AccountId,
    Client,
    Hbar,
    PrivateKey,
    Query,
    ScheduleId,
    ScheduleInfo,
    ScheduleInfoQuery,
    Timestamp,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("ScheduleInfoQuery", function () {
    let scheduleId;
    let nodeId;

    beforeEach(function () {
        scheduleId = new ScheduleId(0, 0, 6006);
        nodeId = new AccountId(0, 0, 3);
    });

    describe("constructor", function () {
        it("should default scheduleId to null", function () {
            expect(new ScheduleInfoQuery().scheduleId).to.be.null;
        });

        it("should set the scheduleId given in props", function () {
            const query = new ScheduleInfoQuery({ scheduleId });

            expect(query.scheduleId.toString()).to.equal(scheduleId.toString());
        });

        it("should accept a string in props", function () {
            const query = new ScheduleInfoQuery({ scheduleId: "0.0.6006" });

            expect(query.scheduleId.toString()).to.equal("0.0.6006");
        });
    });

    describe("setScheduleId", function () {
        it("should accept an instance", function () {
            const query = new ScheduleInfoQuery().setScheduleId(scheduleId);

            expect(query.scheduleId.toString()).to.equal(scheduleId.toString());
        });

        it("should accept a string", function () {
            const query = new ScheduleInfoQuery().setScheduleId("0.0.6006");

            expect(query.scheduleId.toString()).to.equal("0.0.6006");
        });

        it("should store a copy of the instance", function () {
            const query = new ScheduleInfoQuery().setScheduleId(scheduleId);

            expect(query.scheduleId).to.not.equal(scheduleId);
        });

        it("should be chainable", function () {
            const query = new ScheduleInfoQuery();

            expect(query.setScheduleId(scheduleId)).to.equal(query);
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode the scheduleId", function () {
            const query = ScheduleInfoQuery._fromProtobuf({
                scheduleGetInfo: { scheduleID: scheduleId._toProtobuf() },
            });

            expect(query).to.be.instanceOf(ScheduleInfoQuery);
            expect(query.scheduleId.toString()).to.equal(scheduleId.toString());
        });

        it("should leave a missing scheduleId null", function () {
            const query = ScheduleInfoQuery._fromProtobuf({
                scheduleGetInfo: {},
            });

            expect(query.scheduleId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the scheduleId", function () {
            const query = new ScheduleInfoQuery().setScheduleId(scheduleId);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(ScheduleInfoQuery);
            expect(decoded.scheduleId.toString()).to.equal(
                scheduleId.toString(),
            );
        });
    });

    describe("getCost", function () {
        it("should return the cost from Query.getCost()", async function () {
            const query = new ScheduleInfoQuery().setScheduleId(scheduleId);
            const client = {};
            const getCost = vi
                .spyOn(Query.prototype, "getCost")
                .mockResolvedValue(Hbar.fromTinybars(100));

            try {
                const cost = await query.getCost(client);

                expect(getCost).toHaveBeenCalledTimes(1);
                expect(getCost).toHaveBeenCalledWith(client);
                expect(cost.toTinybars().toInt()).to.equal(100);
            } finally {
                getCost.mockRestore();
            }
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

        it("should check the schedule ID checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const query = new ScheduleInfoQuery().setScheduleId(
                ScheduleId.fromString("0.0.123-vfmkw"),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip an unset scheduleId", function () {
            expect(() =>
                new ScheduleInfoQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call schedule.getScheduleInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                schedule: {
                    getScheduleInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new ScheduleInfoQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the scheduleGetInfo header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new ScheduleInfoQuery()._mapResponseHeader({
                    scheduleGetInfo: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the schedule info", async function () {
            const adminKey = PrivateKey.generateED25519().publicKey;
            const creator = new AccountId(0, 0, 1001);
            const payer = new AccountId(0, 0, 1002);
            const scheduledTransactionId = TransactionId.withValidStart(
                creator,
                new Timestamp(1596210382, 0),
            );
            const query = new ScheduleInfoQuery().setScheduleId(scheduleId);

            const result = await query._mapResponse(
                {
                    scheduleGetInfo: {
                        scheduleInfo: {
                            scheduleID: scheduleId._toProtobuf(),
                            creatorAccountID: creator._toProtobuf(),
                            payerAccountID: payer._toProtobuf(),
                            adminKey: adminKey._toProtobufKey(),
                            signers: { keys: [adminKey._toProtobufKey()] },
                            memo: "memo",
                            expirationTime: new Timestamp(
                                1596300000,
                                0,
                            )._toProtobuf(),
                            executionTime: new Timestamp(
                                1596210400,
                                0,
                            )._toProtobuf(),
                            scheduledTransactionID:
                                scheduledTransactionId._toProtobuf(),
                            waitForExpiry: true,
                        },
                    },
                },
                nodeId,
                {},
            );

            expect(result).to.be.instanceOf(ScheduleInfo);
            expect(result.scheduleId.toString()).to.equal(
                scheduleId.toString(),
            );
            expect(result.creatorAccountId.toString()).to.equal("0.0.1001");
            expect(result.payerAccountId.toString()).to.equal("0.0.1002");
            expect(result.adminKey.toString()).to.equal(adminKey.toString());
            expect(result.signers.toArray().map(String)).to.deep.equal([
                adminKey.toString(),
            ]);
            expect(result.scheduleMemo).to.equal("memo");
            expect(result.expirationTime.seconds.toNumber()).to.equal(
                1596300000,
            );
            expect(result.executed.seconds.toNumber()).to.equal(1596210400);
            expect(result.deleted).to.be.null;
            expect(result.scheduledTransactionId.toString()).to.equal(
                scheduledTransactionId.toString(),
            );
            expect(result.waitForExpiry).to.be.true;
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header and scheduleId", function () {
            const header = { payment: {} };
            const query = new ScheduleInfoQuery().setScheduleId(scheduleId);

            expect(query._onMakeRequest(header)).to.deep.equal({
                scheduleGetInfo: {
                    header,
                    scheduleID: scheduleId._toProtobuf(),
                },
            });
        });

        it("should encode a missing scheduleId as null", function () {
            const header = { payment: {} };

            expect(
                new ScheduleInfoQuery()._onMakeRequest(header),
            ).to.deep.equal({
                scheduleGetInfo: {
                    header,
                    scheduleID: null,
                },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            expect(new ScheduleInfoQuery()._getLogId()).to.match(
                /^ScheduleInfoQuery:\d+$/,
            );
        });

        it("should use the payment transaction valid start", function () {
            const query = new ScheduleInfoQuery();
            const validStart = { toString: () => "123.456" };
            query._paymentTransactionId = { validStart };

            expect(query._getLogId()).to.equal("ScheduleInfoQuery:123.456");
        });
    });
});
