import { proto } from "@hashgraph/proto";
import { expect } from "chai";

import BigNumber from "bignumber.js";
import EvmAddress from "../../src/EvmAddress.js";
import { AccountId, PublicKey, Long, PrivateKey } from "../../src/index.js";
import { isLongZeroAddress } from "../../src/util.js";
import * as hex from "../../src/encoding/hex.js";

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
    it("should identify Hiero account IDs with zero shard and realm", function () {
        // Create a typical Hiero account address with zeros in shard and realm
        const address = new Uint8Array(20);
        // Set some non-zero bytes in the account number portion (last 8 bytes)
        address[12] = 1;
        address[19] = 255;

        expect(isLongZeroAddress(address)).to.be.true;
    });

    it("should identify Hiero account IDs with non-zero shard", function () {
        const address = new Uint8Array(20);
        // Set non-zero shard (first 4 bytes)
        address[0] = 1;
        // Keep realm bytes (4-11) as zeros
        // Set some non-zero account number
        address[12] = 1;

        expect(isLongZeroAddress(address)).to.be.true;
    });

    it("should identify Ethereum addresses", function () {
        // Test with a typical Ethereum address
        const ethAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const bytes = hex.decode(ethAddress.slice(2)); // Remove '0x' prefix

        expect(isLongZeroAddress(bytes)).to.be.false;
    });

    it("should identify Hiero account IDs with large realm values", function () {
        const accountId = new AccountId(1, 50000, 3);
        const solAddress = accountId.toSolidityAddress();
        const bytes = hex.decode(solAddress);

        expect(isLongZeroAddress(bytes)).to.be.true;
    });

    it("should handle edge case with all zero bytes", function () {
        const address = new Uint8Array(20); // All bytes are 0
        expect(isLongZeroAddress(address)).to.be.true;
    });
    it("should handle long-zero format addresses", function () {
        // Create an address that represents a Hiero account ID (0.0.5)
        const accountId = new AccountId(0, 0, 5);
        const solAddress = accountId.toSolidityAddress();

        // Convert it back using fromEvmAddress
        const result = AccountId.fromEvmAddress(0, 0, solAddress);

        // Should reconstruct the original account ID
        expect(result.shard.toNumber()).to.equal(0);
        expect(result.realm.toNumber()).to.equal(0);
        expect(result.num.toNumber()).to.equal(5);
        expect(result.evmAddress).to.be.null;
    });

    it("should handle native EVM addresses", function () {
        const evmAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const shard = 1;
        const realm = 2;

        const result = AccountId.fromEvmAddress(shard, realm, evmAddress);

        // For EVM addresses, should store shard/realm and keep the EVM address
        expect(result.shard.toNumber()).to.equal(shard);
        expect(result.realm.toNumber()).to.equal(realm);
        expect(result.num.toNumber()).to.equal(0);
        expect(result.evmAddress).to.not.be.null;
        expect(result.evmAddress.toString()).to.equal(
            evmAddress.slice(2).toLowerCase(),
        );
    });

    it("should handle non-zero shard and realm with long-zero format", function () {
        // Create an address that represents a Hiero account ID (1.2.5)
        const accountId = new AccountId(1, 2, 5);
        const solAddress = accountId.toSolidityAddress();

        // Convert it back using fromEvmAddress
        const result = AccountId.fromEvmAddress(1, 2, solAddress);

        // Should reconstruct the original account ID
        expect(result.shard.toNumber()).to.equal(1);
        expect(result.realm.toNumber()).to.equal(2);
        expect(result.num.toNumber()).to.equal(5);
        expect(result.evmAddress).to.be.null;
    });

    it("should accept both string and EvmAddress objects", function () {
        const evmAddressStr = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const evmAddressObj = EvmAddress.fromString(evmAddressStr);

        const result1 = AccountId.fromEvmAddress(1, 2, evmAddressStr);
        const result2 = AccountId.fromEvmAddress(1, 2, evmAddressObj);

        // Both methods should produce equivalent results
        expect(result1.toString()).to.equal(result2.toString());
        expect(result1.evmAddress.toString()).to.equal(
            result2.evmAddress.toString(),
        );
    });

    it("should handle very large account numbers in long-zero format", function () {
        // Create an address with a large account number
        const accountId = new AccountId(0, 0, Long.fromString("123456789"));
        const solAddress = accountId.toSolidityAddress();

        const result = AccountId.fromEvmAddress(0, 0, solAddress);

        expect(result.num.toString()).to.equal("123456789");
        expect(result.evmAddress).to.be.null;
    });
});
