import { vi } from "vitest";
import Long from "long";
import {
    AccountId,
    Client,
    Hbar,
    LedgerId,
    PrivateKey,
    Query,
    Timestamp,
    TopicId,
    TopicInfo,
    TopicInfoQuery,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("TopicInfoQuery", function () {
    let topicId;
    let nodeId;

    beforeEach(function () {
        topicId = new TopicId(0, 0, 7007);
        nodeId = new AccountId(0, 0, 3);
    });

    describe("constructor", function () {
        it("should default topicId to null", function () {
            expect(new TopicInfoQuery().topicId).to.be.null;
        });

        it("should set the topicId given in props", function () {
            const query = new TopicInfoQuery({ topicId });

            expect(query.topicId.toString()).to.equal(topicId.toString());
        });

        it("should accept a string in props", function () {
            const query = new TopicInfoQuery({ topicId: "0.0.7007" });

            expect(query.topicId.toString()).to.equal("0.0.7007");
        });
    });

    describe("setTopicId", function () {
        it("should accept an instance", function () {
            const query = new TopicInfoQuery().setTopicId(topicId);

            expect(query.topicId.toString()).to.equal(topicId.toString());
        });

        it("should accept a string", function () {
            const query = new TopicInfoQuery().setTopicId("0.0.7007");

            expect(query.topicId.toString()).to.equal("0.0.7007");
        });

        it("should store a copy of the instance", function () {
            const query = new TopicInfoQuery().setTopicId(topicId);

            expect(query.topicId).to.not.equal(topicId);
        });

        it("should be chainable", function () {
            const query = new TopicInfoQuery();

            expect(query.setTopicId(topicId)).to.equal(query);
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode the topicId", function () {
            const query = TopicInfoQuery._fromProtobuf({
                consensusGetTopicInfo: { topicID: topicId._toProtobuf() },
            });

            expect(query).to.be.instanceOf(TopicInfoQuery);
            expect(query.topicId.toString()).to.equal(topicId.toString());
        });

        it("should leave a missing topicId null", function () {
            const query = TopicInfoQuery._fromProtobuf({
                consensusGetTopicInfo: {},
            });

            expect(query.topicId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the topicId", function () {
            const query = new TopicInfoQuery().setTopicId(topicId);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(TopicInfoQuery);
            expect(decoded.topicId.toString()).to.equal(topicId.toString());
        });
    });

    describe("getCost", function () {
        it("should return the cost from Query.getCost()", async function () {
            const query = new TopicInfoQuery().setTopicId(topicId);
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

        it("should check the topic ID checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const query = new TopicInfoQuery().setTopicId(
                TopicId.fromString("0.0.123-vfmkw"),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip an unset topicId", function () {
            expect(() =>
                new TopicInfoQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call consensus.getTopicInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                consensus: {
                    getTopicInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TopicInfoQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the consensusGetTopicInfo header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new TopicInfoQuery()._mapResponseHeader({
                    consensusGetTopicInfo: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the topic info", async function () {
            const adminKey = PrivateKey.generateED25519().publicKey;
            const runningHash = new TextEncoder().encode("running hash");
            const query = new TopicInfoQuery().setTopicId(topicId);

            const result = await query._mapResponse(
                {
                    consensusGetTopicInfo: {
                        topicID: topicId._toProtobuf(),
                        topicInfo: {
                            memo: "memo",
                            runningHash,
                            sequenceNumber: Long.fromNumber(42),
                            expirationTime: new Timestamp(
                                1596300000,
                                0,
                            )._toProtobuf(),
                            adminKey: adminKey._toProtobufKey(),
                            autoRenewPeriod: {
                                seconds: Long.fromNumber(7776000),
                            },
                            autoRenewAccount: new AccountId(
                                0,
                                0,
                                5006,
                            )._toProtobuf(),
                            ledgerId: LedgerId.TESTNET.toBytes(),
                        },
                    },
                },
                nodeId,
                {},
            );

            expect(result).to.be.instanceOf(TopicInfo);
            expect(result.topicId.toString()).to.equal(topicId.toString());
            expect(result.topicMemo).to.equal("memo");
            expect(result.runningHash).to.deep.equal(runningHash);
            expect(result.sequenceNumber.toNumber()).to.equal(42);
            expect(result.expirationTime.seconds.toNumber()).to.equal(
                1596300000,
            );
            expect(result.adminKey.toString()).to.equal(adminKey.toString());
            expect(result.submitKey).to.be.null;
            expect(result.autoRenewPeriod.seconds.toNumber()).to.equal(7776000);
            expect(result.autoRenewAccountId.toString()).to.equal("0.0.5006");
            expect(result.ledgerId.isTestnet()).to.be.true;
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header and topicId", function () {
            const header = { payment: {} };
            const query = new TopicInfoQuery().setTopicId(topicId);

            expect(query._onMakeRequest(header)).to.deep.equal({
                consensusGetTopicInfo: {
                    header,
                    topicID: topicId._toProtobuf(),
                },
            });
        });

        it("should encode a missing topicId as null", function () {
            const header = { payment: {} };

            expect(new TopicInfoQuery()._onMakeRequest(header)).to.deep.equal({
                consensusGetTopicInfo: {
                    header,
                    topicID: null,
                },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            expect(new TopicInfoQuery()._getLogId()).to.match(
                /^TopicInfoQuery:\d+$/,
            );
        });

        it("should use the payment transaction valid start", function () {
            const query = new TopicInfoQuery();
            const validStart = { toString: () => "123.456" };
            query._paymentTransactionId = { validStart };

            expect(query._getLogId()).to.equal("TopicInfoQuery:123.456");
        });
    });
});
