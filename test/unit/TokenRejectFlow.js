// SPDX-License-Identifier: Apache-2.0

import TokenRejectFlow from "../../src/token/TokenRejectFlow.js";
import TokenId from "../../src/token/TokenId.js";
import NftId from "../../src/token/NftId.js";
import AccountId from "../../src/account/AccountId.js";

describe("TokenRejectFlow", function () {
    // Constructor and setter coercion
    describe("setters and getters", function () {
        it("should store TokenId instances via setTokenIds", function () {
            const flow = new TokenRejectFlow();
            const tokenId = TokenId.fromString("0.0.1");
            flow.setTokenIds([tokenId]);

            expect(flow.tokenIds[0]).to.be.instanceOf(TokenId);
            expect(flow.tokenIds[0].toString()).to.equal("0.0.1");
        });

        it("should store NftId instances via setNftIds", function () {
            const flow = new TokenRejectFlow();
            const nftId = NftId.fromString("0.0.1/1");
            flow.setNftIds([nftId]);

            expect(flow.nftIds[0]).to.be.instanceOf(NftId);
            expect(flow.nftIds[0].tokenId.toString()).to.equal("0.0.1");
        });

        it("should store AccountId via setOwnerId", function () {
            const flow = new TokenRejectFlow();
            const ownerId = AccountId.fromString("0.0.5");
            flow.setOwnerId(ownerId);

            expect(flow.ownerId).to.be.instanceOf(AccountId);
            expect(flow.ownerId.toString()).to.equal("0.0.5");
        });

        it("should append via addTokenId", function () {
            const flow = new TokenRejectFlow();
            flow.addTokenId(TokenId.fromString("0.0.1"));
            flow.addTokenId(TokenId.fromString("0.0.2"));

            expect(flow.tokenIds).to.have.lengthOf(2);
            expect(flow.tokenIds[1].toString()).to.equal("0.0.2");
        });

        it("should append via addNftId", function () {
            const flow = new TokenRejectFlow();
            flow.addNftId(NftId.fromString("0.0.1/1"));
            flow.addNftId(NftId.fromString("0.0.2/5"));

            expect(flow.nftIds).to.have.lengthOf(2);
            expect(flow.nftIds[1].tokenId.toString()).to.equal("0.0.2");
        });
    });

    // Fluent setters return this
    describe("fluent setters", function () {
        it("setTokenIds returns this", function () {
            const flow = new TokenRejectFlow();
            const result = flow.setTokenIds([TokenId.fromString("0.0.1")]);
            expect(result).to.equal(flow);
        });

        it("setNftIds returns this", function () {
            const flow = new TokenRejectFlow();
            const result = flow.setNftIds([NftId.fromString("0.0.1/1")]);
            expect(result).to.equal(flow);
        });

        it("setOwnerId returns this", function () {
            const flow = new TokenRejectFlow();
            const result = flow.setOwnerId(AccountId.fromString("0.0.5"));
            expect(result).to.equal(flow);
        });

        it("sign returns this", function () {
            const flow = new TokenRejectFlow();
            const mockKey = { _key: "mock" };
            const result = flow.sign(mockKey);
            expect(result).to.equal(flow);
        });

        it("signWith returns this", function () {
            const flow = new TokenRejectFlow();
            const mockPubKey = { _key: "pub" };
            const mockSigner = async () => new Uint8Array();
            const result = flow.signWith(mockPubKey, mockSigner);
            expect(result).to.equal(flow);
        });

        it("freezeWith returns this", function () {
            const flow = new TokenRejectFlow();
            const mockClient = {};
            const result = flow.freezeWith(mockClient);
            expect(result).to.equal(flow);
        });
    });

    // signWithOperator
    describe("signWithOperator", function () {
        it("should throw when client operator is null", function () {
            const flow = new TokenRejectFlow();
            const mockClient = {
                getOperator: () => null,
            };

            expect(() => flow.signWithOperator(mockClient)).to.throw(
                "Client operator must be set",
            );
        });

        it("should store operator publicKey and transactionSigner", function () {
            const flow = new TokenRejectFlow();
            const mockPubKey = { _key: "operator-pub" };
            const mockSigner = async () => new Uint8Array();
            const mockClient = {
                getOperator: () => ({
                    publicKey: mockPubKey,
                    transactionSigner: mockSigner,
                }),
            };

            const result = flow.signWithOperator(mockClient);

            expect(result).to.equal(flow);
            expect(flow._signPublicKey).to.equal(mockPubKey);
            expect(flow._transactionSigner).to.equal(mockSigner);
            expect(flow._signPrivateKey).to.be.null;
        });
    });

    // requireNotFrozen
    describe("requireNotFrozen", function () {
        it("should not throw before freezeWith is called", function () {
            const flow = new TokenRejectFlow();
            expect(() => flow.requireNotFrozen()).to.not.throw();
        });

        it("should throw after freezeWith is called", function () {
            const flow = new TokenRejectFlow();
            flow.freezeWith({});

            expect(() => flow.requireNotFrozen()).to.throw(
                "Transaction is already frozen and cannot be modified",
            );
        });

        it("should prevent setTokenIds after freeze", function () {
            const flow = new TokenRejectFlow();
            flow.freezeWith({});

            expect(() =>
                flow.setTokenIds([TokenId.fromString("0.0.1")]),
            ).to.throw("Transaction is already frozen and cannot be modified");
        });

        it("should prevent setNftIds after freeze", function () {
            const flow = new TokenRejectFlow();
            flow.freezeWith({});

            expect(() =>
                flow.setNftIds([NftId.fromString("0.0.1/1")]),
            ).to.throw("Transaction is already frozen and cannot be modified");
        });

        it("should prevent setOwnerId after freeze", function () {
            const flow = new TokenRejectFlow();
            flow.freezeWith({});

            expect(() =>
                flow.setOwnerId(AccountId.fromString("0.0.5")),
            ).to.throw("Transaction is already frozen and cannot be modified");
        });
    });

    // fillOutTransaction
    describe("fillOutTransaction", function () {
        it("should call sign() on transaction when signPrivateKey is set", function () {
            const flow = new TokenRejectFlow();
            const mockKey = { _key: "private" };
            flow.sign(mockKey);

            const calls = [];
            const mockTx = {
                freezeWith: () => mockTx,
                sign: (key) => {
                    calls.push({ method: "sign", key });
                },
                signWith: () => {},
            };

            flow.fillOutTransaction(mockTx);

            expect(calls).to.have.lengthOf(1);
            expect(calls[0].method).to.equal("sign");
            expect(calls[0].key).to.equal(mockKey);
        });

        it("should call signWith() on transaction when publicKey and signer are set", function () {
            const flow = new TokenRejectFlow();
            const mockPubKey = { _key: "pub" };
            const mockSigner = async () => new Uint8Array();
            flow.signWith(mockPubKey, mockSigner);

            const calls = [];
            const mockTx = {
                freezeWith: () => mockTx,
                sign: () => {},
                signWith: (pub, signer) => {
                    calls.push({ method: "signWith", pub, signer });
                },
            };

            flow.fillOutTransaction(mockTx);

            expect(calls).to.have.lengthOf(1);
            expect(calls[0].method).to.equal("signWith");
            expect(calls[0].pub).to.equal(mockPubKey);
            expect(calls[0].signer).to.equal(mockSigner);
        });

        it("should call freezeWith on transaction when freezeWithClient is set", function () {
            const flow = new TokenRejectFlow();
            const mockClient = { _id: "client" };
            flow.freezeWith(mockClient);

            const calls = [];
            const mockTx = {
                freezeWith: (client) => {
                    calls.push({ method: "freezeWith", client });
                    return mockTx;
                },
                sign: () => {},
                signWith: () => {},
            };

            flow.fillOutTransaction(mockTx);

            expect(calls).to.have.lengthOf(1);
            expect(calls[0].method).to.equal("freezeWith");
            expect(calls[0].client).to.equal(mockClient);
        });

        it("should not call sign or signWith when no signing is configured", function () {
            const flow = new TokenRejectFlow();

            const calls = [];
            const mockTx = {
                freezeWith: () => mockTx,
                sign: () => {
                    calls.push("sign");
                },
                signWith: () => {
                    calls.push("signWith");
                },
            };

            flow.fillOutTransaction(mockTx);

            expect(calls).to.have.lengthOf(0);
        });

        it("should prefer sign over signWith when signPrivateKey is set last", function () {
            const flow = new TokenRejectFlow();
            const mockPubKey = { _key: "pub" };
            const mockSigner = async () => new Uint8Array();
            const mockKey = { _key: "private" };

            // Set signWith first, then sign — sign should win
            flow.signWith(mockPubKey, mockSigner);
            flow.sign(mockKey);

            const calls = [];
            const mockTx = {
                freezeWith: () => mockTx,
                sign: (key) => {
                    calls.push({ method: "sign", key });
                },
                signWith: () => {
                    calls.push({ method: "signWith" });
                },
            };

            flow.fillOutTransaction(mockTx);

            expect(calls).to.have.lengthOf(1);
            expect(calls[0].method).to.equal("sign");
        });
    });

    // sign/signWith mutual exclusion
    describe("sign and signWith mutual exclusion", function () {
        it("sign() clears signPublicKey and transactionSigner", function () {
            const flow = new TokenRejectFlow();
            const mockPubKey = { _key: "pub" };
            const mockSigner = async () => new Uint8Array();
            flow.signWith(mockPubKey, mockSigner);

            const mockKey = { _key: "private" };
            flow.sign(mockKey);

            expect(flow._signPrivateKey).to.equal(mockKey);
            expect(flow._signPublicKey).to.be.null;
            expect(flow._transactionSigner).to.be.null;
        });

        it("signWith() clears signPrivateKey", function () {
            const flow = new TokenRejectFlow();
            const mockKey = { _key: "private" };
            flow.sign(mockKey);

            const mockPubKey = { _key: "pub" };
            const mockSigner = async () => new Uint8Array();
            flow.signWith(mockPubKey, mockSigner);

            expect(flow._signPublicKey).to.equal(mockPubKey);
            expect(flow._transactionSigner).to.equal(mockSigner);
            expect(flow._signPrivateKey).to.be.null;
        });
    });
});
