import { proto } from "@hashgraph/proto";

import BigNumber from "bignumber.js";
import EvmAddress from "../../../src/EvmAddress.js";
import { AccountId, PublicKey, Long, PrivateKey } from "../../../src/index.js";
import sinon from "sinon";

describe("AccountId", function () {
    it("constructors", function () {
        expect(new AccountId(3).toString()).to.be.equal("0.0.3");
        expect(new AccountId(1, 2, 3).toString()).to.be.equal("1.2.3");
        expect(
            new AccountId({
                shard: 1,
                realm: 2,
                num: 3,
            }).toString(),
        ).to.be.equal("1.2.3");
        expect(
            new AccountId(
                1,
                2,
                0,
                PublicKey.fromString(
                    "302a300506032b657003210008d5a4eebdb9b8451b64d8ad1ff502b493590e513e5e9c9f810dd3258f298542",
                ),
            ).toString(),
        ).to.be.equal(
            "1.2.302a300506032b657003210008d5a4eebdb9b8451b64d8ad1ff502b493590e513e5e9c9f810dd3258f298542",
        );
        expect(AccountId.fromString("1.2.3").toString()).to.be.equal("1.2.3");
        expect(
            AccountId.fromString(
                "1.2.302a300506032b657003210008d5a4eebdb9b8451b64d8ad1ff502b493590e513e5e9c9f810dd3258f298542",
            ).toString(),
        ).to.be.equal(
            "1.2.302a300506032b657003210008d5a4eebdb9b8451b64d8ad1ff502b493590e513e5e9c9f810dd3258f298542",
        );
        expect(
            new AccountId(
                1,
                2,
                0,
                undefined,
                EvmAddress.fromString(
                    "0011223344556677889900112233445566778899",
                ),
            ).toString(),
        ).to.be.equal("1.2.0011223344556677889900112233445566778899");
    });

    it("clones with alias key", function () {
        expect(
            AccountId.fromString(
                "1.2.302a300506032b657003210008d5a4eebdb9b8451b64d8ad1ff502b493590e513e5e9c9f810dd3258f298542",
            )
                .clone()
                .toString(),
        ).to.be.equal(
            "1.2.302a300506032b657003210008d5a4eebdb9b8451b64d8ad1ff502b493590e513e5e9c9f810dd3258f298542",
        );
    });

    it("should construct from (shard, realm, num)", function () {
        const accountId = new AccountId(10, 50, 25050);

        expect(accountId.num.toNumber()).to.eql(25050);
        expect(accountId.realm.toNumber()).to.eql(50);
        expect(accountId.shard.toNumber()).to.eql(10);
    });

    it("should construct from (0, 0, 0)", function () {
        const accountId = new AccountId(0, 0, 0);

        expect(accountId.num.toNumber()).to.eql(0);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);
    });

    it("should construct from (num)", function () {
        const accountId = new AccountId(25050);

        expect(accountId.num.toNumber()).to.eql(25050);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);
    });

    it("should parse {shard}.{realm}.{num}", function () {
        const accountId = AccountId.fromString("10.50.25050");

        expect(accountId.num.toNumber()).to.eql(25050);
        expect(accountId.realm.toNumber()).to.eql(50);
        expect(accountId.shard.toNumber()).to.eql(10);
    });

    it("should parse 0.0.0", function () {
        const accountId = AccountId.fromString("0.0.0");

        expect(accountId.num.toNumber()).to.eql(0);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);
    });

    it("should parse {num}", function () {
        const accountId = AccountId.fromString("25050");

        expect(accountId.num.toNumber()).to.eql(25050);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);
    });

    it("should error with invalid string", function () {
        let err = false;

        try {
            AccountId.fromString("asdfasf");
        } catch {
            err = true;
        }

        try {
            AccountId.fromString(" .0.1");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error("`AccountId.fromString()` did not error");
        }

        try {
            AccountId.fromString("");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error("`AccountId.fromString()` did not error");
        }

        try {
            AccountId.fromString("0.0");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error("`AccountId.fromString()` did not error");
        }

        try {
            AccountId.fromString("0.0.");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error("`AccountId.fromString()` did not error");
        }

        try {
            AccountId.fromString("0.0.a");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error("`AccountId.fromString()` did not error");
        }

        try {
            AccountId.fromString("0.0.-a");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error("`AccountId.fromString()` did not error");
        }
    });

    it("should handle hollow account (num=0 with alias)", function () {
        const alias = PrivateKey.generateECDSA().publicKey;
        const protoKey = proto.Key.encode(alias._toProtobufKey()).finish();
        const accountId = new AccountId(0, 0, 0, alias);

        const result = accountId._toProtobuf();

        expect(result).to.deep.equal({
            alias: protoKey,
            shardNum: Long.fromNumber(0),
            realmNum: Long.fromNumber(0),
            accountNum: null,
        });
    });

    it("should handle non-hollow account with both num and alias", function () {
        const accountId = new AccountId({
            num: Long.fromNumber(123),
            alias: "test-alias",
            shard: 1,
            realm: 2,
        });

        const result = accountId._toProtobuf();

        expect(result).to.deep.equal({
            alias: null,
            accountNum: Long.fromNumber(123),
            shardNum: Long.fromNumber(1),
            realmNum: Long.fromNumber(2),
        });
    });

    it("should handle account with only num", function () {
        const accountId = new AccountId({
            num: Long.fromNumber(123),
            shard: 1,
            realm: 2,
        });

        const result = accountId._toProtobuf();

        expect(result).to.deep.equal({
            alias: null,
            accountNum: Long.fromNumber(123),
            shardNum: Long.fromNumber(1),
            realmNum: Long.fromNumber(2),
        });
    });

    it("should error when string negative numbers are directly passed to constructor", function () {
        let err = false;

        try {
            AccountId.fromString("0.0.-1");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error(
                "`AccountId.constructor` with negative numbers did not error",
            );
        }

        try {
            AccountId.fromString("-1.-1.-1");
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error(
                "`AccountId.constructor` with negative numbers did not error",
            );
        }

        try {
            new AccountId(0, 0, -1);
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error(
                "`AccountId.constructor` with negative numbers did not error",
            );
        }

        try {
            new AccountId(-1, -1, -1);
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error(
                "`AccountId.constructor` with negative numbers did not error",
            );
        }

        try {
            new AccountId(-1);
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error(
                "`AccountId.constructor` with negative numbers did not error",
            );
        }

        try {
            new AccountId(new BigNumber(-1));
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error(
                "`AccountId.constructor` with negative numbers did not error",
            );
        }

        try {
            new AccountId(
                new BigNumber(-1),
                new BigNumber(-1),
                new BigNumber(-1),
            );
        } catch {
            err = true;
        }

        if (!err) {
            throw new Error(
                "`AccountId.constructor` with negative numbers did not error",
            );
        }
    });

    describe("populateAccountNum", function () {
        let originalFetch;
        let originalSetTimeout;
        let mockClient;

        beforeEach(function () {
            // Save originals
            originalFetch = global.fetch;
            originalSetTimeout = global.setTimeout;

            // Setup client mock
            mockClient = {
                mirrorNetwork: ["testnet.mirrornode.com:443"],
            };

            // Mock setTimeout to execute immediately
            global.setTimeout = (callback) => {
                callback();
                return 0;
            };
        });

        afterEach(function () {
            // Restore originals
            global.fetch = originalFetch;
            global.setTimeout = originalSetTimeout;
        });

        it("should populate the num field from mirror node response", async function () {
            // Mock fetch response
            global.fetch = sinon.stub().resolves({
                json: sinon.stub().resolves({
                    account: "0.0.12345",
                }),
            });

            // Create account ID with an EVM address
            const evmAddress = EvmAddress.fromString(
                "123f681646d4a755815f9cb19e1acc8565a0c2ac",
            );
            const accountId = new AccountId(0, 0, 0, undefined, evmAddress);

            // Call the method
            const result = await accountId.populateAccountNum(mockClient);

            // Verify fetch was called with correct URL
            expect(global.fetch.calledOnce).to.be.true;
            expect(global.fetch.firstCall.args[0]).to.equal(
                "https://testnet.mirrornode.com/api/v1/accounts/123f681646d4a755815f9cb19e1acc8565a0c2ac",
            );

            // Verify num was populated correctly
            expect(result.num.toString()).to.equal("12345");
            expect(accountId.num.toString()).to.equal("12345");

            // Verify other fields remained unchanged
            expect(accountId.shard.toNumber()).to.equal(0);
            expect(accountId.realm.toNumber()).to.equal(0);
            expect(accountId.evmAddress).to.equal(evmAddress);
        });

        it("should throw when evmAddress is null", async function () {
            // Create account ID without an EVM address
            const accountId = new AccountId(0, 0, 0);

            // Should throw error because evmAddress is null
            try {
                await accountId.populateAccountNum(mockClient);
                throw new Error("Expected method to throw");
            } catch (error) {
                expect(error.message).to.equal(
                    "field `evmAddress` should not be null",
                );
            }
        });

        it("should handle errors from the mirror node", async function () {
            // Mock fetch to simulate an error
            global.fetch = sinon.stub().rejects(new Error("Network error"));

            // Create account ID with an EVM address
            const evmAddress = EvmAddress.fromString(
                "123f681646d4a755815f9cb19e1acc8565a0c2ac",
            );
            const accountId = new AccountId(0, 0, 0, undefined, evmAddress);

            // Should throw error from fetch
            try {
                await accountId.populateAccountNum(mockClient);
                throw new Error("Expected method to throw");
            } catch (error) {
                expect(error.message).to.equal("Network error");
            }
        });
    });

    describe("populateAccountEvmAddress", function () {
        let originalFetch;
        let originalSetTimeout;
        let mockClient;

        beforeEach(function () {
            // Save originals
            originalFetch = global.fetch;
            originalSetTimeout = global.setTimeout;

            // Setup client mock
            mockClient = {
                mirrorNetwork: ["testnet.mirrornode.com:443"],
            };

            // Mock setTimeout to execute immediately
            global.setTimeout = (callback) => {
                callback();
                return 0;
            };
        });

        afterEach(function () {
            // Restore originals
            global.fetch = originalFetch;
            global.setTimeout = originalSetTimeout;
        });

        it("should populate the evmAddress field from mirror node response", async function () {
            // Mock fetch response
            global.fetch = sinon.stub().resolves({
                json: sinon.stub().resolves({
                    evm_address: "123f681646d4a755815f9cb19e1acc8565a0c2ac",
                }),
            });

            // Create account ID with account number
            const accountId = new AccountId(0, 0, 12345);

            // Call the method
            const result =
                await accountId.populateAccountEvmAddress(mockClient);

            // Verify fetch was called with correct URL
            expect(global.fetch.calledOnce).to.be.true;
            expect(global.fetch.firstCall.args[0]).to.equal(
                "https://testnet.mirrornode.com/api/v1/accounts/12345",
            );

            // Verify evmAddress was populated correctly
            expect(result.evmAddress.toString()).to.equal(
                "123f681646d4a755815f9cb19e1acc8565a0c2ac",
            );
            expect(accountId.evmAddress.toString()).to.equal(
                "123f681646d4a755815f9cb19e1acc8565a0c2ac",
            );

            // Verify other fields remained unchanged
            expect(accountId.shard.toNumber()).to.equal(0);
            expect(accountId.realm.toNumber()).to.equal(0);
            expect(accountId.num.toString()).to.equal("12345");
        });

        it("should throw when num is null", async function () {
            // Create a modified account ID with num set to null
            const accountId = new AccountId(0, 0, 0);
            accountId.num = null;

            // Should throw error because num is null
            try {
                await accountId.populateAccountEvmAddress(mockClient);
                throw new Error("Expected method to throw");
            } catch (error) {
                expect(error.message).to.equal(
                    "field `num` should not be null",
                );
            }
        });

        it("should handle errors from the mirror node", async function () {
            // Mock fetch to simulate an error
            global.fetch = sinon.stub().rejects(new Error("Network error"));

            // Create account ID
            const accountId = new AccountId(0, 0, 12345);

            // Should throw error from fetch
            try {
                await accountId.populateAccountEvmAddress(mockClient);
                throw new Error("Expected method to throw");
            } catch (error) {
                expect(error.message).to.equal("Network error");
            }
        });
    });
});
