import {
    AccountCreateTransaction,
    AccountId,
    PrivateKey,
} from "../../../src/index.js";
import Mocker from "../Mocker.js";
import { proto } from "@hiero-ledger/proto";

const TRANSACTION_RESPONSE_SUCCESS = {
    nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
};

// Create account ID for mock response
const mockAccountId = AccountId.fromString("0.0.100");

const TRANSACTION_RECEIPT_SUCCESS_RESPONSE = {
    transactionGetReceipt: {
        header: {
            nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
        },
        receipt: {
            status: proto.ResponseCodeEnum.SUCCESS,
            accountID: mockAccountId._toProtobuf(),
        },
    },
};

const TRANSACTION_RECEIPT_NOT_FOUND_RESPONSE = {
    transactionGetReceipt: {
        header: { nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK },
        receipt: {
            status: proto.ResponseCodeEnum.RECEIPT_NOT_FOUND,
        },
    },
};

describe("TransactionResponseReceiptMocking", function () {
    let client;
    let servers;

    afterEach(function () {
        if (client) {
            client.close();
        }
        if (servers) {
            servers.close();
        }
    });

    describe("receipt node failover", function () {
        it("should pin receipt query to submitting node by default", async function () {
            ({ client, servers } = await Mocker.withResponses([
                [
                    { response: TRANSACTION_RESPONSE_SUCCESS },
                    { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                ],
            ]));

            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(client);

            // Get receipt query without client (default behavior)
            const receiptQuery = response.getReceiptQuery();

            // Should be pinned to submitting node only
            expect(receiptQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                response.nodeId.toString(),
            );

            // Verify receipt can still be obtained
            const receipt = await response.getReceipt(client);
            expect(receipt.accountId).to.not.be.null;
            expect(receipt.accountId.toString()).to.equal("0.0.100");
        });

        it("should successfully failover to second node when first node returns RECEIPT_NOT_FOUND", async function () {
            ({ client, servers } = await Mocker.withResponses([
                [
                    { response: TRANSACTION_RESPONSE_SUCCESS },
                    // First receipt query fails with RECEIPT_NOT_FOUND
                    { response: TRANSACTION_RECEIPT_NOT_FOUND_RESPONSE },
                ],
                [
                    // Second node succeeds
                    { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                ],
            ]));

            // Enable receipt node failover
            client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            // Execute transaction on first node
            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .setNodeAccountIds([new AccountId(3), new AccountId(4)])
                .execute(client);

            // Set max attempts to allow failover
            const receipt = await response
                .getReceiptQuery(client)
                .setMaxAttempts(5)
                .execute(client);

            expect(receipt.accountId).to.not.be.null;
            expect(receipt.accountId.toString()).to.equal("0.0.100");
            expect(receipt.status.toString()).to.equal("SUCCESS");

            // Reset the flag for other tests
            client.setAllowReceiptNodeFailover(false);
        });

        it("should not allow failover when disabled (default)", async function () {
            ({ client, servers } = await Mocker.withResponses([
                [
                    { response: TRANSACTION_RESPONSE_SUCCESS },
                    { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                ],
            ]));

            // Ensure failover is disabled (default)
            expect(client.allowReceiptNodeFailover).to.be.false;

            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(client);

            const receiptQuery = response.getReceiptQuery(client);

            // Should only have submitting node
            expect(receiptQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                response.nodeId.toString(),
            );
        });
    });
});
