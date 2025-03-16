/* eslint-disable mocha/no-setup-in-describe */

import {
    AccountId,
    Client,
    NftId,
    TokenId,
    TokenRejectFlow,
} from "../../src/index.js";

describe("TokenRejectFlow", function () {
    let tokenIds = [
        TokenId.fromString("1.2.3"),
        TokenId.fromString("1.2.4"),
        TokenId.fromString("1.2.5"),
    ];

    let nftIds = [
        new NftId(tokenIds[0], 1),
        new NftId(tokenIds[1], 2),
        new NftId(tokenIds[2], 3),
    ];

    let tx;

    it("should set owner id", function () {
        const owner = new AccountId(1);
        tx = new TokenRejectFlow().setOwnerId(owner);
        expect(tx.ownerId.toString()).to.equal(owner.toString());
    });

    it("set owner id when frozen", async function () {
        const client = Client.forLocalNode();
        tx = new TokenRejectFlow().addNftId(nftIds[0]).freezeWith(client);

        let err = false;
        try {
            tx.setOwnerId(new AccountId(2));
        } catch (error) {
            err = true;
        }

        expect(err).to.equal(true);
    });

    it("should set token ids", function () {
        const tx = new TokenRejectFlow().setTokenIds(tokenIds);
        expect(tx.tokenIds).to.deep.equal(tokenIds);
    });

    it("should not be able to set token ids frozen", function () {
        const client = Client.forLocalNode();
        const tx = new TokenRejectFlow().setTokenIds().freezeWith(client);
        let err = false;
        try {
            tx.setTokenIds(tokenIds);
        } catch (error) {
            err = true;
        }

        expect(err).to.equal(true);
    });

    it("should be able to set token nft ids", function () {
        const tx = new TokenRejectFlow().setNftIds(nftIds);
        expect(tx.nftIds).to.deep.equal(nftIds);
    });

    it("should not be able to set nft ids frozen", function () {
        const client = Client.forLocalNode();
        const tx = new TokenRejectFlow().setNftIds().freezeWith(client);
        let err = false;
        try {
            tx.setNftIds(nftIds);
        } catch (error) {
            err = true;
        }

        expect(err).to.equal(true);
    });
});
