// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    Client,
    PrivateKey,
    ReceiptStatusError,
    Status,
    TransactionId,
    TransactionReceipt,
    TransactionReceiptQuery,
    TransactionResponse,
    TransferTransaction,
} from "../../src/index.js";

describe("Consensus throttle recovery", function () {
    let client, transaction, response, success, throttled;

    beforeEach(function () {
        client = Client.forNetwork({ "127.0.0.1:50211": "0.0.3" });
        client.setOperator(
            "0.0.100",
            PrivateKey.fromStringED25519("11".repeat(32)),
        );
        transaction = new TransferTransaction()
            .setTransactionId(TransactionId.fromString("0.0.100@1.000000000"))
            .setNodeAccountIds([new AccountId(3)]);
        response = new TransactionResponse({
            transaction,
            nodeId: new AccountId(3),
            transactionHash: Uint8Array.of(1),
            transactionId: transaction.transactionId,
        });
        success = TransactionReceipt._fromProtobuf({
            receipt: { status: Status.Success.valueOf() },
        });
        throttled = new ReceiptStatusError({
            transactionReceipt: TransactionReceipt._fromProtobuf({
                receipt: { status: Status.ThrottledAtConsensus.valueOf() },
            }),
            status: Status.ThrottledAtConsensus,
            transactionId: response.transactionId,
        });
    });

    afterEach(function () {
        vi.restoreAllMocks();
        client.close();
    });

    it("regenerates an operator-paid transaction and queries the retried transaction ID", async function () {
        const originalId = response.transactionId.toString();
        const query = vi
            .spyOn(TransactionReceiptQuery.prototype, "execute")
            .mockRejectedValueOnce(throttled)
            .mockResolvedValue(success);
        const execute = vi.spyOn(transaction, "execute").mockImplementation(
            async () =>
                new TransactionResponse({
                    nodeId: new AccountId(3),
                    transactionHash: Uint8Array.of(2),
                    transactionId: transaction.transactionId,
                }),
        );
        expect(await response.getReceipt(client)).to.equal(success);
        expect(execute).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledTimes(2);
        expect(response.transactionId.toString()).not.to.equal(originalId);
        expect(response.transactionId.toString()).to.equal(
            transaction.transactionId.toString(),
        );
        expect(query.mock.contexts[1].transactionId.toString()).to.equal(
            transaction.transactionId.toString(),
        );
        expect(response.transactionId.accountId.toString()).to.equal("0.0.100");
        expect(response.getRecordQuery().transactionId.toString()).to.equal(
            transaction.transactionId.toString(),
        );
    });

    it("uses the submitted response ID if execution regenerates it again", async function () {
        const submittedId = TransactionId.fromString("0.0.100@2.000000000");
        const query = vi
            .spyOn(TransactionReceiptQuery.prototype, "execute")
            .mockRejectedValueOnce(throttled)
            .mockResolvedValue(success);
        vi.spyOn(transaction, "execute").mockResolvedValue(
            new TransactionResponse({
                nodeId: new AccountId(3),
                transactionHash: Uint8Array.of(2),
                transactionId: submittedId,
            }),
        );
        await response.getReceipt(client);
        expect(response.transactionId.toString()).to.equal(
            submittedId.toString(),
        );
        expect(query.mock.contexts[1].transactionId.toString()).to.equal(
            submittedId.toString(),
        );
        expect(response.getRecordQuery().transactionId.toString()).to.equal(
            submittedId.toString(),
        );
    });

    it("caps retries when every receipt is still throttled", async function () {
        const query = vi
            .spyOn(TransactionReceiptQuery.prototype, "execute")
            .mockRejectedValue(throttled);
        const execute = vi
            .spyOn(transaction, "execute")
            .mockImplementation(async () => response);
        await expect(response.getReceipt(client)).rejects.toThrow(
            "maximum attempts",
        );
        expect(execute).toHaveBeenCalledTimes(5);
        expect(query).toHaveBeenCalledTimes(6);
    });

    it("does not retry a transaction paid by another account", async function () {
        transaction = new TransferTransaction().setTransactionId(
            TransactionId.fromString("0.0.101@1.000000000"),
        );
        response.transaction = transaction;
        const execute = vi
            .spyOn(transaction, "execute")
            .mockRejectedValue(new Error("must not submit"));
        vi.spyOn(
            TransactionReceiptQuery.prototype,
            "execute",
        ).mockRejectedValue(throttled);
        await expect(response.getReceipt(client)).rejects.toThrow(
            "not generated by the operator account",
        );
        expect(execute).not.toHaveBeenCalled();
    });

    it("requires the original transaction before resubmitting", async function () {
        response.transaction = undefined;
        vi.spyOn(
            TransactionReceiptQuery.prototype,
            "execute",
        ).mockRejectedValue(throttled);
        await expect(response.getReceipt(client)).rejects.toThrow(
            "should have the transaction set",
        );
    });

    it("propagates a non-throttle submission error without further retries", async function () {
        vi.spyOn(
            TransactionReceiptQuery.prototype,
            "execute",
        ).mockRejectedValue(throttled);
        const cause = new Error("transport failure");
        const execute = vi
            .spyOn(transaction, "execute")
            .mockRejectedValue(cause);
        await expect(response.getReceipt(client)).rejects.toBe(cause);
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("rejects unsuccessful receipts returned without a status exception", async function () {
        const receipt = TransactionReceipt._fromProtobuf({
            receipt: { status: Status.InvalidSignature.valueOf() },
        });
        vi.spyOn(
            TransactionReceiptQuery.prototype,
            "execute",
        ).mockResolvedValue(receipt);
        await expect(response.getReceipt(client)).rejects.toMatchObject({
            status: Status.InvalidSignature,
        });
    });
});
