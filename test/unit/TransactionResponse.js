import {
    AccountId,
    TransactionId,
    TransactionResponse,
} from "../../src/index.js";
import NodeClient from "../../src/client/NodeClient.js";

describe("TransactionResponse", function () {
    it("toJSON()", function () {
        const response = new TransactionResponse({
            nodeId: AccountId.fromString("0.0.3"),
            transactionHash: Uint8Array.of(1, 2, 3),
            transactionId: TransactionId.fromString("0.0.12@13.000000014"),
        });

        const expectedJSON = `{"nodeId":"0.0.3","transactionHash":"010203","transactionId":"0.0.12@13.000000014"}`;
        const expectedJSONParsed = JSON.parse(expectedJSON);

        const resultJSON = JSON.parse(JSON.stringify(response));
        expect(resultJSON).to.deep.equal(expectedJSONParsed);
    });

    describe("getReceiptQuery node failover", function () {
        it("should pin to submitting node by default (no client provided)", function () {
            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const receiptQuery = response.getReceiptQuery();

            // Should be pinned to submitting node only
            expect(receiptQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );
        });

        it("should pin to submitting node when client has allowReceiptNodeFailover disabled", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(false);

            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const receiptQuery = response.getReceiptQuery(client);

            // Should be pinned to submitting node only
            expect(receiptQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );

            client.close();
        });

        it("should allow failover when client has allowReceiptNodeFailover enabled", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const receiptQuery = response.getReceiptQuery(client);

            // Should have multiple nodes (submitting node + client nodes)
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // First node should be the submitting node
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );

            client.close();
        });

        it("should not have duplicate nodes when submitting node is in client network", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            // Use a node that's actually in the testnet network
            const testnetNodeId = Object.values(client.network)[0];

            const response = new TransactionResponse({
                nodeId:
                    typeof testnetNodeId === "string"
                        ? AccountId.fromString(testnetNodeId)
                        : testnetNodeId,
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const receiptQuery = response.getReceiptQuery(client);

            // Check for duplicates
            const nodeStrings = receiptQuery._nodeAccountIds.list.map((node) =>
                node.toString(),
            );
            const uniqueNodes = new Set(nodeStrings);
            expect(nodeStrings.length).to.equal(uniqueNodes.size);

            // First node should still be the submitting node
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                typeof testnetNodeId === "string"
                    ? testnetNodeId
                    : testnetNodeId.toString(),
            );

            client.close();
        });

        it("should use client getter for allowReceiptNodeFailover", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });

            // Default should be false
            expect(client.allowReceiptNodeFailover).to.be.false;

            // After setting to true
            client.setAllowReceiptNodeFailover(true);
            expect(client.allowReceiptNodeFailover).to.be.true;

            // After setting back to false
            client.setAllowReceiptNodeFailover(false);
            expect(client.allowReceiptNodeFailover).to.be.false;

            client.close();
        });

        it("should maintain submitting node as first node even when not in client network", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            // Use a node that's not in the testnet network
            const customNodeId = AccountId.fromString("0.0.999");

            const response = new TransactionResponse({
                nodeId: customNodeId,
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const receiptQuery = response.getReceiptQuery(client);

            // First node should be the custom submitting node
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.999",
            );

            // Should have multiple nodes
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            client.close();
        });

        it("should use transaction node IDs with precedence over client network", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            // Define specific transaction nodes
            const txNodes = [
                AccountId.fromString("0.0.3"),
                AccountId.fromString("0.0.4"),
                AccountId.fromString("0.0.5"),
            ];

            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
                transactionNodeAccountIds: txNodes,
            });

            const receiptQuery = response.getReceiptQuery(client);

            // Should use transaction nodes, not client network nodes
            expect(receiptQuery._nodeAccountIds.list).to.have.lengthOf(3);

            // Verify it's the transaction nodes (submitting node 0.0.3 first, then others)
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );
            expect(receiptQuery._nodeAccountIds.list[1].toString()).to.equal(
                "0.0.4",
            );
            expect(receiptQuery._nodeAccountIds.list[2].toString()).to.equal(
                "0.0.5",
            );

            client.close();
        });

        it("should fall back to client network when transaction has no specific nodes", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
                // No transactionNodeAccountIds provided
            });

            const receiptQuery = response.getReceiptQuery(client);

            // Should use client network nodes (which will be more than just one)
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // First should still be submitting node
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );

            client.close();
        });
    });

    describe("getRecordQuery node failover", function () {
        it("should pin to submitting node by default (no client provided)", function () {
            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const recordQuery = response.getRecordQuery();

            // Should be pinned to submitting node only
            expect(recordQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(recordQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );
        });

        it("should pin to submitting node when client has allowReceiptNodeFailover disabled", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(false);

            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const recordQuery = response.getRecordQuery(client);

            // Should be pinned to submitting node only
            expect(recordQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(recordQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );

            client.close();
        });

        it("should allow failover when client has allowReceiptNodeFailover enabled", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const recordQuery = response.getRecordQuery(client);

            // Should have multiple nodes (submitting node + client nodes)
            expect(recordQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // First node should be the submitting node
            expect(recordQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );

            client.close();
        });

        it("should use transaction node IDs with precedence over client network", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            // Define specific transaction nodes
            const txNodes = [
                AccountId.fromString("0.0.3"),
                AccountId.fromString("0.0.4"),
                AccountId.fromString("0.0.5"),
            ];

            const response = new TransactionResponse({
                nodeId: AccountId.fromString("0.0.3"),
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
                transactionNodeAccountIds: txNodes,
            });

            const recordQuery = response.getRecordQuery(client);

            // Should use transaction nodes, not client network nodes
            expect(recordQuery._nodeAccountIds.list).to.have.lengthOf(3);

            // Verify it's the transaction nodes (submitting node 0.0.3 first, then others)
            expect(recordQuery._nodeAccountIds.list[0].toString()).to.equal(
                "0.0.3",
            );
            expect(recordQuery._nodeAccountIds.list[1].toString()).to.equal(
                "0.0.4",
            );
            expect(recordQuery._nodeAccountIds.list[2].toString()).to.equal(
                "0.0.5",
            );

            client.close();
        });

        it("should not have duplicate nodes", function () {
            const client = NodeClient.forTestnet({
                scheduleNetworkUpdate: false,
            });
            client.setAllowReceiptNodeFailover(true);

            // Use a node that's actually in the testnet network
            const testnetNodeId = Object.values(client.network)[0];

            const response = new TransactionResponse({
                nodeId:
                    typeof testnetNodeId === "string"
                        ? AccountId.fromString(testnetNodeId)
                        : testnetNodeId,
                transactionHash: Uint8Array.of(1, 2, 3),
                transactionId: TransactionId.fromString("0.0.12@13.000000014"),
            });

            const recordQuery = response.getRecordQuery(client);

            // Check for duplicates
            const nodeStrings = recordQuery._nodeAccountIds.list.map((node) =>
                node.toString(),
            );
            const uniqueNodes = new Set(nodeStrings);
            expect(nodeStrings.length).to.equal(uniqueNodes.size);

            client.close();
        });
    });
});
