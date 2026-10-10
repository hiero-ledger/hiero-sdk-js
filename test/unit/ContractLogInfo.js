import { ContractLogInfo, ContractId } from "../../src/index.js";
import Long from "long";

describe("ContractLogInfo", function () {
    const contractId = ContractId.fromString("0.0.1234");
    const bloom = new Uint8Array([1, 2, 3, 4]);
    const topic = new Uint8Array([5, 6, 7, 8]);
    const data = new Uint8Array([9, 10, 11, 12]);

    /**
     * Builds a protobuf-shaped fixture matching the fields
     * `ContractLogInfo._fromProtobuf` reads: `contractID`, `bloom`, `topic`
     * and `data`. Note that the protobuf field is singular `topic`, while the
     * instance property is plural `topics`.
     *
     * @param {object} overrides
     * @returns {object}
     */
    function protoFixture(overrides = {}) {
        return {
            contractID: {
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                contractNum: Long.fromNumber(1234),
            },
            bloom,
            topic: [topic],
            data,
            ...overrides,
        };
    }

    describe("constructor", function () {
        it("should store all properties", function () {
            const info = new ContractLogInfo({
                contractId,
                bloom,
                topics: [topic],
                data,
            });

            expect(info.contractId).to.equal(contractId);
            expect(info.bloom).to.deep.equal(bloom);
            expect(info.topics).to.deep.equal([topic]);
            expect(info.data).to.deep.equal(data);
        });

        it("should freeze the object", function () {
            const info = new ContractLogInfo({
                contractId,
                bloom,
                topics: [topic],
                data,
            });

            expect(Object.isFrozen(info)).to.be.true;
        });
    });

    describe("_fromProtobuf", function () {
        it("should construct correctly from a fully populated proto", function () {
            const info = ContractLogInfo._fromProtobuf(protoFixture());

            expect(info.contractId.toString()).to.equal("0.0.1234");
            expect(info.bloom).to.deep.equal(bloom);
            expect(info.topics).to.have.lengthOf(1);
            expect(info.topics[0]).to.deep.equal(topic);
            expect(info.data).to.deep.equal(data);
        });

        it("should default bloom and data to empty Uint8Arrays when absent", function () {
            const info = ContractLogInfo._fromProtobuf({
                contractID: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    contractNum: Long.fromNumber(1234),
                },
            });

            expect(info.bloom).to.be.an.instanceof(Uint8Array);
            expect(info.bloom).to.have.lengthOf(0);
            expect(info.data).to.be.an.instanceof(Uint8Array);
            expect(info.data).to.have.lengthOf(0);
        });

        it("should default topics to an empty array when absent", function () {
            const info = ContractLogInfo._fromProtobuf({
                contractID: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    contractNum: Long.fromNumber(1234),
                },
            });

            expect(info.topics).to.deep.equal([]);
        });

        it("should treat explicit nulls the same as absent fields", function () {
            const info = ContractLogInfo._fromProtobuf(
                protoFixture({ bloom: null, topic: null, data: null }),
            );

            expect(info.bloom).to.have.lengthOf(0);
            expect(info.data).to.have.lengthOf(0);
            expect(info.topics).to.deep.equal([]);
        });

        it("should preserve multiple topics in order", function () {
            const second = new Uint8Array([13, 14]);
            const info = ContractLogInfo._fromProtobuf(
                protoFixture({ topic: [topic, second] }),
            );

            expect(info.topics).to.have.lengthOf(2);
            expect(info.topics[0]).to.deep.equal(topic);
            expect(info.topics[1]).to.deep.equal(second);
        });

        it("should default missing contractID components to 0", function () {
            const info = ContractLogInfo._fromProtobuf({
                contractID: { contractNum: Long.fromNumber(7) },
            });

            expect(info.contractId.toString()).to.equal("0.0.7");
        });
    });

    describe("_toProtobuf", function () {
        it("should produce the expected proto shape", function () {
            const info = new ContractLogInfo({
                contractId,
                bloom,
                topics: [topic],
                data,
            });

            const proto = info._toProtobuf();

            expect(proto.contractID).to.deep.equal(contractId._toProtobuf());
            expect(proto.bloom).to.deep.equal(bloom);
            expect(proto.topic).to.deep.equal([topic]);
            expect(proto.data).to.deep.equal(data);
        });

        it("should emit the singular `topic` key rather than `topics`", function () {
            const info = new ContractLogInfo({
                contractId,
                bloom,
                topics: [topic],
                data,
            });

            const proto = info._toProtobuf();

            expect(proto.topic).to.not.be.undefined;
            expect(proto.topics).to.be.undefined;
        });

        it("should round-trip through _fromProtobuf and _toProtobuf", function () {
            const original = ContractLogInfo._fromProtobuf(protoFixture());
            const roundTripped = ContractLogInfo._fromProtobuf(
                original._toProtobuf(),
            );

            expect(roundTripped.contractId.toString()).to.equal(
                original.contractId.toString(),
            );
            expect(roundTripped.bloom).to.deep.equal(original.bloom);
            expect(roundTripped.topics).to.deep.equal(original.topics);
            expect(roundTripped.data).to.deep.equal(original.data);
        });

        it("should round-trip empty defaults without losing the guards", function () {
            const sparse = ContractLogInfo._fromProtobuf({
                contractID: {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    contractNum: Long.fromNumber(1234),
                },
            });

            const roundTripped = ContractLogInfo._fromProtobuf(
                sparse._toProtobuf(),
            );

            expect(roundTripped.bloom).to.have.lengthOf(0);
            expect(roundTripped.data).to.have.lengthOf(0);
            expect(roundTripped.topics).to.deep.equal([]);
        });
    });
});
