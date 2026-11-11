// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import BadMnemonicError from "../../src/BadMnemonicError.js";
import BadMnemonicReason from "../../src/BadMnemonicReason.js";

describe("BadMnemonicError", function () {
    const mnemonic = {};

    it("should set the message and reason for BadLength", function () {
        const error = new BadMnemonicError(
            mnemonic,
            BadMnemonicReason.BadLength,
            [],
        );

        expect(error.message).to.equal(
            "invalid mnemonic: mnemonic is of an unexpected number of words",
        );
        expect(error.reason).to.equal(BadMnemonicReason.BadLength);
        expect(error.mnemonic).to.equal(mnemonic);
        expect(error.unknownWordIndices).to.deep.equal([]);
    });

    it("should set the message and reason for ChecksumMismatch", function () {
        const error = new BadMnemonicError(
            mnemonic,
            BadMnemonicReason.ChecksumMismatch,
            [],
        );

        expect(error.message).to.equal(
            "invalid mnemonic: checksum byte in mnemonic did not match the rest of the mnemonic",
        );
        expect(error.reason).to.equal(BadMnemonicReason.ChecksumMismatch);
        expect(error.mnemonic).to.equal(mnemonic);
        expect(error.unknownWordIndices).to.deep.equal([]);
    });

    it("should set the message, reason and unknownWordIndices for UnknownWords", function () {
        const unknownWordIndices = [2, 5, 11];
        const error = new BadMnemonicError(
            mnemonic,
            BadMnemonicReason.UnknownWords,
            unknownWordIndices,
        );

        expect(error.message).to.equal(
            "invalid mnemonic: mnemonic contained words that are not in the standard word list",
        );
        expect(error.reason).to.equal(BadMnemonicReason.UnknownWords);
        expect(error.mnemonic).to.equal(mnemonic);
        expect(error.unknownWordIndices).to.deep.equal(unknownWordIndices);
    });

    it("should throw an Error for an unknown reason", function () {
        const createError = () =>
            new BadMnemonicError(mnemonic, "NotARealReason", []);

        expect(createError).to.throw(
            Error,
            "unexpected value NotARealReason for 'reason'",
        );
    });

    it("should be an instance of BadMnemonicError and Error", function () {
        const error = new BadMnemonicError(
            mnemonic,
            BadMnemonicReason.BadLength,
            [],
        );

        expect(error).to.be.instanceOf(BadMnemonicError);
        expect(error).to.be.instanceOf(Error);
        expect(error.name).to.equal("BadMnemonicError");
    });
});
