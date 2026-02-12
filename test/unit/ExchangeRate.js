import { ExchangeRate } from "../../src/index.js";
import Long from "long";

describe("ExchangeRate", function () {
    it("fromBytes", function () {
        const date = new Date("February 24, 2022 15:00:00 UTC");
        const exchangeRate = ExchangeRate._fromProtobuf(
            new ExchangeRate({
                expirationTime: date,
            })._toProtobuf(),
        );

        expect(exchangeRate.expirationTime.toString()).to.be.equal(
            date.toString(),
        );
    });

    it("_fromProtobuf decodes expirationTime.seconds beyond 32-bit range (e.g. 2125) correctly", function () {
        // Unix seconds for 2125-01-01 00:00:00 UTC (> 2^31-1); .toInt() would overflow
        const seconds2125 = 4897296000;
        const rate = ExchangeRate._fromProtobuf({
            hbarEquiv: 1,
            centEquiv: 12,
            expirationTime: { seconds: Long.fromNumber(seconds2125) },
        });
        expect(rate.expirationTime.getUTCFullYear()).to.equal(2125);
        expect(rate.hbars).to.equal(1);
        expect(rate.cents).to.equal(12);
    });
});
