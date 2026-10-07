import Long from "long";
import Duration from "../../src/Duration.js";
import { longFromOtherCopy } from "./utils/foreignLong.js";

describe("Duration", function () {
    it("accepts a number", function () {
        const duration = new Duration(7776000);

        expect(duration.seconds).to.be.instanceOf(Long);
        expect(duration.seconds.toString()).to.equal("7776000");
    });

    it("accepts a Long", function () {
        const duration = new Duration(Long.fromString("-9223372036854775807"));

        expect(duration.seconds.toString()).to.equal("-9223372036854775807");
    });

    it("keeps a Long from another copy of the long package exact", function () {
        const seconds = longFromOtherCopy("-9223372036854775807");
        expect(seconds instanceof Long).to.be.false;
        expect(Long.isLong(seconds)).to.be.true;

        const duration = new Duration(seconds);

        expect(duration.seconds).to.be.instanceOf(Long);
        expect(duration.seconds.toString()).to.equal("-9223372036854775807");
        expect(duration._toProtobuf().seconds.toString()).to.equal(
            "-9223372036854775807",
        );
    });
});
