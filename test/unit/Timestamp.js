import Long from "long";
import { Timestamp } from "../../src/index.js";
import { longFromOtherCopy } from "./utils/foreignLong.js";

describe("Timestamp", function () {
    it("keeps a Long from another copy of the long package exact", function () {
        const seconds = longFromOtherCopy("-9223372036854775807");
        const nanos = longFromOtherCopy("999999999");
        expect(seconds instanceof Long).to.be.false;
        expect(Long.isLong(seconds)).to.be.true;

        const timestamp = new Timestamp(seconds, nanos);

        expect(timestamp.seconds).to.be.instanceOf(Long);
        expect(timestamp.seconds.toString()).to.equal("-9223372036854775807");
        expect(timestamp.nanos.toString()).to.equal("999999999");
        expect(timestamp._toProtobuf().seconds.toString()).to.equal(
            "-9223372036854775807",
        );
    });

    it("plusNanos works correctly", async function () {
        let timestamp = new Timestamp(0, 999999998);

        expect(timestamp.seconds.toInt()).to.be.eql(0);
        expect(timestamp.nanos.toInt()).to.be.eql(999999998);

        timestamp = timestamp.plusNanos(1);

        expect(timestamp.seconds.toInt()).to.be.eql(0);
        expect(timestamp.nanos.toInt()).to.be.eql(999999999);

        timestamp = timestamp.plusNanos(1);

        expect(timestamp.seconds.toInt()).to.be.eql(1);
        expect(timestamp.nanos.toInt()).to.be.eql(0);

        timestamp = timestamp.plusNanos(1);

        expect(timestamp.seconds.toInt()).to.be.eql(1);
        expect(timestamp.nanos.toInt()).to.be.eql(1);
    });

    it("fromDate()", function () {
        let timestamp = Timestamp.fromDate(999999998);

        expect(timestamp.seconds.toInt()).to.be.eql(0);
        expect(timestamp.nanos.toInt()).to.be.eql(999999998);
    });
});
