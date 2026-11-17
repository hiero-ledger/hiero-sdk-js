import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import {
    FeeSchedule,
    TransactionFeeSchedule,
    RequestType,
    Timestamp,
} from "../../src/index.js";

describe("FeeSchedule", function () {
    const sampleExpiration = new Timestamp(1700000000, 0);

    function createSampleTransactionFeeSchedule() {
        return new TransactionFeeSchedule({
            hederaFunctionality: RequestType.CryptoTransfer,
        });
    }

    it("round-trips a CLPR functionality without changing the fee schedule bytes", function () {
        const bytes = HieroProto.proto.FeeSchedule.encode({
            transactionFeeSchedule: [
                {
                    hederaFunctionality: 117,
                    feeData: { nodedata: { constant: Long.fromNumber(10) } },
                    fees: [
                        {
                            subType: 0,
                            nodedata: { min: Long.fromNumber(1) },
                            networkdata: { max: Long.fromNumber(100) },
                            servicedata: { constant: Long.fromNumber(20) },
                        },
                    ],
                },
            ],
            expiryTime: { seconds: Long.fromString("1800000000") },
        }).finish();

        const schedule = FeeSchedule.fromBytes(bytes);
        const functionality =
            schedule.transactionFeeSchedule[0].hederaFunctionality;

        expect(functionality.toString()).to.equal(
            "ClprUpdateLedgerConfiguration",
        );
        expect(functionality.valueOf()).to.equal(117);
        expect(schedule.toBytes()).to.deep.equal(bytes);
    });

    describe("constructor", function () {
        it("should create an empty instance when no props provided", function () {
            const schedule = new FeeSchedule();
            expect(schedule.transactionFeeSchedule).to.be.undefined;
            expect(schedule.expirationTime).to.be.undefined;
        });

        it("should set provided properties correctly", function () {
            const txFeeSchedule = createSampleTransactionFeeSchedule();
            const schedule = new FeeSchedule({
                transactionFeeSchedule: [txFeeSchedule],
                expirationTime: sampleExpiration,
            });

            expect(schedule.transactionFeeSchedule).to.deep.equal([
                txFeeSchedule,
            ]);
            expect(schedule.expirationTime).to.equal(sampleExpiration);
        });

        it("should handle partial properties", function () {
            const schedule = new FeeSchedule({
                expirationTime: sampleExpiration,
            });

            expect(schedule.transactionFeeSchedule).to.be.undefined;
            expect(schedule.expirationTime).to.equal(sampleExpiration);
        });
    });

    describe("_fromProtobuf", function () {
        it("should correctly deserialize when all fields are present", function () {
            const txFeeSchedule = createSampleTransactionFeeSchedule();
            const proto = {
                transactionFeeSchedule: [txFeeSchedule._toProtobuf()],
                expiryTime: sampleExpiration._toProtobuf(),
            };

            const schedule = FeeSchedule._fromProtobuf(proto);
            expect(schedule.transactionFeeSchedule).to.have.lengthOf(1);
            expect(
                schedule.transactionFeeSchedule[0].hederaFunctionality.valueOf(),
            ).to.equal(RequestType.CryptoTransfer.valueOf());
            expect(schedule.expirationTime.seconds.toNumber()).to.equal(
                sampleExpiration.seconds.toNumber(),
            );
            expect(schedule.expirationTime.nanos.toNumber()).to.equal(
                sampleExpiration.nanos.toNumber(),
            );
        });

        it("should handle missing optional fields in protobuf", function () {
            const schedule = FeeSchedule._fromProtobuf({});
            expect(schedule.transactionFeeSchedule).to.be.undefined;
            expect(schedule.expirationTime).to.be.undefined;
        });
    });

    describe("_toProtobuf", function () {
        it("should correctly serialize when all fields are present", function () {
            const txFeeSchedule = createSampleTransactionFeeSchedule();
            const schedule = new FeeSchedule({
                transactionFeeSchedule: [txFeeSchedule],
                expirationTime: sampleExpiration,
            });

            const proto = schedule._toProtobuf();
            expect(proto.transactionFeeSchedule).to.have.lengthOf(1);
            expect(proto.expiryTime).to.deep.equal(
                sampleExpiration._toProtobuf(),
            );
        });

        it("should correctly serialize when fields are undefined", function () {
            const schedule = new FeeSchedule();
            const proto = schedule._toProtobuf();

            expect(proto.transactionFeeSchedule).to.be.undefined;
            expect(proto.expiryTime).to.be.undefined;
        });
    });

    describe("round-trip binary serialization", function () {
        it("should preserve all fields through toBytes() and fromBytes()", function () {
            const txFeeSchedule = createSampleTransactionFeeSchedule();
            const original = new FeeSchedule({
                transactionFeeSchedule: [txFeeSchedule],
                expirationTime: sampleExpiration,
            });

            const bytes = original.toBytes();
            const recovered = FeeSchedule.fromBytes(bytes);

            expect(recovered.toBytes()).to.deep.equal(bytes);
            expect(recovered.expirationTime.seconds.toNumber()).to.equal(
                original.expirationTime.seconds.toNumber(),
            );
            expect(recovered.expirationTime.nanos.toNumber()).to.equal(
                original.expirationTime.nanos.toNumber(),
            );
            expect(recovered.transactionFeeSchedule).to.have.lengthOf(1);
            expect(
                recovered.transactionFeeSchedule[0].hederaFunctionality.valueOf(),
            ).to.equal(RequestType.CryptoTransfer.valueOf());
        });

        it("should handle empty instance through toBytes() and fromBytes()", function () {
            const original = new FeeSchedule();
            const bytes = original.toBytes();
            const recovered = FeeSchedule.fromBytes(bytes);

            // Protobuf decodes a missing repeated field as an empty array []
            expect(recovered.transactionFeeSchedule).to.deep.equal([]);
            expect(recovered.expirationTime).to.be.undefined;
            expect(recovered.toBytes()).to.deep.equal(bytes);
        });
    });
});
