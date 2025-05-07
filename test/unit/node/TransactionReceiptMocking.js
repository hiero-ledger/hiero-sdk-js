import { TransactionReceiptQuery, Status } from "../../../src/index.js";
import Mocker from "../Mocker.js";
import Long from "long";

const ACCOUNT_ID = {
    shardNum: Long.ZERO,
    realmNum: Long.ZERO,
    accountNum: Long.fromNumber(10),
};

const TRANSACTION_RECEIPT_QUERY_RECEIPT_NOT_FOUND_RESPONSE = {
    transactionGetReceipt: {
        header: { nodeTransactionPrecheckCode: 18 },
    },
};

const TRANSACTION_RECEIPT_QUERY_RECEIPT_INVALID_SIGNATURE_RESPONSE = {
    transactionGetReceipt: {
        header: { nodeTransactionPrecheckCode: 0 },
        receipt: {
            status: 7,
        },
    },
};

const TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE = {
    transactionGetReceipt: {
        header: { nodeTransactionPrecheckCode: 0 },
        receipt: {
            status: 7,
            accountId: ACCOUNT_ID,
        },
    },
};

describe("TransactionReceiptMocking", function () {
    let client;
    let servers;

    afterEach(function () {
        client.close();
        servers.close();
    });

    it("should error with max attempts", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    response:
                        TRANSACTION_RECEIPT_QUERY_RECEIPT_NOT_FOUND_RESPONSE,
                },
                {
                    response:
                        TRANSACTION_RECEIPT_QUERY_RECEIPT_NOT_FOUND_RESPONSE,
                },
            ],
        ]));

        let err = false;

        try {
            await new TransactionReceiptQuery()
                .setTransactionId("0.0.3@4.5")
                .setMaxAttempts(2)
                .execute(client);
        } catch (error) {
            err =
                error.message ===
                "max attempts of 2 was reached for request with last error being: RECEIPT_NOT_FOUND";
        }

        expect(err).to.be.true;
    });

    it("should error with transaction ID in the message instead of payment transaction ID", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    response: TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                },
            ],
        ]));

        let err = false;

        try {
            await new TransactionReceiptQuery()
                .setTransactionId("0.0.3@4.5")
                .execute(client);
        } catch (error) {
            err =
                error.message ===
                "receipt for transaction 0.0.3@4.000000005 contained error status INVALID_SIGNATURE";
        }

        expect(err).to.be.true;
    });

    it("should not error if validate status is disabled", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    response:
                        TRANSACTION_RECEIPT_QUERY_RECEIPT_INVALID_SIGNATURE_RESPONSE,
                },
            ],
        ]));

        const receipt = await new TransactionReceiptQuery()
            .setTransactionId("0.0.3@4.5")
            .setValidateStatus(false)
            .execute(client);

        expect(receipt.status.toString()).to.be.equal(
            Status.InvalidSignature.toString(),
        );
    });
});
