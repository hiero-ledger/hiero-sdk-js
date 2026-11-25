import { Status } from "../../src/exports.js";
import { executeWithThrottleRetry } from "../integration/utils/Fixtures.js";

const receipt = { children: [] };

/**
 * @param {Array<object | Error>} results receipt query results, in order
 */
const makeClient = (results) => {
    let transactionCount = 0;

    const query = {
        setIncludeChildren: () => query,
        setValidateStatus: () => query,
        execute: async () => {
            const result = results.shift();

            if (result instanceof Error) {
                throw result;
            }

            return result;
        },
    };

    return {
        client: {},
        getTransactionCount: () => transactionCount,
        createTransaction: () => {
            transactionCount++;
            return {
                execute: async () => ({ getReceiptQuery: () => query }),
            };
        },
    };
};

describe("executeWithThrottleRetry", function () {
    it("retries with a new transaction when throttled at consensus", async function () {
        const { client, createTransaction, getTransactionCount } = makeClient([
            Object.assign(new Error("throttled"), {
                status: Status.ThrottledAtConsensus,
            }),
            receipt,
        ]);

        const result = await executeWithThrottleRetry(
            client,
            createTransaction,
        );

        expect(result).to.equal(receipt);
        expect(getTransactionCount()).to.equal(2);
    });

    it("rethrows any other status without retrying", async function () {
        const { client, createTransaction, getTransactionCount } = makeClient([
            Object.assign(new Error("not throttled"), {
                status: Status.InvalidAccountId,
            }),
        ]);

        await expect(
            executeWithThrottleRetry(client, createTransaction),
        ).rejects.toThrow("not throttled");
        expect(getTransactionCount()).to.equal(1);
    });

    it("gives up after the retry cap", async function () {
        vi.useFakeTimers();

        try {
            const errors = Array.from({ length: 5 }, () =>
                Object.assign(new Error("throttled"), {
                    status: Status.ThrottledAtConsensus,
                }),
            );
            const { client, createTransaction, getTransactionCount } =
                makeClient(errors);

            const result = executeWithThrottleRetry(client, createTransaction);
            const assertion = expect(result).rejects.toThrow("throttled");

            await vi.runAllTimersAsync();
            await assertion;

            expect(getTransactionCount()).to.equal(5);
        } finally {
            vi.useRealTimers();
        }
    });
});
