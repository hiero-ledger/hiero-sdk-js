// SPDX-License-Identifier: Apache-2.0

import TokenNftInfo from "../../src/token/TokenNftInfo.js";
import { Long } from "../../src/index.js";

describe("TokenNftInfo", function () {
    const proto = {
        nftID: {
            token_ID: { shardNum: 0, realmNum: 0, tokenNum: 42 },
            serialNumber: Long.fromNumber(7),
        },
        accountID: { shardNum: 0, realmNum: 0, accountNum: 1001 },
        creationTime: { seconds: Long.fromNumber(1000), nanos: 0 },
        metadata: new Uint8Array([1, 2, 3]),
        ledgerId: new Uint8Array([0]),
        spenderId: null,
    };

    describe("_fromProtobuf", function () {
        it("produces the correct nftId string", function () {
            const info = TokenNftInfo._fromProtobuf(proto);
            expect(info.nftId.toString()).to.equal("0.0.42/7");
        });

        it("produces the correct accountId string", function () {
            const info = TokenNftInfo._fromProtobuf(proto);
            expect(info.accountId.toString()).to.equal("0.0.1001");
        });

        it("preserves metadata bytes", function () {
            const info = TokenNftInfo._fromProtobuf(proto);
            expect(info.metadata).to.deep.equal(new Uint8Array([1, 2, 3]));
        });

        it("resolves ledgerId to mainnet", function () {
            const info = TokenNftInfo._fromProtobuf(proto);
            expect(info.ledgerId.toString()).to.equal("mainnet");
        });

        it("sets metadata to null when omitted", function () {
            const info = TokenNftInfo._fromProtobuf({
                ...proto,
                metadata: undefined,
            });
            expect(info.metadata).to.be.null;
        });

        it("sets ledgerId to null when omitted", function () {
            const info = TokenNftInfo._fromProtobuf({
                ...proto,
                ledgerId: null,
            });
            expect(info.ledgerId).to.be.null;
        });

        it("sets spenderId to null when omitted", function () {
            const info = TokenNftInfo._fromProtobuf(proto);
            expect(info.spenderId).to.be.null;
        });
    });

    describe("_toProtobuf round-trip", function () {
        it("recovers the original token numeric fields", function () {
            const result = TokenNftInfo._fromProtobuf(proto)._toProtobuf();
            const tokenId = result.nftID.token_ID;
            expect(Number(tokenId.shardNum)).to.equal(0);
            expect(Number(tokenId.realmNum)).to.equal(0);
            expect(Number(tokenId.tokenNum)).to.equal(42);
        });

        it("recovers the original serial number", function () {
            const result = TokenNftInfo._fromProtobuf(proto)._toProtobuf();
            expect(Long.fromValue(result.nftID.serialNumber).toNumber()).to.equal(7);
        });

        it("recovers the original accountId numeric fields", function () {
            const result = TokenNftInfo._fromProtobuf(proto)._toProtobuf();
            const accountId = result.accountID;
            expect(Number(accountId.shardNum)).to.equal(0);
            expect(Number(accountId.realmNum)).to.equal(0);
            expect(Number(accountId.accountNum)).to.equal(1001);
        });

        it("preserves metadata in the round-trip", function () {
            const result = TokenNftInfo._fromProtobuf(proto)._toProtobuf();
            expect(result.metadata).to.deep.equal(new Uint8Array([1, 2, 3]));
        });

        it("preserves ledgerId bytes in the round-trip", function () {
            const result = TokenNftInfo._fromProtobuf(proto)._toProtobuf();
            expect(result.ledgerId).to.deep.equal(new Uint8Array([0]));
        });

        it("sets metadata to null when originally absent", function () {
            const result = TokenNftInfo._fromProtobuf({
                ...proto,
                metadata: undefined,
            })._toProtobuf();
            expect(result.metadata).to.be.null;
        });

        it("sets ledgerId to null when originally absent", function () {
            const result = TokenNftInfo._fromProtobuf({
                ...proto,
                ledgerId: null,
            })._toProtobuf();
            expect(result.ledgerId).to.be.null;
        });
    });
});
