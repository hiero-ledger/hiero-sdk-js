import Long from "long";
import { Timestamp } from "../../src/index.js";
import Cache from "../../src/Cache.js";
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

    describe("generate", function () {
        // every test starts a minute later than the last one, so the
        // timestamps of one test never collide with those of another
        let NOW = Math.floor(Date.now() / 1000) * 1000;

        beforeEach(function () {
            NOW += 60000;
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
        });

        afterEach(function () {
            vi.useRealTimers();
            vi.restoreAllMocks();
            Cache.setTimeDrift(0);
        });

        it("does not add jitter when a collision is retried with hasJitter = false", function () {
            // the first two calls use random 0 for the nanos, the third
            // call (the retry) gets a different value
            vi.spyOn(Math, "random")
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(0.5);

            const first = Timestamp.generate(false);
            const second = Timestamp.generate(false);

            expect(first.seconds.toNumber()).to.equal(NOW / 1000);
            expect(second.seconds.toNumber()).to.equal(NOW / 1000);
            expect(second.toString()).to.not.equal(first.toString());
        });

        it("forgets generated timestamps once the window has passed", function () {
            vi.spyOn(Math, "random").mockReturnValue(0.5);

            const first = Timestamp.generate(false);

            // move the clock forward and the drift back so the same
            // timestamp is generated again
            const elapsedSeconds = 25;
            vi.setSystemTime(NOW + elapsedSeconds * 1000);
            Cache.setTimeDrift(-elapsedSeconds);

            // would recurse forever if the old entry was still remembered
            const again = Timestamp.generate(false);

            expect(again.toString()).to.equal(first.toString());
        });

        it("still detects a collision inside the window", function () {
            const random = vi
                .spyOn(Math, "random")
                .mockReturnValueOnce(0.5)
                .mockReturnValueOnce(0.5)
                .mockReturnValueOnce(0.25);

            const first = Timestamp.generate(false);
            const second = Timestamp.generate(false);

            expect(second.toString()).to.not.equal(first.toString());
            expect(random).toHaveBeenCalledTimes(3);
        });
    });
});
