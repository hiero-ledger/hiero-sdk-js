/* eslint-disable
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-unsafe-call,
    @typescript-eslint/no-unsafe-argument,
    @typescript-eslint/no-unsafe-return,
    @typescript-eslint/restrict-template-expressions
*/
import {
    AccountId,
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    Client,
    Long,
    NodeUpdateTransaction,
    PrivateKey,
    RegisteredNodeAddressBookQuery,
    RegisteredNodeCreateTransaction,
    RegisteredNodeDeleteTransaction,
    RegisteredNodeUpdateTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * @param {string} key
 * @returns {PrivateKey}
 */
function privateKeyFromEnv(key) {
    const value = process.env[key];

    if (value == null) {
        throw new Error(`Environment variable ${key} is required.`);
    }

    return PrivateKey.fromStringDer(value);
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isRegisteredNodeMethodUnavailable(error) {
    if (error == null || typeof error !== "object") {
        return false;
    }

    const grpcError = /** @type {{ code?: number; details?: string }} */ (
        error
    );
    const methodSignatures = [
        "AddressBookService/createRegisteredNode",
        "AddressBookService/updateRegisteredNode",
        "AddressBookService/deleteRegisteredNode",
    ];

    return (
        grpcError.code === 12 &&
        typeof grpcError.details === "string" &&
        methodSignatures.some((signature) =>
            grpcError.details.includes(signature),
        )
    );
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * @param {import("@hiero-ledger/sdk").Client} client
 * @param {import("long")} registeredNodeId
 * @returns {Promise<import("@hiero-ledger/sdk").RegisteredNode>}
 */
async function waitForRegisteredNode(client, registeredNodeId) {
    for (let attempt = 0; attempt < 30; attempt++) {
        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(25)
            .execute(client);

        /** @type {import("@hiero-ledger/sdk").RegisteredNode | null} */
        let registeredNode = null;

        for (const node of addressBook.registeredNodes) {
            if (node.registeredNodeId.eq(registeredNodeId)) {
                registeredNode = node;
                break;
            }
        }

        if (registeredNode != null) {
            return /** @type {import("@hiero-ledger/sdk").RegisteredNode} */ (
                registeredNode
            );
        }

        await delay(1000);
    }

    throw new Error(
        `Timed out waiting for registered node ${registeredNodeId.toString()} to appear on the mirror node.`,
    );
}

async function main() {
    if (
        process.env.GENESIS_OPERATOR_ID == null ||
        process.env.GENESIS_OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables GENESIS_OPERATOR_ID, GENESIS_OPERATOR_KEY, and HEDERA_NETWORK are required.",
        );
    }

    const network = process.env.HEDERA_NETWORK;
    const genesisOperatorId = AccountId.fromString(
        process.env.GENESIS_OPERATOR_ID,
    );
    const genesisOperatorKey = privateKeyFromEnv("GENESIS_OPERATOR_KEY");
    const client = Client.forName(network).setOperator(
        genesisOperatorId,
        genesisOperatorKey,
    );

    const registeredNodeAdminKey = PrivateKey.generateED25519();
    let registeredNodeId = null;

    try {
        const initialEndpoint = new BlockNodeServiceEndpoint()
            .setIpAddress(Uint8Array.of(127, 0, 0, 1))
            .setPort(443)
            .setRequiresTls(true)
            .setEndpointApis([
                BlockNodeApi.SubscribeStream,
                BlockNodeApi.Status,
            ]);

        console.log("Creating a registered node...");

        const createTransaction = await new RegisteredNodeCreateTransaction()
            .setAdminKey(registeredNodeAdminKey.publicKey)
            .setDescription("My Block Node")
            .addServiceEndpoint(initialEndpoint)
            .freezeWith(client)
            .sign(registeredNodeAdminKey);
        const createResponse = await createTransaction.execute(client);

        const createReceipt = await createResponse.getReceipt(client);
        registeredNodeId = createReceipt.registeredNodeId;

        if (registeredNodeId == null || registeredNodeId.toNumber() <= 0) {
            throw new Error(
                "RegisteredNodeCreateTransaction succeeded but receipt.registeredNodeId was missing or zero.",
            );
        }

        console.log(
            `Registered node created with id ${registeredNodeId.toString()} and status ${createReceipt.status.toString()}.`,
        );

        console.log(
            "Waiting for the mirror node to expose the new registered node...",
        );
        const mirrorRegisteredNode = await waitForRegisteredNode(
            client,
            registeredNodeId,
        );
        console.log(
            `Mirror node returned registered node ${mirrorRegisteredNode.registeredNodeId.toString()} with ${mirrorRegisteredNode.serviceEndpoints.length} service endpoint(s).`,
        );

        const updatedEndpoint = new BlockNodeServiceEndpoint()
            .setDomainName("status.block-node.example.com")
            .setPort(443)
            .setRequiresTls(true)
            .setEndpointApis([BlockNodeApi.Status]);

        console.log("Updating the registered node...");

        const updateTransaction = await new RegisteredNodeUpdateTransaction()
            .setRegisteredNodeId(registeredNodeId)
            .setDescription("My Updated Block Node")
            .setServiceEndpoints([initialEndpoint, updatedEndpoint])
            .freezeWith(client)
            .sign(registeredNodeAdminKey);
        const updateResponse = await updateTransaction.execute(client);

        const updateReceipt = await updateResponse.getReceipt(client);
        console.log(
            `Registered node update status: ${updateReceipt.status.toString()}.`,
        );

        const consensusNodeIdText = process.env.CONSENSUS_NODE_ID;
        const consensusNodeAdminKeyText = process.env.CONSENSUS_NODE_ADMIN_KEY;

        if (consensusNodeIdText != null && consensusNodeAdminKeyText != null) {
            const consensusNodeId = Number(consensusNodeIdText);

            if (!Number.isInteger(consensusNodeId) || consensusNodeId < 0) {
                throw new Error(
                    "CONSENSUS_NODE_ID must be a non-negative integer when provided.",
                );
            }

            const consensusNodeAdminKey = PrivateKey.fromStringDer(
                consensusNodeAdminKeyText,
            );

            console.log(
                `Associating registered node ${registeredNodeId.toString()} with consensus node ${consensusNodeId}...`,
            );

            const associateTransaction = await new NodeUpdateTransaction()
                .setNodeId(Long.fromNumber(consensusNodeId))
                .addAssociatedRegisteredNode(registeredNodeId)
                .freezeWith(client)
                .sign(consensusNodeAdminKey);
            const associateResponse =
                await associateTransaction.execute(client);

            const associateReceipt = await associateResponse.getReceipt(client);
            console.log(
                `Consensus node association update status: ${associateReceipt.status.toString()}.`,
            );
        } else {
            console.log(
                "Skipping consensus node association. Set CONSENSUS_NODE_ID and CONSENSUS_NODE_ADMIN_KEY to run that step.",
            );
        }
    } finally {
        if (registeredNodeId != null) {
            console.log(
                `Deleting registered node ${registeredNodeId.toString()}...`,
            );

            const deleteTransaction =
                await new RegisteredNodeDeleteTransaction()
                    .setRegisteredNodeId(registeredNodeId)
                    .freezeWith(client)
                    .sign(registeredNodeAdminKey);
            const deleteResponse = await deleteTransaction.execute(client);

            const deleteReceipt = await deleteResponse.getReceipt(client);
            console.log(
                `Registered node delete status: ${deleteReceipt.status.toString()}.`,
            );
        }

        client.close();
    }
}

void main().catch((error) => {
    if (isRegisteredNodeMethodUnavailable(error)) {
        console.error(
            "This node does not support HIP-1137 gRPC methods yet. Upgrade your consensus node/Solo image to a version that includes registered node APIs.",
        );
        process.exitCode = 0;
        return;
    }

    console.error(error);
    process.exitCode = 1;
});
