import { vi } from "vitest";
import {
    AccountId,
    Client,
    Hbar,
    Query,
    TokenId,
    TokenInfo,
    TokenInfoQuery,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Executable from "../../src/Executable.js";
import Long from "long";

describe("TokenInfoQuery", function () {
    let tokenId;
    let nodeId;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 123);
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @returns {object} a minimal token info protobuf
     */
    function tokenInfoProtobuf() {
        return {
            tokenId: tokenId._toProtobuf(),
            name: "name",
            symbol: "symbol",
            decimals: 2,
            totalSupply: Long.fromNumber(1000),
            deleted: false,
            defaultFreezeStatus: 0,
            defaultKycStatus: 0,
            pauseStatus: 0,
            customFees: [],
        };
    }

    describe("constructor", function () {
        it("should default tokenId to null", function () {
            expect(new TokenInfoQuery().tokenId).to.be.null;
        });

        it("should set the tokenId given in props", function () {
            const query = new TokenInfoQuery({ tokenId });

            expect(query.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should accept a string in props", function () {
            const query = new TokenInfoQuery({ tokenId: "0.0.123" });

            expect(query.tokenId.toString()).to.equal("0.0.123");
        });
    });

    describe("setTokenId", function () {
        it("should accept an instance", function () {
            const query = new TokenInfoQuery().setTokenId(tokenId);

            expect(query.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should accept a string", function () {
            const query = new TokenInfoQuery().setTokenId("0.0.123");

            expect(query.tokenId.toString()).to.equal("0.0.123");
        });

        it("should store a copy of the instance", function () {
            const query = new TokenInfoQuery().setTokenId(tokenId);

            expect(query.tokenId).to.not.equal(tokenId);
        });

        it("should be chainable", function () {
            const query = new TokenInfoQuery();

            expect(query.setTokenId(tokenId)).to.equal(query);
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode the tokenId", function () {
            const query = TokenInfoQuery._fromProtobuf({
                tokenGetInfo: { token: tokenId._toProtobuf() },
            });

            expect(query).to.be.instanceOf(TokenInfoQuery);
            expect(query.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should leave a missing tokenId null", function () {
            const query = TokenInfoQuery._fromProtobuf({
                tokenGetInfo: {},
            });

            expect(query.tokenId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the tokenId", function () {
            const query = new TokenInfoQuery().setTokenId(tokenId);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(TokenInfoQuery);
            expect(decoded.tokenId.toString()).to.equal(tokenId.toString());
        });
    });

    describe("getCost", function () {
        it("should return the cost from the cost query", async function () {
            const query = new TokenInfoQuery().setTokenId(tokenId);
            query.setNodeAccountIds([nodeId]);

            const execute = vi
                .spyOn(Executable.prototype, "execute")
                .mockResolvedValue(Hbar.fromTinybars(100));

            try {
                const cost = await query.getCost({});

                expect(execute).toHaveBeenCalledTimes(1);
                expect(cost.toTinybars().toInt()).to.equal(110);
            } finally {
                execute.mockRestore();
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

        it("should check the token ID checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const query = new TokenInfoQuery().setTokenId(
                TokenId.fromString("0.0.123-vfmkw"),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip an unset tokenId", function () {
            expect(() =>
                new TokenInfoQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.getTokenInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    getTokenInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenInfoQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the tokenGetInfo header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new TokenInfoQuery()._mapResponseHeader({
                    tokenGetInfo: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the token info", async function () {
            const query = new TokenInfoQuery().setTokenId(tokenId);

            const result = await query._mapResponse(
                { tokenGetInfo: { tokenInfo: tokenInfoProtobuf() } },
                nodeId,
                {},
            );

            expect(result).to.be.instanceOf(TokenInfo);
            expect(result.tokenId.toString()).to.equal(tokenId.toString());
            expect(result.name).to.equal("name");
            expect(result.symbol).to.equal("symbol");
            expect(result.decimals).to.equal(2);
            expect(result.totalSupply.toNumber()).to.equal(1000);
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header and tokenId", function () {
            const header = { payment: {} };
            const query = new TokenInfoQuery().setTokenId(tokenId);

            expect(query._onMakeRequest(header)).to.deep.equal({
                tokenGetInfo: {
                    header,
                    token: tokenId._toProtobuf(),
                },
            });
        });

        it("should encode a missing tokenId as null", function () {
            const header = { payment: {} };

            expect(new TokenInfoQuery()._onMakeRequest(header)).to.deep.equal({
                tokenGetInfo: {
                    header,
                    token: null,
                },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            expect(new TokenInfoQuery()._getLogId()).to.match(
                /^TokenInfoQuery:\d+$/,
            );
        });

        it("should use the payment transaction valid start", function () {
            const query = new TokenInfoQuery();
            const validStart = { toString: () => "123.456" };
            query._paymentTransactionId = { validStart };

            expect(query._getLogId()).to.equal("TokenInfoQuery:123.456");
        });
    });
});
