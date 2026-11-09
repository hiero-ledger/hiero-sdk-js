// SPDX-License-Identifier: Apache-2.0

import {
    FileUpdateTransaction,
    KeyList,
    PrivateKey,
    Transaction,
} from "../../src/index.js";

describe("File update wire contract", function () {
    const key = PrivateKey.fromStringED25519("11".repeat(32)).publicKey;

    it("preserves constructor fields, UTF-8 content, keys and expiry through bytes", function () {
        const expiration = new Date("2030-01-01T00:00:00Z");
        const transaction = new FileUpdateTransaction({
            fileId: "0.0.123",
            keys: new KeyList([key]),
            expirationTime: expiration,
            contents: "A file with UTF-8: café",
            fileMemo: "release fixture",
        });
        const restored = Transaction.fromBytes(transaction.toBytes());
        expect(restored).to.be.instanceOf(FileUpdateTransaction);
        expect(restored.fileId.toString()).to.equal("0.0.123");
        expect(restored.keys.map(String)).to.deep.equal([key.toString()]);
        expect(restored.expirationTime.toDate().toISOString()).to.equal(
            expiration.toISOString(),
        );
        expect(restored.contents).to.deep.equal(
            new TextEncoder().encode("A file with UTF-8: café"),
        );
        expect(restored.fileMemo).to.equal("release fixture");
        expect(restored.toBytes()).to.deep.equal(transaction.toBytes());
    });

    it("keeps explicit empty contents and key lists distinct from omitted fields", function () {
        const transaction = new FileUpdateTransaction({
            contents: new Uint8Array(),
            keys: [],
        });
        const restored = Transaction.fromBytes(transaction.toBytes());
        expect(restored.contents).to.have.length(0);
        expect(restored.keys).to.deep.equal([]);
        const omitted = Transaction.fromBytes(
            new FileUpdateTransaction().toBytes(),
        );
        expect(omitted.keys).to.be.null;
    });

    it("rejects threshold file keys before serialization", function () {
        expect(
            () => new FileUpdateTransaction({ keys: new KeyList([key], 1) }),
        ).to.throw("Cannot set threshold key as file key");
    });
});
