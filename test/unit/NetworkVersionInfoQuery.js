import {
    AccountId,
    NetworkVersionInfo,
    NetworkVersionInfoQuery,
    Query,
} from "../../src/index.js";

describe("NetworkVersionInfoQuery", function () {
    let nodeId;

    beforeEach(function () {
        nodeId = new AccountId(0, 0, 3);
    });

    describe("_fromProtobuf", function () {
        it("should return a NetworkVersionInfoQuery", function () {
            const query = NetworkVersionInfoQuery._fromProtobuf({
                networkGetVersionInfo: {},
            });

            expect(query).to.be.instanceOf(NetworkVersionInfoQuery);
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should decode to a NetworkVersionInfoQuery", function () {
            const decoded = Query.fromBytes(
                new NetworkVersionInfoQuery().toBytes(),
            );

            expect(decoded).to.be.instanceOf(NetworkVersionInfoQuery);
        });
    });

    describe("_execute", function () {
        it("should call network.getVersionInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                network: {
                    getVersionInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new NetworkVersionInfoQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the networkGetVersionInfo header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new NetworkVersionInfoQuery()._mapResponseHeader({
                    networkGetVersionInfo: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the protobuf and services versions", async function () {
            const result = await new NetworkVersionInfoQuery()._mapResponse(
                {
                    networkGetVersionInfo: {
                        hapiProtoVersion: { major: 0, minor: 68, patch: 1 },
                        hederaServicesVersion: {
                            major: 0,
                            minor: 69,
                            patch: 2,
                        },
                    },
                },
                nodeId,
                {},
            );

            expect(result).to.be.instanceOf(NetworkVersionInfo);
            expect(result.protobufVersion.major).to.equal(0);
            expect(result.protobufVersion.minor).to.equal(68);
            expect(result.protobufVersion.patch).to.equal(1);
            expect(result.servicesVersion.major).to.equal(0);
            expect(result.servicesVersion.minor).to.equal(69);
            expect(result.servicesVersion.patch).to.equal(2);
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header", function () {
            const header = { payment: {} };

            expect(
                new NetworkVersionInfoQuery()._onMakeRequest(header),
            ).to.deep.equal({
                networkGetVersionInfo: { header },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            expect(new NetworkVersionInfoQuery()._getLogId()).to.match(
                /^NetworkVersionInfoQuery:\d+$/,
            );
        });

        it("should use the payment transaction valid start", function () {
            const query = new NetworkVersionInfoQuery();
            const validStart = { toString: () => "123.456" };
            query._paymentTransactionId = { validStart };

            expect(query._getLogId()).to.equal(
                "NetworkVersionInfoQuery:123.456",
            );
        });
    });
});
