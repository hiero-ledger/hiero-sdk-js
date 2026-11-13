import { vi } from "vitest";
import {
    AccountId,
    Hbar,
    NftId,
    Timestamp,
    TokenId,
    TokenNftInfo,
    TokenNftInfoQuery,
} from "../../src/index.js";
import Executable from "../../src/Executable.js";
import Long from "long";

describe("TokenNftInfoQuery", function () {
    describe("_fromProtobuf", function () {
        it("should create from tokenGetNftInfo protobuf", function () {
            const nftId = {
                token_ID: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    tokenNum: Long.fromNumber(1),
                },
                serialNumber: Long.fromNumber(2),
            };

            const query = {
                tokenGetNftInfo: {
                    nftID: nftId,
                },
            };

            const tokenNftInfoQuery = TokenNftInfoQuery._fromProtobuf(query);

            expect(tokenNftInfoQuery).to.be.instanceOf(TokenNftInfoQuery);
            expect(tokenNftInfoQuery.nftId.tokenId.toString()).to.equal(
                "0.0.1",
            );
            expect(tokenNftInfoQuery.nftId.serial.toNumber()).to.equal(2);
        });

        it("should create from tokenGetAccountNftInfos protobuf", function () {
            const accountId = { shardNum: 0, realmNum: 0, accountNum: 3 };
            const start = Long.fromNumber(5);
            const end = Long.fromNumber(10);

            const query = {
                tokenGetAccountNftInfos: {
                    accountID: accountId,
                    start,
                    end,
                },
            };

            const tokenNftInfoQuery = TokenNftInfoQuery._fromProtobuf(query);

            expect(tokenNftInfoQuery).to.be.instanceOf(TokenNftInfoQuery);
            expect(tokenNftInfoQuery._accountId.toString()).to.equal("0.0.3");
            expect(tokenNftInfoQuery._start.toNumber()).to.equal(5);
            expect(tokenNftInfoQuery._end.toNumber()).to.equal(10);
        });

        it("should create from tokenGetNftInfos protobuf", function () {
            const tokenId = { shardNum: 0, realmNum: 0, tokenNum: 4 };
            const start = Long.fromNumber(1);
            const end = Long.fromNumber(100);

            const query = {
                tokenGetNftInfos: {
                    tokenID: tokenId,
                    start,
                    end,
                },
            };

            const tokenNftInfoQuery = TokenNftInfoQuery._fromProtobuf(query);

            expect(tokenNftInfoQuery).to.be.instanceOf(TokenNftInfoQuery);
            expect(tokenNftInfoQuery._tokenId.toString()).to.equal("0.0.4");
            expect(tokenNftInfoQuery._start.toNumber()).to.equal(1);
            expect(tokenNftInfoQuery._end.toNumber()).to.equal(100);
        });

        it("should handle null fields in tokenGetNftInfo protobuf", function () {
            const query = {
                tokenGetNftInfo: {
                    nftID: null,
                },
            };

            const tokenNftInfoQuery = TokenNftInfoQuery._fromProtobuf(query);

            expect(tokenNftInfoQuery).to.be.instanceOf(TokenNftInfoQuery);
            expect(tokenNftInfoQuery.nftId).to.be.null;
        });

        it("should handle null fields in tokenGetAccountNftInfos protobuf", function () {
            const query = {
                tokenGetAccountNftInfos: {
                    accountID: null,
                    start: null,
                    end: null,
                },
            };

            const tokenNftInfoQuery = TokenNftInfoQuery._fromProtobuf(query);

            expect(tokenNftInfoQuery).to.be.instanceOf(TokenNftInfoQuery);
            expect(tokenNftInfoQuery._accountId).to.be.null;
            expect(tokenNftInfoQuery._start).to.be.null;
            expect(tokenNftInfoQuery._end).to.be.null;
        });

        it("should handle null fields in tokenGetNftInfos protobuf", function () {
            const query = {
                tokenGetNftInfos: {
                    tokenID: null,
                    start: null,
                    end: null,
                },
            };

            const tokenNftInfoQuery = TokenNftInfoQuery._fromProtobuf(query);

            expect(tokenNftInfoQuery).to.be.instanceOf(TokenNftInfoQuery);
            expect(tokenNftInfoQuery._tokenId).to.be.null;
            expect(tokenNftInfoQuery._start).to.be.null;
            expect(tokenNftInfoQuery._end).to.be.null;
        });
    });

    describe("constructor", function () {
        it("should default every field to null", function () {
            const query = new TokenNftInfoQuery();

            expect(query.nftId).to.be.null;
        });

        it("should set the nftId given in props", function () {
            const nftId = new NftId(new TokenId(0, 0, 123), 1);
            const query = new TokenNftInfoQuery({ nftId });

            expect(query.nftId.toString()).to.equal(nftId.toString());
        });

        it("should accept an nftId string in props", function () {
            const query = new TokenNftInfoQuery({ nftId: "0.0.123/1" });

            expect(query.nftId.toString()).to.equal("0.0.123/1");
        });
    });

    describe("setNftId", function () {
        it("should accept an instance", function () {
            const nftId = new NftId(new TokenId(0, 0, 123), 1);
            const query = new TokenNftInfoQuery().setNftId(nftId);

            expect(query.nftId.toString()).to.equal(nftId.toString());
        });

        it("should accept a string", function () {
            const query = new TokenNftInfoQuery().setNftId("0.0.123/1");

            expect(query.nftId.toString()).to.equal("0.0.123/1");
        });

        it("should store a copy of the instance", function () {
            const nftId = new NftId(new TokenId(0, 0, 123), 1);
            const query = new TokenNftInfoQuery().setNftId(nftId);

            expect(query.nftId).to.not.equal(nftId);
        });

        it("should be chainable", function () {
            const query = new TokenNftInfoQuery();
            const nftId = new NftId(new TokenId(0, 0, 123), 1);

            expect(query.setNftId(nftId)).to.equal(query);
        });
    });

    describe("getCost", function () {
        it("should return the cost from the cost query", async function () {
            const query = new TokenNftInfoQuery().setNftId(
                new NftId(new TokenId(0, 0, 123), 1),
            );
            query.setNodeAccountIds([new AccountId(0, 0, 3)]);

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

    describe("_execute", function () {
        it("should call token.getTokenNftInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    getTokenNftInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenNftInfoQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the tokenGetNftInfo header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new TokenNftInfoQuery()._mapResponseHeader({
                    tokenGetNftInfo: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the nft info", async function () {
            const nftId = new NftId(new TokenId(0, 0, 123), 1);
            const accountId = new AccountId(0, 0, 456);
            const creationTime = new Timestamp(10, 20);

            const result = await new TokenNftInfoQuery()._mapResponse(
                {
                    tokenGetNftInfo: {
                        nft: {
                            nftID: nftId._toProtobuf(),
                            accountID: accountId._toProtobuf(),
                            creationTime: creationTime._toProtobuf(),
                            metadata: new Uint8Array([1, 2, 3]),
                            ledgerId: null,
                            spenderId: null,
                        },
                    },
                },
                new AccountId(0, 0, 3),
                {},
            );

            expect(result).to.have.lengthOf(1);
            expect(result[0]).to.be.instanceOf(TokenNftInfo);
            expect(result[0].nftId.toString()).to.equal(nftId.toString());
            expect(result[0].accountId.toString()).to.equal(
                accountId.toString(),
            );
            expect(result[0].creationTime.toString()).to.equal(
                creationTime.toString(),
            );
            expect(result[0].metadata).to.deep.equal(new Uint8Array([1, 2, 3]));
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header and nftId", function () {
            const header = { payment: {} };
            const nftId = new NftId(new TokenId(0, 0, 123), 1);
            const query = new TokenNftInfoQuery().setNftId(nftId);

            expect(query._onMakeRequest(header)).to.deep.equal({
                tokenGetNftInfo: {
                    header,
                    nftID: nftId._toProtobuf(),
                },
            });
        });

        it("should encode a missing nftId as null", function () {
            const header = { payment: {} };

            expect(
                new TokenNftInfoQuery()._onMakeRequest(header),
            ).to.deep.equal({
                tokenGetNftInfo: {
                    header,
                    nftID: null,
                },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            expect(new TokenNftInfoQuery()._getLogId()).to.match(
                /^TokenNftInfoQuery:\d+$/,
            );
        });

        it("should use the payment transaction valid start", function () {
            const query = new TokenNftInfoQuery();
            const validStart = { toString: () => "123.456" };
            query._paymentTransactionId = { validStart };

            expect(query._getLogId()).to.equal("TokenNftInfoQuery:123.456");
        });
    });
});
