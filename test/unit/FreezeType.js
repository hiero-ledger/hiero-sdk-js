import { FreezeType } from "../../src/exports.js";

describe("FreezeType", function () {
    it.each([
        [0, "UNKNOWN_FREEZE_TYPE", FreezeType.UnknownFreezeType],
        [1, "FREEZE_ONLY", FreezeType.FreezeOnly],
        [2, "PREPARE_UPGRADE", FreezeType.PrepareUpgrade],
        [3, "FREEZE_UPGRADE", FreezeType.FreezeUpgrade],
        [4, "FREEZE_ABORT", FreezeType.FreezeAbort],
        [5, "TELEMETRY_UPGRADE", FreezeType.TelemetryUpgrade],
    ])("maps code %i to %s", function (code, name, freezeType) {
        expect(FreezeType._fromCode(code)).to.equal(freezeType);
        expect(freezeType.toString()).to.equal(name);
        expect(freezeType.valueOf()).to.equal(code);
    });

    it("throws for an unknown code", function () {
        expect(() => FreezeType._fromCode(99)).to.throw(
            "(BUG) FreezeType.fromCode() does not handle code: 99",
        );
    });

    it("returns UNKNOWN (code) for a non-static instance", function () {
        expect(new FreezeType(99).toString()).to.equal("UNKNOWN (99)");
    });
});
