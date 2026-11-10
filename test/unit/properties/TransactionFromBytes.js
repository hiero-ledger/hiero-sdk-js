// SPDX-License-Identifier: Apache-2.0

import fc from "fast-check";
import * as HieroProto from "@hiero-ledger/proto";
import { Transaction } from "../../../src/exports.js";

const { proto, Writer } = HieroProto;

/**
 * Every case of a oneof, read from the generated protobuf code, so new
 * transaction types are covered without changing this file.
 *
 * @param {new () => object} Message
 * @param {string} oneof
 * @returns {string[]}
 */
function oneofCases(Message, oneof) {
    const cases = [];
    for (const key of Object.getOwnPropertyNames(Message.prototype)) {
        if (key === oneof || key === "constructor") {
            continue;
        }
        const message = new Message();
        message[key] = {};
        if (message[oneof] === key) {
            cases.push(key);
        }
    }
    return cases;
}

/**
 * The protobuf field number of a `TransactionBody.data` case, read from the
 * tag the encoder writes for it.
 *
 * @param {string} kase
 * @returns {number}
 */
function fieldNumber(kase) {
    const bytes = proto.TransactionBody.encode({ [kase]: {} }).finish();
    return HieroProto.Reader.create(bytes).uint32() >>> 3;
}

const TRANSACTION_CASES = oneofCases(proto.TransactionBody, "data");

/**
 * A body with a transaction ID and node account ID, so decoding gets past
 * the common fields to the code for each transaction type.
 */
const BODY = proto.TransactionBody.encode({
    transactionID: {
        accountID: { shardNum: 0, realmNum: 0, accountNum: 1001 },
        transactionValidStart: { seconds: 1700000000, nanos: 0 },
    },
    nodeAccountID: { shardNum: 0, realmNum: 0, accountNum: 3 },
    transactionFee: 100000000,
    transactionValidDuration: { seconds: 120 },
}).finish();

/**
 * Random protobuf content: a list of fields with valid wire encoding, whose
 * length-delimited values are random bytes or another random message, up to
 * `depth` levels deep. Random bytes on their own rarely decode, while this
 * content usually does, so it reaches the SDK's `_fromProtobuf()` code with
 * random field values.
 *
 * @param {number} depth
 * @returns {fc.Arbitrary<Uint8Array>}
 */
function protobufMessage(depth) {
    const number = fc.integer({ min: 1, max: 32 });
    const lengthDelimited =
        depth > 0
            ? fc.oneof(
                  fc.uint8Array({ maxLength: 32 }),
                  protobufMessage(depth - 1),
              )
            : fc.uint8Array({ maxLength: 32 });

    const field = fc.oneof(
        fc.tuple(number, fc.bigInt({ min: 0n, max: 2n ** 64n - 1n })).map(
            ([n, value]) =>
                /** @type {(writer: Writer) => Writer} */ (writer) =>
                    writer.uint32((n << 3) | 0).uint64(value.toString()),
        ),
        fc.tuple(number, fc.integer({ min: 0, max: 2 ** 32 - 1 })).map(
            ([n, value]) =>
                /** @type {(writer: Writer) => Writer} */ (writer) =>
                    writer.uint32((n << 3) | 5).fixed32(value),
        ),
        fc.tuple(number, fc.bigInt({ min: 0n, max: 2n ** 64n - 1n })).map(
            ([n, value]) =>
                /** @type {(writer: Writer) => Writer} */ (writer) =>
                    writer.uint32((n << 3) | 1).fixed64(value.toString()),
        ),
        fc.tuple(number, lengthDelimited).map(
            ([n, value]) =>
                /** @type {(writer: Writer) => Writer} */ (writer) =>
                    writer.uint32((n << 3) | 2).bytes(value),
        ),
    );

    return fc
        .array(field, { maxLength: 6 })
        .map((fields) =>
            fields
                .reduce((writer, write) => write(writer), Writer.create())
                .finish(),
        );
}

/**
 * Bytes of a `TransactionList` with one `SignedTransaction` that has the
 * given body bytes.
 *
 * @param {Uint8Array} bodyBytes
 * @returns {Uint8Array}
 */
function transactionList(bodyBytes) {
    return proto.TransactionList.encode({
        transactionList: [
            {
                signedTransactionBytes: proto.SignedTransaction.encode({
                    bodyBytes,
                    sigMap: { sigPair: [] },
                }).finish(),
            },
        ],
    }).finish();
}

/**
 * Bytes of a transaction whose body sets the given `TransactionBody.data`
 * case to the given content.
 *
 * @param {string} kase
 * @param {Uint8Array} content
 * @returns {Uint8Array}
 */
function transactionWithCase(kase, content) {
    return transactionList(
        Uint8Array.from([
            ...BODY,
            ...Writer.create()
                .uint32((fieldNumber(kase) << 3) | 2)
                .bytes(content)
                .finish(),
        ]),
    );
}

/**
 * Whether the error is a clean rejection of the input: an `Error` that isn't a
 * `TypeError`. The protobuf decoder reads strings strictly and throws a
 * `TypeError` for invalid UTF-8, which says what's wrong, so it counts too.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
function isCleanRejection(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    return (
        !(error instanceof TypeError) ||
        /encoded data was not valid/.test(error.message)
    );
}

/**
 * Decodes the bytes. Returns the transaction, or `null` when decoding rejects
 * them cleanly. Anything else is rethrown, so fast-check reports it with the
 * input that caused it.
 *
 * @param {Uint8Array} bytes
 * @returns {Transaction | null}
 */
function decode(bytes) {
    try {
        return Transaction.fromBytes(bytes);
    } catch (error) {
        if (!isCleanRejection(error)) {
            throw error;
        }
        return null;
    }
}

// A retry runs with a new seed and could hide a failing property, so these
// tests never retry (the browser config sets `retry: 1`). The timeout is how
// these tests check that decoding never hangs.
describe(
    "Transaction.fromBytes() properties",
    { retry: 0, timeout: 10000 },
    function () {
        it("returns a transaction or throws an Error for random bytes", function () {
            fc.assert(
                fc.property(fc.uint8Array({ maxLength: 256 }), (bytes) => {
                    decode(bytes);
                }),
            );
        });

        it("returns a transaction or throws an Error for a random body", function () {
            fc.assert(
                fc.property(fc.uint8Array({ maxLength: 256 }), (bodyBytes) => {
                    decode(transactionList(bodyBytes));
                }),
            );
        });

        describe("for each transaction type", function () {
            for (const kase of TRANSACTION_CASES) {
                describe(kase, function () {
                    it("returns a transaction or throws an Error for random content", function () {
                        fc.assert(
                            fc.property(protobufMessage(3), (content) => {
                                decode(transactionWithCase(kase, content));
                            }),
                        );
                    });

                    it("decodes what toBytes() writes for a decoded transaction", function () {
                        fc.assert(
                            fc.property(protobufMessage(3), (content) => {
                                const transaction = decode(
                                    transactionWithCase(kase, content),
                                );
                                if (transaction == null) {
                                    return;
                                }

                                expect(
                                    Transaction.fromBytes(
                                        transaction.toBytes(),
                                    ),
                                ).to.be.instanceOf(transaction.constructor);
                            }),
                        );
                    });
                });
            }
        });
    },
);
