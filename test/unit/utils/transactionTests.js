// SPDX-License-Identifier: Apache-2.0

/**
 * Registers the tests every transaction and query class needs, from a short
 * description of the class's fields. A test file calls one of these inside
 * its own `describe()` block and keeps only the tests for behaviour that is
 * specific to the class.
 *
 * Each field is an object with:
 *
 * - `name`: the field's name. The setter, getter and constructor prop default
 *   to `set<Name>()`, `<name>` and `props.<name>`.
 * - `value`: the value the tests set.
 * - `expected` (optional): the value the getter should return when it isn't
 *   `value`, for example when the setter rounds or converts it.
 * - `setter`, `getter`, `prop` (optional): names that don't follow the
 *   defaults. Set `prop` to `null` when the constructor doesn't take the field.
 * - `comparable` (optional): turns a value into something `deep.equal` can
 *   compare. By default, values are compared by `toString()`, arrays item by
 *   item, and bytes as arrays of numbers.
 * - `entityId` (optional): `true` when the field holds an entity ID, or a
 *   list of them, whose checksum `_validateChecksums()` must validate.
 * - `skip` (optional): checks to skip for this field, with the reason, for
 *   example `{ roundTrip: "TODO(#4654): fromBytes() drops the bytecode" }`.
 *   The keys are `props`, `setter`, `frozen`, `roundTrip` and `checksum`.
 *
 * `options.create` builds the object every test starts from, for a class that
 * needs a field set before it can be frozen or encoded. It defaults to
 * `new TransactionClass()` or `new QueryClass()`.
 *
 * `options.skip` skips a whole group of checks in the same way. The keys are
 * the field checks above, plus `execute`, `logId`, `dataCase` for
 * transactions and `responseHeader` for queries. A skipped check shows up in
 * the test output as skipped, with the reason in its name.
 *
 * @example
 * describeTransaction(TokenBurnTransaction, {
 *     dataCase: "tokenBurn",
 *     execute: ["token", "burnToken"],
 *     fields: [
 *         { name: "tokenId", value: new TokenId(0, 0, 5005), entityId: true },
 *         { name: "amount", value: Long.fromNumber(10) },
 *         { name: "serials", value: [Long.fromNumber(1)] },
 *     ],
 * });
 *
 * @example
 * describeQuery(AccountInfoQuery, {
 *     queryCase: "cryptoGetInfo",
 *     execute: ["crypto", "getAccountInfo"],
 *     fields: [
 *         { name: "accountId", value: new AccountId(0, 0, 5005), entityId: true },
 *     ],
 * });
 */

// Classes come from exports.js, not index.js: the browser config only
// rewrites `../../src/index.js` to the browser entry point, and exports.js
// also fills the registries `Transaction.fromBytes()` and `Query.fromBytes()`
// read.
import {
    AccountId,
    Query,
    Timestamp,
    Transaction,
    TransactionId,
    WebClient,
} from "../../../src/exports.js";
import BadEntityIdError from "../../../src/BadEntityIdError.js";

/**
 * @typedef {object} Field
 * @property {string} name
 * @property {any} value
 * @property {any} [expected]
 * @property {string} [setter]
 * @property {string} [getter]
 * @property {string | null} [prop]
 * @property {(value: any) => any} [comparable]
 * @property {boolean} [entityId]
 * @property {Partial<Record<"props" | "setter" | "frozen" | "roundTrip" | "checksum", string>>} [skip]
 */

/**
 * @typedef {object} TransactionOptions
 * @property {string} dataCase the `TransactionBody.data` case
 * @property {[string, string]} execute the channel service and method
 * @property {Field[]} fields
 * @property {() => any} [create] builds the transaction the tests start from
 * @property {Record<string, string>} [skip]
 */

/**
 * @typedef {object} QueryOptions
 * @property {string} queryCase the `Response.response` case
 * @property {[string, string]} execute the channel service and method
 * @property {Field[]} fields
 * @property {() => any} [create] builds the query the tests start from
 * @property {Record<string, string>} [skip]
 */

const VALID_START = new Timestamp(1596210382, 0);
const TRANSACTION_ID = TransactionId.withValidStart(
    new AccountId(0, 0, 1001),
    VALID_START,
);
const NODE_ACCOUNT_ID = new AccountId(0, 0, 3);

/**
 * `0.0.123` with its mainnet checksum. It passes with a mainnet client and
 * throws a `BadEntityIdError` with any other client.
 */
const CHECKSUM_NUM = 123;
const MAINNET_CHECKSUM = "vfmkw";

/**
 * @param {string} name
 * @returns {string}
 */
function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * @param {Field} field
 * @returns {Required<Pick<Field, "setter" | "getter" | "prop" | "comparable">> & Field}
 */
function withDefaults(field) {
    return {
        setter: `set${capitalize(field.name)}`,
        getter: field.name,
        prop: field.name,
        comparable,
        ...field,
    };
}

/**
 * @param {any} value
 * @returns {any}
 */
function comparable(value) {
    if (value == null) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(comparable);
    }
    if (value instanceof Uint8Array) {
        return Array.from(value);
    }
    if (
        typeof value === "object" &&
        value.toString !== Object.prototype.toString
    ) {
        return value.toString();
    }
    return value;
}

/**
 * @param {Field} field
 * @param {any} actual
 */
function expectField(field, actual) {
    const { comparable, expected, value } = withDefaults(field);
    expect(comparable(actual), field.name).to.deep.equal(
        comparable(expected !== undefined ? expected : value),
    );
}

/**
 * The reason a check is skipped: the field's own reason, else the reason for
 * the whole group. Only keys set on the objects count, so a key such as
 * `constructor` isn't read from `Object.prototype`.
 *
 * @param {Record<string, string>} groupSkip
 * @param {Record<string, string> | undefined} fieldSkip
 * @param {string} key
 * @returns {string | undefined}
 */
function reason(groupSkip, fieldSkip, key) {
    if (fieldSkip != null && Object.hasOwn(fieldSkip, key)) {
        return fieldSkip[key];
    }
    return Object.hasOwn(groupSkip, key) ? groupSkip[key] : undefined;
}

/**
 * Registers `it(name, fn)`, or `it.skip()` with the reason in the name.
 *
 * @param {string} name
 * @param {string | undefined} reason
 * @param {() => unknown} fn
 */
function check(name, reason, fn) {
    if (reason != null) {
        it.skip(`${name} (skipped: ${reason})`, fn);
    } else {
        it(name, fn);
    }
}

/**
 * The same kind of entity ID as the field's value, `0.0.123` with its mainnet
 * checksum. Setting `_checksum` works for every ID class, including
 * `AccountId`, whose `fromString()` doesn't keep the checksum.
 *
 * @param {Field} field
 * @returns {any}
 */
function idWithMainnetChecksum(field) {
    const sample = Array.isArray(field.value) ? field.value[0] : field.value;
    const id = new sample.constructor(0, 0, CHECKSUM_NUM);
    id._checksum = MAINNET_CHECKSUM;
    return Array.isArray(field.value) ? [id] : id;
}

/**
 * @param {(client: WebClient) => void} validate
 */
function expectChecksumValidated(validate) {
    const mainnet = WebClient.forMainnet({ scheduleNetworkUpdate: false });
    const testnet = WebClient.forTestnet({ scheduleNetworkUpdate: false });

    try {
        expect(() => validate(mainnet)).to.not.throw();
        expect(() => validate(testnet)).to.throw(BadEntityIdError);
    } finally {
        mainnet.close();
        testnet.close();
    }
}

/**
 * @param {any} transactionOrQuery one with no fields set
 */
function expectUnsetIdsSkipped(transactionOrQuery) {
    const testnet = WebClient.forTestnet({ scheduleNetworkUpdate: false });

    try {
        expect(() =>
            transactionOrQuery._validateChecksums(testnet),
        ).to.not.throw();
    } finally {
        testnet.close();
    }
}

/**
 * Registers the channel stub check: `_execute()` calls the given method with
 * the request and returns its response.
 *
 * @param {() => any} create
 * @param {[string, string]} execute
 * @param {string | undefined} reason
 */
function checkExecute(create, [service, method], reason) {
    check(`_execute() calls ${service}.${method}()`, reason, async function () {
        const request = {};
        const response = {};
        const calls = [];
        const channel = {
            [service]: {
                [method]: (/** @type {unknown} */ arg) => {
                    calls.push(arg);
                    return Promise.resolve(response);
                },
            },
        };

        expect(await create()._execute(channel, request)).to.equal(response);
        expect(calls).to.deep.equal([request]);
    });
}

/**
 * Registers the tests every transaction class needs. See the comment at the
 * top of this file for the options.
 *
 * @param {new (props?: object) => any} TransactionClass
 * @param {TransactionOptions} options
 */
export function describeTransaction(TransactionClass, options) {
    const skip = options.skip ?? {};
    const fields = options.fields.map(withDefaults);
    const create = options.create ?? (() => new TransactionClass());

    function withAllFields() {
        const transaction = create();
        for (const field of fields) {
            transaction[field.setter](field.value);
        }
        return transaction;
    }

    /**
     * @param {any} transaction
     * @returns {any}
     */
    function freeze(transaction) {
        return transaction
            .setNodeAccountIds([NODE_ACCOUNT_ID])
            .setTransactionId(TRANSACTION_ID)
            .freeze();
    }

    describe(`${TransactionClass.name} standard tests`, function () {
        describeProps(TransactionClass, fields, skip);

        describe("setters", function () {
            for (const field of fields) {
                check(
                    `${field.setter}() sets ${field.name} and returns the transaction`,
                    reason(skip, field.skip, "setter"),
                    function () {
                        const transaction = create();

                        expect(transaction[field.setter](field.value)).to.equal(
                            transaction,
                        );
                        expectField(field, transaction[field.getter]);
                    },
                );

                check(
                    `${field.setter}() throws once the transaction is frozen`,
                    reason(skip, field.skip, "frozen"),
                    function () {
                        const transaction = freeze(withAllFields());

                        expect(() =>
                            transaction[field.setter](field.value),
                        ).to.throw("transaction is immutable");
                    },
                );
            }
        });

        describe("toBytes() and fromBytes()", function () {
            it("returns the same class with the same transaction ID", function () {
                const transaction = freeze(withAllFields());

                const decoded = Transaction.fromBytes(transaction.toBytes());

                expect(decoded).to.be.instanceOf(TransactionClass);
                expect(decoded.transactionId.toString()).to.equal(
                    TRANSACTION_ID.toString(),
                );
            });

            for (const field of fields) {
                check(
                    `keeps ${field.name}`,
                    reason(skip, field.skip, "roundTrip"),
                    function () {
                        const transaction = freeze(withAllFields());

                        const decoded = Transaction.fromBytes(
                            transaction.toBytes(),
                        );

                        expectField(field, decoded[field.getter]);
                    },
                );
            }
        });

        describeChecksums(create, fields, skip);

        checkExecute(
            create,
            options.execute,
            reason(skip, undefined, "execute"),
        );

        check(
            `_getTransactionDataCase() returns ${options.dataCase}`,
            reason(skip, undefined, "dataCase"),
            function () {
                expect(create()._getTransactionDataCase()).to.equal(
                    options.dataCase,
                );
            },
        );

        check(
            "_getLogId() returns the class name and valid start",
            reason(skip, undefined, "logId"),
            function () {
                const transaction = freeze(create());

                expect(transaction._getLogId()).to.equal(
                    `${TransactionClass.name}:${VALID_START.toString()}`,
                );
            },
        );
    });
}

/**
 * Registers the tests every query class needs. See the comment at the top of
 * this file for the options.
 *
 * @param {new (props?: object) => any} QueryClass
 * @param {QueryOptions} options
 */
export function describeQuery(QueryClass, options) {
    const skip = options.skip ?? {};
    const fields = options.fields.map(withDefaults);
    const create = options.create ?? (() => new QueryClass());

    function withAllFields() {
        const query = create();
        for (const field of fields) {
            query[field.setter](field.value);
        }
        return query;
    }

    describe(`${QueryClass.name} standard tests`, function () {
        describeProps(QueryClass, fields, skip);

        describe("setters", function () {
            for (const field of fields) {
                check(
                    `${field.setter}() sets ${field.name} and returns the query`,
                    reason(skip, field.skip, "setter"),
                    function () {
                        const query = create();

                        expect(query[field.setter](field.value)).to.equal(
                            query,
                        );
                        expectField(field, query[field.getter]);
                    },
                );
            }
        });

        describe("toBytes() and fromBytes()", function () {
            it("returns the same class", function () {
                const decoded = Query.fromBytes(withAllFields().toBytes());

                expect(decoded).to.be.instanceOf(QueryClass);
            });

            for (const field of fields) {
                check(
                    `keeps ${field.name}`,
                    reason(skip, field.skip, "roundTrip"),
                    function () {
                        const decoded = Query.fromBytes(
                            withAllFields().toBytes(),
                        );

                        expectField(field, decoded[field.getter]);
                    },
                );
            }
        });

        describeChecksums(create, fields, skip);

        checkExecute(
            create,
            options.execute,
            reason(skip, undefined, "execute"),
        );

        check(
            `_mapResponseHeader() reads the ${options.queryCase} header`,
            reason(skip, undefined, "responseHeader"),
            function () {
                const header = { cost: 1 };

                expect(
                    create()._mapResponseHeader({
                        [options.queryCase]: { header },
                    }),
                ).to.equal(header);
            },
        );

        describe("_getLogId()", function () {
            check(
                "returns the class name and the payment transaction's valid start",
                reason(skip, undefined, "logId"),
                function () {
                    const query =
                        create().setPaymentTransactionId(TRANSACTION_ID);

                    expect(query._getLogId()).to.equal(
                        `${QueryClass.name}:${VALID_START.toString()}`,
                    );
                },
            );

            check(
                "returns the class name and the query's timestamp without a payment",
                reason(skip, undefined, "logId"),
                function () {
                    const query = create();

                    expect(query._getLogId()).to.equal(
                        `${QueryClass.name}:${query._timestamp.toString()}`,
                    );
                },
            );
        });
    });
}

/**
 * Registers a test per constructor prop. Nothing is registered when no field
 * is a prop, since an empty `describe()` fails.
 *
 * @param {new (props?: object) => any} Class
 * @param {ReturnType<typeof withDefaults>[]} fields
 * @param {Record<string, string>} skip
 */
function describeProps(Class, fields, skip) {
    const props = fields.filter((field) => field.prop != null);
    if (props.length === 0) {
        return;
    }

    describe("constructor", function () {
        for (const field of props) {
            check(
                `sets ${field.name} from props`,
                reason(skip, field.skip, "props"),
                function () {
                    const instance = new Class({ [field.prop]: field.value });

                    expectField(field, instance[field.getter]);
                },
            );
        }
    });
}

/**
 * Registers a checksum test per entity ID field. Nothing is registered when
 * no field is an entity ID.
 *
 * @param {() => any} create
 * @param {ReturnType<typeof withDefaults>[]} fields
 * @param {Record<string, string>} skip
 */
function describeChecksums(create, fields, skip) {
    const ids = fields.filter((field) => field.entityId);
    if (ids.length === 0) {
        return;
    }

    describe("_validateChecksums()", function () {
        for (const field of ids) {
            check(
                `validates the checksum of ${field.name}`,
                reason(skip, field.skip, "checksum"),
                function () {
                    const instance = create()[field.setter](
                        idWithMainnetChecksum(field),
                    );

                    expectChecksumValidated((client) =>
                        instance._validateChecksums(client),
                    );
                },
            );
        }

        check(
            "skips unset entity IDs",
            reason(skip, undefined, "checksum"),
            function () {
                expectUnsetIdsSkipped(create());
            },
        );
    });
}
