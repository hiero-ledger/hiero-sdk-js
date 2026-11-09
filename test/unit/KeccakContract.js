// SPDX-License-Identifier: Apache-2.0

import { keccak256 as oracle, toUtf8Bytes } from "ethers";
import { keccak256 } from "../../src/cryptography/keccak.js";

describe("Keccak UTF-8 and rate boundaries", function () {
    for (const message of [
        "",
        "café",
        "漢字",
        "😀",
        "a".repeat(135),
        "a".repeat(136),
        "a".repeat(137),
        "😀".repeat(100),
    ]) {
        it(`matches an independent implementation for ${
            toUtf8Bytes(message).length
        } UTF-8 bytes`, function () {
            expect(keccak256(message)).to.equal(oracle(toUtf8Bytes(message)));
        });
    }

    for (const length of [0, 135, 136, 137, 272]) {
        it(`matches an independent implementation for ${length} raw bytes`, function () {
            const input = `0x${"ab".repeat(length)}`;
            expect(keccak256(input)).to.equal(oracle(input));
        });
    }
});
