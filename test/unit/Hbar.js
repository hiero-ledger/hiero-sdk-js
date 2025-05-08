import { Hbar, HbarUnit } from "../../src/index.js";

describe("Hbar", function () {
    it("should pass regex, convert, and reverse [to|from]String", function () {
        let check = [
            ["0 ℏ", "0 tℏ"],
            ["1 tℏ", "1 tℏ"],
            ["1 μℏ", "100 tℏ"],
            ["1 mℏ", "0.001 ℏ"],
            ["1 ℏ", "1 ℏ"],
            ["1 kℏ", "1000 ℏ"],
            ["1 Mℏ", "1000000 ℏ"],
            ["1 Gℏ", "1000000000 ℏ"],

            ["+0 ℏ", "0 tℏ"],
            ["+1 tℏ", "1 tℏ"],
            ["+1 μℏ", "100 tℏ"],
            ["+1 mℏ", "0.001 ℏ"],
            ["+1 ℏ", "1 ℏ"],
            ["+1 kℏ", "1000 ℏ"],
            ["+1 Mℏ", "1000000 ℏ"],
            ["+1 Gℏ", "1000000000 ℏ"],

            ["-0 ℏ", "0 tℏ"],
            ["-1 tℏ", "-1 tℏ"],
            ["-1 μℏ", "-100 tℏ"],
            ["-1 mℏ", "-0.001 ℏ"],
            ["-1 ℏ", "-1 ℏ"],
            ["-1 kℏ", "-1000 ℏ"],
            ["-1 Mℏ", "-1000000 ℏ"],
            ["-1 Gℏ", "-1000000000 ℏ"],
        ];

        check.forEach((element) => {
            expect(element[1]).to.equal(Hbar.fromString(element[0]).toString());
        });
    });

    it("should not pass regex", function () {
        let check = [
            "1 ",
            "-1 ",
            "+1 ",
            "1.151 ",
            "-1.151 ",
            "+1.151 ",
            "1.",
            "1.151.",
            ".1",
            "1.151 uℏ",
            "1.151 h",
        ];

        check.forEach((element) => {
            try {
                Hbar.fromString(element);
                throw new Error();
            } catch (error) {
                let result = error
                    .toString()
                    .includes("invalid argument provided");
                if (!result) {
                    throw new Error(
                        "Expected Hbar.fromString(" +
                            element +
                            ") to throw an error.",
                    );
                }
                expect(result).to.be.true;
            }
        });
    });

    it("should append default unit Hbar", function () {
        /**
         * fromString strips + and should append the default Hbar unit when none are present
         */
        const unit = HbarUnit.Hbar._symbol;
        let check = ["1", "-1", "+1", "1.151", "-1.151", "+1.151"];

        check.forEach((element) => {
            expect(element.replace("+", "") + " " + unit).to.equal(
                Hbar.fromString(element).toString(),
            );
        });
    });

    it('should throw error "Hbar in tinybars contains decimals"', function () {
        let check = ["1.151 tℏ", "1.151 μℏ", "1.151", "-1.151", "+1.151"];

        check.forEach((element) => {
            try {
                Hbar.fromString(element);
            } catch (error) {
                expect(
                    error
                        .toString()
                        .includes("Hbar in tinybars contains decimals"),
                ).to.equal(true);
            }
        });
    });
});
