import { expect } from "chai";
import {
    NftId,
    TokenId,
    AccountId,
    PendingAirdropId,
} from "../../src/index.js";

describe("PendingAirdropId", function () {
    let nftId, tokenId, serial, senderId, receiverId;

    beforeEach(function () {
        serial = 0;
        tokenId = new TokenId(0, 0, 1);
        nftId = new NftId(tokenId, serial);
        senderId = new AccountId(0, 0, 1);
        receiverId = new AccountId(0, 0, 2);
    });

    it("should populate PendingAirdropId from constructor", function () {
        const pendingAirdropId = new PendingAirdropId({
            nftId,
            senderId,
            receiverId,
        });

        expect(pendingAirdropId.nftId).to.eql(nftId);
        expect(pendingAirdropId.senderId).to.eql(senderId);
        expect(pendingAirdropId.receiverId).to.eql(receiverId);
    });

    it("should set nftId", function () {
        const pendingAirdropId = new PendingAirdropId().setNftId(nftId);
        expect(pendingAirdropId.nftId).to.eql(nftId);
        expect(pendingAirdropId.tokenId).to.eql(null);
    });

    it("should set tokenId", function () {
        const pendingAirdropId = new PendingAirdropId().setTokenId(tokenId);
        expect(pendingAirdropId.tokenId).to.eql(tokenId);
        expect(pendingAirdropId.nftId).to.eql(null);
    });

    it("should set senderId", function () {
        const pendingAirdropId = new PendingAirdropId().setSenderid(senderId);
        expect(pendingAirdropId.senderId).to.eql(senderId);
    });

    it("should set receiverId", function () {
        const pendingAirdropId = new PendingAirdropId().setReceiverId(
            receiverId,
        );
        expect(pendingAirdropId.receiverId).to.eql(receiverId);
    });

    it("should not be able to call fromBytes", async function () {
        const pendingAirdropId = new PendingAirdropId({
            senderId,
            receiverId,
        });

        const proto = pendingAirdropId.toBytes();

        let error = false;
        try {
            PendingAirdropId.fromBytes(proto);
        } catch (err) {
            error = err.message.includes(
                "Either fungibleTokenType or nonFungibleToken is required",
            );
        }

        expect(error).to.eql(true);
    });
});
