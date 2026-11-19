import {
    FeeSchedule,
    FeeSchedules,
    TransactionFeeSchedule,
    RequestType,
    Timestamp,
} from "../../src/index.js";

describe("FeeSchedules", function () {
    const sampleCurrentExpiration = new Timestamp(1700000000, 0);
    const sampleNextExpiration = new Timestamp(1700003600, 0);

    function createSampleFeeSchedule(expiration) {
        return new FeeSchedule({
            transactionFeeSchedule: [
                new TransactionFeeSchedule({
                    hederaFunctionality: RequestType.CryptoTransfer,
                }),
            ],
            expirationTime: expiration,
        });
    }

    describe("constructor", function () {
        it("should create an empty instance when no props provided", function () {
            const schedules = new FeeSchedules();
            expect(schedules.current).to.be.undefined;
            expect(schedules.next).to.be.undefined;
        });

        it("should set provided properties correctly", function () {
            const current = createSampleFeeSchedule(sampleCurrentExpiration);
            const next = createSampleFeeSchedule(sampleNextExpiration);
            const schedules = new FeeSchedules({
                currentFeeSchedule: current,
                nextFeeSchedule: next,
            });

            expect(schedules.current).to.equal(current);
            expect(schedules.next).to.equal(next);
        });

        it("should handle partial properties", function () {
            const current = createSampleFeeSchedule(sampleCurrentExpiration);
            const schedules = new FeeSchedules({
                currentFeeSchedule: current,
            });

            expect(schedules.current).to.equal(current);
            expect(schedules.next).to.be.undefined;
        });
    });

    describe("_fromProtobuf", function () {
        it("should correctly deserialize when all fields are present", function () {
            const current = createSampleFeeSchedule(sampleCurrentExpiration);
            const next = createSampleFeeSchedule(sampleNextExpiration);
            const proto = {
                currentFeeSchedule: current._toProtobuf(),
                nextFeeSchedule: next._toProtobuf(),
            };

            const schedules = FeeSchedules._fromProtobuf(proto);
            expect(schedules.current).to.be.instanceOf(FeeSchedule);
            expect(schedules.next).to.be.instanceOf(FeeSchedule);
            expect(
                schedules.current.expirationTime.seconds.toNumber(),
            ).to.equal(sampleCurrentExpiration.seconds.toNumber());
            expect(schedules.next.expirationTime.seconds.toNumber()).to.equal(
                sampleNextExpiration.seconds.toNumber(),
            );
        });

        it("should handle missing optional fields in protobuf", function () {
            const schedules = FeeSchedules._fromProtobuf({});
            expect(schedules.current).to.be.undefined;
            expect(schedules.next).to.be.undefined;
        });
    });

    describe("_toProtobuf", function () {
        it("should correctly serialize when all fields are present", function () {
            const current = createSampleFeeSchedule(sampleCurrentExpiration);
            const next = createSampleFeeSchedule(sampleNextExpiration);
            const schedules = new FeeSchedules({
                currentFeeSchedule: current,
                nextFeeSchedule: next,
            });

            const proto = schedules._toProtobuf();
            expect(proto.currentFeeSchedule).to.deep.equal(
                current._toProtobuf(),
            );
            expect(proto.nextFeeSchedule).to.deep.equal(next._toProtobuf());
        });

        it("should correctly serialize when fields are undefined", function () {
            const schedules = new FeeSchedules();
            const proto = schedules._toProtobuf();

            expect(proto.currentFeeSchedule).to.be.undefined;
            expect(proto.nextFeeSchedule).to.be.undefined;
        });
    });

    describe("round-trip binary serialization", function () {
        it("should preserve all fields through toBytes() and fromBytes()", function () {
            const current = createSampleFeeSchedule(sampleCurrentExpiration);
            const next = createSampleFeeSchedule(sampleNextExpiration);
            const original = new FeeSchedules({
                currentFeeSchedule: current,
                nextFeeSchedule: next,
            });

            const bytes = original.toBytes();
            const recovered = FeeSchedules.fromBytes(bytes);

            expect(recovered.toBytes()).to.deep.equal(bytes);
            expect(
                recovered.current.expirationTime.seconds.toNumber(),
            ).to.equal(original.current.expirationTime.seconds.toNumber());
            expect(recovered.next.expirationTime.seconds.toNumber()).to.equal(
                original.next.expirationTime.seconds.toNumber(),
            );
            expect(recovered.current.transactionFeeSchedule).to.have.lengthOf(
                1,
            );
            expect(recovered.next.transactionFeeSchedule).to.have.lengthOf(1);
        });

        it("should handle empty instance through toBytes() and fromBytes()", function () {
            const original = new FeeSchedules();
            const bytes = original.toBytes();
            const recovered = FeeSchedules.fromBytes(bytes);

            expect(recovered.current).to.be.undefined;
            expect(recovered.next).to.be.undefined;
            expect(recovered.toBytes()).to.deep.equal(bytes);
        });
    });
});
