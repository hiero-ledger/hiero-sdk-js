// SPDX-License-Identifier: Apache-2.0

import * as nodeHex from "../../src/encoding/hex.js";
import * as browserHex from "../../src/encoding/hex.browser.js";
import * as nativeHex from "../../src/encoding/hex.native.js";
import AccountId from "../../src/account/AccountId.js";

const PLATFORMS = [
    ["hex.js", nodeHex],
    ["hex.browser.js", browserHex],
    ["hex.native.js", nativeHex],
];

describe("hex.decode on every platform", function () {
    for (const [name, hex] of PLATFORMS) {
        it(`${name} rejects an odd number of characters`, function () {
            expect(() => hex.decode("abc")).to.throw(/even number/);
        });

        it(`${name} rejects non-hexadecimal characters`, function () {
            expect(() => hex.decode("0g")).to.throw(/non-hexadecimal/);
            expect(() => hex.decode("0x12.4")).to.throw(/non-hexadecimal/);
        });

        it(`${name} still decodes valid hex`, function () {
            expect(Array.from(hex.decode("0x0aFF"))).to.deep.equal([10, 255]);
        });
    }
});

describe("AccountId.fromString with a 40 character entity ID", function () {
    // 40 characters makes AccountId read the text as an EVM address.
    it("throws instead of reading the dots as hex", function () {
        const text = "000000000000.000000000000.AaAAAAaAA0a0Aa";
        expect(text).to.have.length(40);
        expect(() => AccountId.fromString(text)).to.throw();
    });
});
