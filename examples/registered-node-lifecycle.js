/* eslint-disable
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-unsafe-call,
    @typescript-eslint/no-unsafe-argument,
    @typescript-eslint/restrict-template-expressions
*/
import {
    AccountId,
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    Client,
    NodeUpdateTransaction,
    PrivateKey,
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

async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, OPERATOR_KEY, and HEDERA_NETWORK are required.",
        );
    }

    const network = process.env.HEDERA_NETWORK;
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = privateKeyFromEnv("OPERATOR_KEY");
    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    const registeredNodeAdminKey = PrivateKey.generateED25519();
    let registeredNodeId = null;

    try {
        const initialEndpoint = new BlockNodeServiceEndpoint()
            .setIpAddress(Uint8Array.of(127, 0, 0, 1))
            .setPort(443)
            .setRequiresTls(true)
            .setEndpointApi(BlockNodeApi.SubscribeStream);

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

        // RegisteredNodeAddressBookQuery is intentionally not implemented yet.
        console.log(
            "Skipping registered node address book query because mirror node API is not available yet.",
        );

        const updatedEndpoint = new BlockNodeServiceEndpoint()
            .setDomainName("status.block-node.example.com")
            .setPort(443)
            .setRequiresTls(true)
            .setEndpointApi(BlockNodeApi.Status);

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
                .setNodeId(consensusNodeId)
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
