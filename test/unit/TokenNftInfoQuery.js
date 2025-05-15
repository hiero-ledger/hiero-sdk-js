import { TokenNftInfoQuery } from "../../src/index.js";
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
});
