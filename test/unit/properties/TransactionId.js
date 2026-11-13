// SPDX-License-Identifier: Apache-2.0

import fc from "fast-check";
import Long from "long";
import AccountId from "../../../src/account/AccountId.js";
import TransactionId from "../../../src/transaction/TransactionId.js";
import Timestamp from "../../../src/Timestamp.js";

/**
 * Any value a shard, realm, or entity number can hold: a non-negative signed
 * 64-bit integer.
 */
const int64 = fc
    .bigInt({ min: 0n, max: 2n ** 63n - 1n })
    .map((value) => Long.fromString(value.toString()));

/**
 * Valid nanoseconds: 0 to 999,999,999
 */
const nanos = fc.integer({ min: 0, max: 999999999 });

/**
 * A valid TransactionId arbitrary.
 */
const transactionId = fc
    .tuple(
        int64, // shard
        int64, // realm
        int64, // num
        int64, // seconds
        nanos, // nanos
        fc.boolean(), // scheduled
        fc.option(fc.nat()), // nonce (optional)
    )
    .map(([shard, realm, num, seconds, nanos, scheduled, nonce]) => {
        const accountId = new AccountId(shard, realm, num);
        const validStart = new Timestamp(seconds, nanos);
        const id = TransactionId.withValidStart(accountId, validStart);

        if (scheduled) {
            id.setScheduled(true);
        }

        if (nonce != null) {
            id.setNonce(nonce);
        }

        return id;
    });

/**
 * Compare two TransactionIds for equality.
 */
function expectTransactionId(actual, expected) {
    expect(actual.accountId.shard.toString()).to.equal(
        expected.accountId.shard.toString(),
    );
    expect(actual.accountId.realm.toString()).to.equal(
        expected.accountId.realm.toString(),
    );
    expect(actual.accountId.num.toString()).to.equal(
        expected.accountId.num.toString(),
    );
    expect(actual.validStart.seconds.toString()).to.equal(
        expected.validStart.seconds.toString(),
    );
    expect(actual.validStart.nanos.toString()).to.equal(
        expected.validStart.nanos.toString(),
    );
    expect(actual.scheduled).to.equal(expected.scheduled);

    // Nonce of 0 is treated as null by the constructor
    const expectedNonce =
        expected.nonce != null && !expected.nonce.equals(0)
            ? expected.nonce
            : null;

    if (expectedNonce != null) {
        expect(actual.nonce).to.not.be.null;
        expect(actual.nonce.toString()).to.equal(expectedNonce.toString());
    } else {
        expect(actual.nonce).to.be.null;
    }
}

// A retry runs with a new seed and could hide a failing property, so these
// tests never retry (the browser config sets `retry: 1`).
describe("TransactionId properties", { retry: 0 }, function () {
    it("fromString() reads back what toString() writes", function () {
        fc.assert(
            fc.property(transactionId, (id) => {
                const text = id.toString();
                const accountIdText = id.accountId.toString();

                // TODO(#4671): AccountId.fromString() reads any
                // 40-character string as an EVM address, so it cannot
                // read back an ID whose account ID part is 40 characters long.
                // Remove this once that is fixed.
                fc.pre(accountIdText.length !== 40);

                const decoded = TransactionId.fromString(text);

                expectTransactionId(decoded, id);
            }),
        );
    });

    it("fromBytes() reads back what toBytes() writes", function () {
        fc.assert(
            fc.property(transactionId, (id) => {
                const bytes = id.toBytes();
                const decoded = TransactionId.fromBytes(bytes);

                expectTransactionId(decoded, id);
            }),
        );
    });

    it("fromString() either throws or returns an ID that survives a round trip", function () {
        fc.assert(
            fc.property(fc.string(), (text) => {
                let id;
                try {
                    id = TransactionId.fromString(text);
                } catch (error) {
                    // Expected for malformed strings - fromString() should throw
                    expect(error).to.be.an.instanceOf(Error);
                    return;
                }

                const roundTripped = TransactionId.fromString(id.toString());
                expectTransactionId(roundTripped, id);
            }),
        );
    });
});
