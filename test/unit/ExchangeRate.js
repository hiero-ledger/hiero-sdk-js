import { ExchangeRate } from "../../src/index.js";

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
});
