import { HbarAllowance, AccountId, Hbar, Client } from "../../src/index.js";
import Long from "long";

describe("HbarAllowance", function () {
    const ownerAccountId = AccountId.fromString("0.0.1000");
    const spenderAccountId = AccountId.fromString("0.0.2000");
    const amount = Hbar.fromTinybars(100);

    describe("constructor", function () {
        it("should store properties correctly", function () {
            const allowance = new HbarAllowance({
                spenderAccountId,
                ownerAccountId,
                amount,
            });

            expect(allowance.spenderAccountId.toString()).to.equal(
                spenderAccountId.toString(),
            );
            expect(allowance.ownerAccountId.toString()).to.equal(
                ownerAccountId.toString(),
            );
            expect(allowance.amount.toTinybars().toNumber()).to.equal(100);
        });

        it("should freeze the object", function () {
            const allowance = new HbarAllowance({
                spenderAccountId,
                ownerAccountId,
                amount,
            });

            expect(Object.isFrozen(allowance)).to.be.true;
        });

        it("should handle null properties", function () {
            const allowance = new HbarAllowance({
                spenderAccountId: null,
                ownerAccountId: null,
                amount: null,
            });

            expect(allowance.spenderAccountId).to.be.null;
            expect(allowance.ownerAccountId).to.be.null;
            expect(allowance.amount).to.be.null;
        });
    });

    describe("_fromProtobuf", function () {
        it("should construct correctly with non-null owner", function () {
            const proto = {
                spender: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(2000),
                },
                owner: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(1000),
                },
                amount: Long.fromNumber(100),
            };

            const allowance = HbarAllowance._fromProtobuf(proto);

            expect(allowance.spenderAccountId.toString()).to.equal("0.0.2000");
            expect(allowance.ownerAccountId.toString()).to.equal("0.0.1000");
            expect(allowance.amount.toTinybars().toNumber()).to.equal(100);
        });

        it("should construct correctly with null owner", function () {
            const proto = {
                spender: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(2000),
                },
                owner: null,
                amount: Long.fromNumber(500),
            };

            const allowance = HbarAllowance._fromProtobuf(proto);

            expect(allowance.spenderAccountId.toString()).to.equal("0.0.2000");
            expect(allowance.ownerAccountId).to.be.null;
            expect(allowance.amount.toTinybars().toNumber()).to.equal(500);
        });

        it("should default amount to 0 when null", function () {
            const proto = {
                spender: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(1),
                },
                owner: null,
                amount: null,
            };

            const allowance = HbarAllowance._fromProtobuf(proto);

            expect(allowance.amount.toTinybars().toNumber()).to.equal(0);
        });

        it("should round-trip through _toProtobuf with non-null owner", function () {
            const proto = {
                spender: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(2000),
                },
                owner: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(1000),
                },
                amount: Long.fromNumber(100),
            };

            const allowance = HbarAllowance._fromProtobuf(proto);
            const roundTripped = HbarAllowance._fromProtobuf(
                allowance._toProtobuf(),
            );

            expect(roundTripped.spenderAccountId.toString()).to.equal(
                allowance.spenderAccountId.toString(),
            );
            expect(roundTripped.ownerAccountId.toString()).to.equal(
                allowance.ownerAccountId.toString(),
            );
            expect(roundTripped.amount.toTinybars().toNumber()).to.equal(
                allowance.amount.toTinybars().toNumber(),
            );
        });

        it("should round-trip through _toProtobuf with null owner", function () {
            const proto = {
                spender: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(2000),
                },
                owner: null,
                amount: Long.fromNumber(100),
            };

            const allowance = HbarAllowance._fromProtobuf(proto);
            const roundTripped = HbarAllowance._fromProtobuf(
                allowance._toProtobuf(),
            );

            expect(roundTripped.spenderAccountId.toString()).to.equal(
                allowance.spenderAccountId.toString(),
            );
            expect(roundTripped.ownerAccountId).to.be.null;
            expect(roundTripped.amount.toTinybars().toNumber()).to.equal(
                allowance.amount.toTinybars().toNumber(),
            );
        });
    });

    describe("_fromGrantedProtobuf", function () {
        it("should construct a valid instance with provided owner", function () {
            const grantedProto = {
                spender: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(2000),
                },
                amount: Long.fromNumber(300),
            };

            const allowance = HbarAllowance._fromGrantedProtobuf(
                grantedProto,
                ownerAccountId,
            );

            expect(allowance.spenderAccountId.toString()).to.equal("0.0.2000");
            expect(allowance.ownerAccountId.toString()).to.equal(
                ownerAccountId.toString(),
            );
            expect(allowance.amount.toTinybars().toNumber()).to.equal(300);
        });

        it("should default amount to 0 when null", function () {
            const grantedProto = {
                spender: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(2000),
                },
                amount: null,
            };

            const allowance = HbarAllowance._fromGrantedProtobuf(
                grantedProto,
                ownerAccountId,
            );

            expect(allowance.amount.toTinybars().toNumber()).to.equal(0);
        });
    });

    describe("_toProtobuf", function () {
        it("should produce correct proto structure with all non-null fields", function () {
            const allowance = new HbarAllowance({
                ownerAccountId,
                spenderAccountId,
                amount,
            });

            const proto = allowance._toProtobuf();

            expect(proto).to.deep.equal({
                owner: ownerAccountId._toProtobuf(),
                spender: spenderAccountId._toProtobuf(),
                amount: amount.toTinybars(),
            });
        });

        it("should produce correct proto structure with null ownerAccountId", function () {
            const allowance = new HbarAllowance({
                ownerAccountId: null,
                spenderAccountId,
                amount,
            });

            const proto = allowance._toProtobuf();

            expect(proto.owner).to.be.null;
            expect(proto.spender).to.deep.equal(spenderAccountId._toProtobuf());
            expect(proto.amount.toNumber()).to.equal(100);
        });

        it("should produce correct proto structure with null spenderAccountId", function () {
            const allowance = new HbarAllowance({
                ownerAccountId,
                spenderAccountId: null,
                amount,
            });

            const proto = allowance._toProtobuf();

            expect(proto.owner).to.deep.equal(ownerAccountId._toProtobuf());
            expect(proto.spender).to.be.null;
            expect(proto.amount.toNumber()).to.equal(100);
        });

        it("should produce correct proto structure with null amount", function () {
            const allowance = new HbarAllowance({
                ownerAccountId,
                spenderAccountId,
                amount: null,
            });

            const proto = allowance._toProtobuf();

            expect(proto.owner).to.deep.equal(ownerAccountId._toProtobuf());
            expect(proto.spender).to.deep.equal(spenderAccountId._toProtobuf());
            expect(proto.amount).to.be.null;
        });

        it("should produce correct proto structure with all null fields", function () {
            const allowance = new HbarAllowance({
                ownerAccountId: null,
                spenderAccountId: null,
                amount: null,
            });

            const proto = allowance._toProtobuf();

            expect(proto.owner).to.be.null;
            expect(proto.spender).to.be.null;
            expect(proto.amount).to.be.null;
        });
    });

    describe("_validateChecksums", function () {
        it("should not throw when spenderAccountId is set", function () {
            const client = Client.forTestnet();

            const allowance = new HbarAllowance({
                spenderAccountId,
                ownerAccountId: null,
                amount,
            });

            expect(() => allowance._validateChecksums(client)).to.not.throw();
        });

        it("should not throw when both account IDs are null", function () {
            const client = Client.forTestnet();

            const allowance = new HbarAllowance({
                spenderAccountId: null,
                ownerAccountId: null,
                amount: null,
            });

            expect(() => allowance._validateChecksums(client)).to.not.throw();
        });

        // Note: _validateChecksums has a known bug — it checks
        // spenderAccountId twice instead of checking ownerAccountId.
        // This test documents the existing (buggy) behavior as-is.
        it("should validate spenderAccountId (existing behavior)", function () {
            const client = Client.forTestnet();

            const allowance = new HbarAllowance({
                spenderAccountId,
                ownerAccountId,
                amount,
            });

            // Should not throw since both IDs are valid without checksums
            expect(() => allowance._validateChecksums(client)).to.not.throw();
        });
    });

    describe("toJSON", function () {
        it("should produce expected JSON shape with all fields", function () {
            const allowance = new HbarAllowance({
                ownerAccountId,
                spenderAccountId,
                amount,
            });

            const json = allowance.toJSON();

            expect(json).to.deep.equal({
                ownerAccountId: ownerAccountId.toString(),
                spenderAccountId: spenderAccountId.toString(),
                amount: amount.toString(),
            });
        });

        it("should produce expected JSON shape with null ownerAccountId", function () {
            const allowance = new HbarAllowance({
                ownerAccountId: null,
                spenderAccountId,
                amount,
            });

            const json = allowance.toJSON();

            expect(json.ownerAccountId).to.be.null;
            expect(json.spenderAccountId).to.equal(spenderAccountId.toString());
            expect(json.amount).to.equal(amount.toString());
        });

        it("should produce expected JSON shape with null spenderAccountId", function () {
            const allowance = new HbarAllowance({
                ownerAccountId,
                spenderAccountId: null,
                amount,
            });

            const json = allowance.toJSON();

            expect(json.ownerAccountId).to.equal(ownerAccountId.toString());
            expect(json.spenderAccountId).to.be.null;
            expect(json.amount).to.equal(amount.toString());
        });

        it("should produce expected JSON shape with null amount", function () {
            const allowance = new HbarAllowance({
                ownerAccountId,
                spenderAccountId,
                amount: null,
            });

            const json = allowance.toJSON();

            expect(json.ownerAccountId).to.equal(ownerAccountId.toString());
            expect(json.spenderAccountId).to.equal(spenderAccountId.toString());
            expect(json.amount).to.be.null;
        });

        it("should produce expected JSON shape with all null fields", function () {
            const allowance = new HbarAllowance({
                ownerAccountId: null,
                spenderAccountId: null,
                amount: null,
            });

            const json = allowance.toJSON();

            expect(json).to.deep.equal({
                ownerAccountId: null,
                spenderAccountId: null,
                amount: null,
            });
        });
    });
});
