// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    Hbar,
    NodeUpdateTransaction,
    PrivateKey,
    Status,
    ServiceEndpoint,
} from "../../../src/exports.js";
import IntegrationTestEnv from "../client/NodeIntegrationTestEnv.js";
import {
    mirrorNetwork,
    node2Address,
    node2PortToReplace,
    network,
} from "./NodeConstants.js";

const restoreOriginalGrpcWebProxyEndpoint = async (client) => {
    const response = await new NodeUpdateTransaction()
        .setNodeId(1)
        .setNodeAccountIds([AccountId.fromString("0.0.3")])
        .setGrpcWebProxyEndpoint(
            new ServiceEndpoint()
                .setDomainName(node2Address.split(":")[0])
                .setPort(Number(node2Address.split(":")[1])),
        )
        .execute(client);
    const receipt = await response.getReceipt(client);
    expect(receipt.status).to.equal(Status.Success);
};

describe("Node Update Integration Tests", function () {
    let client;

    let env;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
        client = env.client;

        client.setNetwork(network);

        // Initialize client with integration network
        client.setMirrorNetwork(mirrorNetwork);

        // Set the operator to be genesis operator
        client.setOperator(env.genesisOperatorId, env.genesisOperatorKey);
    });

    afterEach(function () {
        if (client) {
            client.close();
        }
    });

    it("should execute node update transaction", async function () {
        const response = await new NodeUpdateTransaction()
            .setNodeId(1)
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setDescription("testUpdated")
            .setDeclineReward(true)
            .setGrpcWebProxyEndpoint(
                new ServiceEndpoint()
                    .setDomainName("testWebUpdatedsdfsdfsdfsdf.com")
                    .setPort(123456),
            )
            .execute(client);

        const receipt = await response.getReceipt(client);
        expect(receipt.status).to.equal(Status.Success);
    });

    it("should delete grpc web proxy endpoint", async function () {
        const response = await new NodeUpdateTransaction()
            .setNodeId(1)
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .deleteGrpcWebProxyEndpoint()
            .execute(client);

        const receipt = await response.getReceipt(client);
        expect(receipt.status).to.equal(Status.Success);

        // Restore the original grpc web proxy endpoint
        await restoreOriginalGrpcWebProxyEndpoint(client);
    });

    it("should change node account ID and revert back", async function () {
        // Change node account ID from 0.0.3 to 0.0.2
        const response1 = await new NodeUpdateTransaction()
            .setNodeId(0)
            .setNodeAccountIds([AccountId.fromString("0.0.4")])
            .setAccountId(AccountId.fromString("0.0.2"))
            .execute(client);

        const receipt1 = await response1.getReceipt(client);
        expect(receipt1.status).to.equal(Status.Success);

        // Revert the ID back to 0.0.3
        const response2 = await new NodeUpdateTransaction()
            .setNodeId(0)
            .setNodeAccountIds([AccountId.fromString("0.0.4")])
            .setAccountId(AccountId.fromString("0.0.3"))
            .execute(client);

        const receipt2 = await response2.getReceipt(client);
        expect(receipt2.status).to.equal(Status.Success);
    });

    it("should fail with INVALID_SIGNATURE when updating without admin key", async function () {
        // Create a new account to be the operator
        const newOperatorKey = PrivateKey.generateED25519();
        const createResp = await new AccountCreateTransaction()
            .setKey(newOperatorKey.publicKey)
            .setInitialBalance(new Hbar(2))
            .execute(client);
        const createReceipt = await createResp.getReceipt(client);
        const newOperator = createReceipt.accountId;

        // Set the new account as operator
        client.setOperator(newOperator, newOperatorKey);

        try {
            // Try to update node account ID without admin key signature
            const response = await new NodeUpdateTransaction()
                .setNodeId(0)
                .setDescription("testUpdated")
                .setAccountId(AccountId.fromString("0.0.50"))
                .execute(client);

            await response.getReceipt(client);
            expect.fail("Should have thrown INVALID_SIGNATURE error");
        } catch (error) {
            expect(error.message).to.include("INVALID_SIGNATURE");
        }
    });

    it("should change node account ID to the same account", async function () {
        const response = await new NodeUpdateTransaction()
            .setNodeId(1)
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setAccountId(AccountId.fromString("0.0.4"))
            .execute(client);

        const receipt = await response.getReceipt(client);
        expect(receipt.status).to.equal(Status.Success);
    });

    it("should fail when changing to non-existent account ID", async function () {
        try {
            const response = await new NodeUpdateTransaction()
                .setNodeId(0)
                .setDescription("testUpdated")
                .setAccountId(AccountId.fromString("0.0.999999999"))
                .execute(client);

            await response.getReceipt(client);
            expect.fail("Should have thrown INVALID_SIGNATURE error");
        } catch (error) {
            expect(error.message).to.include("INVALID_SIGNATURE");
        }
    });

    it("should fail when changing node account ID without account key", async function () {
        // Create a new account
        const newKey = PrivateKey.generateED25519();
        const createResp = await new AccountCreateTransaction()
            .setKey(newKey.publicKey)
            .setInitialBalance(new Hbar(2))
            .execute(client);

        const createReceipt = await createResp.getReceipt(client);
        const newNodeAccountId = createReceipt.accountId;

        try {
            // Try to set node account ID to new account without signing with new account's key
            const response = await new NodeUpdateTransaction()
                .setNodeId(0)
                .setDescription("testUpdated")
                .setAccountId(newNodeAccountId)
                .execute(client);

            await response.getReceipt(client);
            expect.fail("Should have thrown INVALID_SIGNATURE error");
        } catch (error) {
            expect(error.message).to.include("INVALID_SIGNATURE");
        }
    });

    it("should fail when changing to deleted account ID", async function () {
        // Create a new account
        const newAccountKey = PrivateKey.generateED25519();
        const createResp = await new AccountCreateTransaction()
            .setKey(newAccountKey.publicKey)
            .execute(client);

        const createReceipt = await createResp.getReceipt(client);
        const newAccount = createReceipt.accountId;

        // Delete the account
        const deleteResp = await (
            await new AccountDeleteTransaction()
                .setAccountId(newAccount)
                .setTransferAccountId(client.operatorAccountId)
                .freezeWith(client)
                .sign(newAccountKey)
        ).execute(client);

        await deleteResp.getReceipt(client);

        try {
            // Try to set node account ID to deleted account
            const updateResp = await (
                await new NodeUpdateTransaction()
                    .setNodeId(0)
                    .setDescription("testUpdated")
                    .setAccountId(newAccount)
                    .freezeWith(client)
                    .sign(newAccountKey)
            ).execute(client);

            await updateResp.getReceipt(client);
            expect.fail("Should have thrown ACCOUNT_DELETED error");
        } catch (error) {
            expect(error.message).to.include("ACCOUNT_DELETED");
        }
    });

    it("should fail when new node account has zero balance", async function () {
        // Create a new account with zero balance
        const newAccountKey = PrivateKey.generateED25519();
        const createResp = await new AccountCreateTransaction()
            .setKey(newAccountKey.publicKey)
            .execute(client);

        const createReceipt = await createResp.getReceipt(client);
        const newAccount = createReceipt.accountId;

        try {
            // Try to set node account ID to account with zero balance
            const updateResp = await (
                await new NodeUpdateTransaction()
                    .setNodeId(0)
                    .setNodeAccountIds([AccountId.fromString("0.0.4")])
                    .setDescription("testUpdated")
                    .setAccountId(newAccount)
                    .freezeWith(client)
                    .sign(newAccountKey)
            ).execute(client);

            await updateResp.getReceipt(client);
            expect.fail(
                "Should have thrown NODE_ACCOUNT_HAS_ZERO_BALANCE error",
            );
        } catch (error) {
            expect(error.message).to.include("NODE_ACCOUNT_HAS_ZERO_BALANCE");
        }
    });

    it("should update addressbook and retry after node account ID change", async function () {
        // Create the account that will be the new node account ID
        const newAccountKey = PrivateKey.generateED25519();
        const createResp = await new AccountCreateTransaction()
            .setKey(newAccountKey.publicKey)
            .setInitialBalance(new Hbar(1))
            .execute(client);

        const createReceipt = await createResp.getReceipt(client);
        const newNodeAccountID = createReceipt.accountId;

        // Update node account ID (0.0.8 -> newNodeAccountID)
        const updateResp = await (
            await new NodeUpdateTransaction()
                .setNodeId(1)
                .setNodeAccountIds([AccountId.fromString("0.0.3")])
                .setAccountId(newNodeAccountID)
                .freezeWith(client)
                .sign(newAccountKey)
        ).execute(client);

        await updateResp.getReceipt(client);

        // Wait for mirror node to import data
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const anotherNewKey = PrivateKey.generateED25519();
        // Submit to the updated node - should trigger addressbook refresh
        const testResp = await new AccountCreateTransaction()
            .setKey(anotherNewKey.publicKey)
            .setNodeAccountIds([
                AccountId.fromString("0.0.4"),
                AccountId.fromString("0.0.3"),
            ])
            .execute(client);
        const testReceipt = await testResp.getReceipt(client);
        expect(testReceipt.status).to.equal(Status.Success);
        // Verify address book has been updated
        const network = client.network;
        const hasNewNodeAccount = Object.values(network).some(
            (accountId) => accountId.toString() === newNodeAccountID.toString(),
        );
        expect(hasNewNodeAccount).to.be.true;

        // Find the address of the newly added node
        const newNodeAddress = Object.entries(network).find(
            ([, accountId]) =>
                accountId.toString() === newNodeAccountID.toString(),
        )?.[0];

        // Assert the address matches the expected value
        expect(newNodeAddress).to.equal(node2Address);

        // This is not an ideal workaround - reconstruct the network state
        // because the mirror node returns a different address than expected
        if (newNodeAddress === node2Address) {
            const oldNetworkState = { ...network };
            delete oldNetworkState[newNodeAddress];
            const newNetworkState = {
                ...oldNetworkState,
                [node2Address.replace(
                    node2Address.split(":")[1],
                    node2PortToReplace,
                )]: newNodeAccountID,
            };
            client.setNetwork(newNetworkState);
        }

        // This transaction should succeed with the new node account ID
        const finalResp = await new AccountCreateTransaction()
            .setKey(anotherNewKey.publicKey)
            .setNodeAccountIds([newNodeAccountID])
            .execute(client);

        const finalReceipt = await finalResp.getReceipt(client);
        expect(finalReceipt.status).to.equal(Status.Success);

        // Revert the node account ID
        const revertResp = await new NodeUpdateTransaction()
            .setNodeId(1)
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setAccountId(AccountId.fromString("0.0.4"))
            .execute(client);

        await revertResp.getReceipt(client);
    });

    it("should handle node account ID change without mirror node setup", async function () {
        // Set client without mirror network
        client.setMirrorNetwork([]);

        try {
            // Create the account that will be the new node account ID
            const newAccountKey = PrivateKey.generateED25519();
            const createResp = await new AccountCreateTransaction()
                .setKey(newAccountKey.publicKey)
                .setNodeAccountIds([
                    AccountId.fromString("0.0.3"),
                    AccountId.fromString("0.0.4"),
                ])
                .setInitialBalance(new Hbar(1))
                .execute(client);

            const createReceipt = await createResp.getReceipt(client);
            const newNodeAccountID = createReceipt.accountId;

            // Update node account ID
            const updateResp = await (
                await new NodeUpdateTransaction()
                    .setNodeId(0)
                    .setAccountId(newNodeAccountID)
                    .freezeWith(client)
                    .sign(newAccountKey)
            ).execute(client);

            await updateResp.getReceipt(client);

            // Wait for changes to propagate
            await new Promise((resolve) => setTimeout(resolve, 5000));

            const anotherNewKey = PrivateKey.generateED25519();

            // Submit transaction - should retry since no mirror node to update addressbook
            const testResp = await new AccountCreateTransaction()
                .setKey(anotherNewKey.publicKey)
                .setNodeAccountIds([
                    AccountId.fromString("0.0.3"),
                    AccountId.fromString("0.0.4"),
                ])
                .execute(client);

            const testReceipt = await testResp.getReceipt(client);
            expect(testReceipt.status).to.equal(Status.Success);

            // Verify address book has NOT been updated (no mirror node)
            const network = client.network;
            const node1 = Object.entries(network).find(
                ([, accountId]) => accountId.toString() === "0.0.3",
            );
            const node2 = Object.entries(network).find(
                ([, accountId]) => accountId.toString() === "0.0.4",
            );

            expect(node1).to.not.be.undefined;
            expect(node2).to.not.be.undefined;

            // This transaction should succeed with retries
            const finalResp = await new AccountCreateTransaction()
                .setKey(anotherNewKey.publicKey)
                .execute(client);

            const finalReceipt = await finalResp.getReceipt(client);
            expect(finalReceipt.status).to.equal(Status.Success);

            // Revert the node account ID
            const revertResp = await new NodeUpdateTransaction()
                .setNodeId(0)
                .setNodeAccountIds([AccountId.fromString("0.0.4")])
                .setAccountId(AccountId.fromString("0.0.3"))
                .execute(client);

            await revertResp.getReceipt(client);
        } finally {
            client.close();
        }
    });
});
