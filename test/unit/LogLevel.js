import { LogLevel } from "../../src/exports.js";

describe("LogLevel", function () {
    it.each([
        ["silent", LogLevel.Silent],
        ["trace", LogLevel.Trace],
        ["debug", LogLevel.Debug],
        ["info", LogLevel.Info],
        ["warn", LogLevel.Warn],
        ["error", LogLevel.Error],
        ["fatal", LogLevel.Fatal],
    ])("maps %s to its level", function (name, level) {
        expect(LogLevel._fromString(name)).to.equal(level);
        expect(level.toString()).to.equal(name);
    });

    it("throws for an unknown level", function () {
        expect(() => LogLevel._fromString("verbose")).to.throw(
            "Unknown log level: verbose",
        );
    });

    it("returns Unknown log level (name) for a non-static instance", function () {
        expect(new LogLevel("verbose").toString()).to.equal(
            "Unknown log level (verbose)",
        );
    });
});
