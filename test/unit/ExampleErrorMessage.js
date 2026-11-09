// SPDX-License-Identifier: Apache-2.0

import { errorMessage } from "../../examples/error-message.js";

describe("example error messages", function () {
    it("preserves Error messages and primitive thrown values", function () {
        for (const [value, expected] of [
            [new Error("node unavailable"), "node unavailable"],
            ["request failed", "request failed"],
            [42, "42"],
            [false, "false"],
            [null, "null"],
            [undefined, "undefined"],
            [12n, "12"],
        ]) {
            expect(errorMessage(value)).to.equal(expected);
        }
    });

    it("includes the details of thrown objects", function () {
        expect(errorMessage({ code: "BUSY", retry: true })).to.equal(
            '{"code":"BUSY","retry":true}',
        );
    });

    it("does not replace circular or non-JSON errors with a stringify failure", function () {
        const circular = {};
        circular.self = circular;
        for (const value of [
            circular,
            { toJSON: () => undefined },
            {
                toJSON() {
                    throw new Error("cannot serialize");
                },
            },
        ]) {
            expect(errorMessage(value)).to.equal("[object Object]");
        }
    });
});
