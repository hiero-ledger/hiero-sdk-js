import {
    AccountCreateTransaction,
    AccountId,
    PrivateKey,
} from "../../../src/index.js";
import Mocker from "../Mocker.js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";

const TRANSACTION_RESPONSE_SUCCESS = {
    nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
};

const TRANSACTION_RECEIPT_SUCCESS_RESPONSE = {
    transactionGetReceipt: {
        header: {
            nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
        },
        receipt: {
            status: proto.ResponseCodeEnum.SUCCESS,
            accountId: {
                shardNum: Long.ZERO,
                realmNum: Long.ZERO,
                accountNum: Long.fromNumber(100),
            },
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

        it("should allow receipt query failover when enabled", async function () {
            ({ client, servers } = await Mocker.withResponses([
                [
                    { response: TRANSACTION_RESPONSE_SUCCESS },
                    { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                ],
                // Add additional nodes for failover
                [],
                [],
            ]));

            // Enable receipt node failover
            client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(client);

            // Get receipt query with failover enabled
            const receiptQuery = response.getReceiptQuery(client);

            // Should have multiple nodes
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // First node should be the submitting node
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                response.nodeId.toString(),
            );

            // Verify no duplicate nodes
            const nodeStrings = receiptQuery._nodeAccountIds.list.map((node) =>
                node.toString(),
            );
            const uniqueNodes = new Set(nodeStrings);
            expect(nodeStrings.length).to.equal(uniqueNodes.size);

            // Verify receipt can still be obtained with failover enabled
            const receipt = await response.getReceipt(client);
            expect(receipt.accountId).to.not.be.null;
            expect(receipt.accountId.toString()).to.equal("0.0.100");

            // Reset the flag for other tests
            client.setAllowReceiptNodeFailover(false);
        });

        it("should successfully get receipt with failover even if submitting node is first in list", async function () {
            ({ client, servers } = await Mocker.withResponses([
                [
                    { response: TRANSACTION_RESPONSE_SUCCESS },
                    { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                ],
                // Add additional nodes for failover
                [],
                [],
            ]));

            // Enable receipt node failover
            client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            // Execute transaction
            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(client);

            // Get the receipt - should succeed with failover enabled
            const receipt = await response.getReceipt(client);

            expect(receipt.accountId).to.not.be.null;
            expect(receipt.accountId.toString()).to.equal("0.0.100");
            expect(receipt.status.toString()).to.equal("SUCCESS");

            // Verify the receipt query was configured for failover
            const receiptQuery = response.getReceiptQuery(client);
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // Reset the flag for other tests
            client.setAllowReceiptNodeFailover(false);
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

        it("should maintain submitting node as first in failover list", async function () {
            ({ client, servers } = await Mocker.withResponses([
                [
                    { response: TRANSACTION_RESPONSE_SUCCESS },
                    { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                ],
                [],
                [],
            ]));

            // Enable receipt node failover
            client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(client);

            const receiptQuery = response.getReceiptQuery(client);

            // First node should be the submitting node (0.0.3)
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );

            // Should have multiple nodes for failover
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // Verify no duplicates
            const nodeStrings = receiptQuery._nodeAccountIds.list.map((node) =>
                node.toString(),
            );
            const uniqueNodes = new Set(nodeStrings);
            expect(nodeStrings.length).to.equal(uniqueNodes.size);

            // Reset the flag for other tests
            client.setAllowReceiptNodeFailover(false);
        });

        it("should respect client network nodes when failover is enabled", async function () {
            ({ client, servers } = await Mocker.withResponses([
                [
                    { response: TRANSACTION_RESPONSE_SUCCESS },
                    { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                ],
                [],
                [],
            ]));

            // Enable receipt node failover
            client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(client);

            const receiptQuery = response.getReceiptQuery(client);

            // Should have all client network nodes available for failover
            const clientNetworkSize = Object.keys(client.network).length;
            expect(receiptQuery._nodeAccountIds.list.length).to.equal(
                clientNetworkSize,
            );

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

        it("should allow getter to retrieve allowReceiptNodeFailover setting", async function () {
            ({ client, servers } = await Mocker.withResponses([[]]));

            // Default should be false
            expect(client.allowReceiptNodeFailover).to.be.false;

            // After setting to true
            client.setAllowReceiptNodeFailover(true);
            expect(client.allowReceiptNodeFailover).to.be.true;

            // After setting back to false
            client.setAllowReceiptNodeFailover(false);
            expect(client.allowReceiptNodeFailover).to.be.false;
        });
    });
});

