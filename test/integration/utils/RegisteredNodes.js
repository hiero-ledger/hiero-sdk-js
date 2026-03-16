import {
    RegisteredNodeAddressBookQuery,
    RegisteredNodeCreateTransaction,
    RegisteredNodeDeleteTransaction,
    Status,
} from "../../../src/exports.js";

const DEFAULT_QUERY_LIMIT = 100;
const DEFAULT_WAIT_ATTEMPTS = 30;
const DEFAULT_WAIT_DELAY_MS = 1000;

/**
 * @typedef {import("../../../src/client/Client.js").default<*, *>} Client
 * @typedef {import("../../../src/PrivateKey.js").default} PrivateKey
 * @typedef {import("../../../src/node/RegisteredNode.js").default} RegisteredNode
 * @typedef {import("../../../src/node/RegisteredServiceEndpoint.js").default} RegisteredServiceEndpoint
 */

/**
 * @param {Client} client
 * @param {PrivateKey} adminKey
 * @param {RegisteredServiceEndpoint[]} serviceEndpoints
 * @param {?string} [description]
 * @returns {Promise<import("../../../src/transaction/TransactionReceipt.js").default>}
 */
export async function createRegisteredNode(
    client,
    adminKey,
    serviceEndpoints,
    description = null,
) {
    let transaction = new RegisteredNodeCreateTransaction()
        .setAdminKey(adminKey.publicKey)
        .setServiceEndpoints(serviceEndpoints);

    if (description != null) {
        transaction = transaction.setDescription(description);
    }

    const response = await (
        await (await transaction.freezeWith(client)).sign(adminKey)
    ).execute(client);

    return response.getReceipt(client);
}

/**
 * @param {Client} client
 * @param {import("long").default} registeredNodeId
 * @param {PrivateKey} adminKey
 * @returns {Promise<import("../../../src/transaction/TransactionReceipt.js").default>}
 */
export async function deleteRegisteredNode(
    client,
    registeredNodeId,
    adminKey,
) {
    const response = await (
        await (
            await new RegisteredNodeDeleteTransaction()
                .setRegisteredNodeId(registeredNodeId)
                .freezeWith(client)
        ).sign(adminKey)
    ).execute(client);

    return response.getReceipt(client);
}

/**
 * @param {Client} client
 * @param {import("long").default} registeredNodeId
 * @param {(registeredNode: RegisteredNode) => boolean} predicate
 * @param {string} expectation
 * @param {object} [options]
 * @param {number} [options.attempts]
 * @param {number} [options.delayMs]
 * @param {number} [options.limit]
 * @returns {Promise<RegisteredNode>}
 */
export async function waitForRegisteredNode(
    client,
    registeredNodeId,
    predicate = () => true,
    expectation = "appear on the mirror node",
    options = {},
) {
    const attempts = options.attempts ?? DEFAULT_WAIT_ATTEMPTS;
    const delayMs = options.delayMs ?? DEFAULT_WAIT_DELAY_MS;
    const limit = options.limit ?? DEFAULT_QUERY_LIMIT;
    let lastAddressBookSize = 0;

    for (let attempt = 0; attempt < attempts; attempt++) {
        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(limit)
            .execute(client);

        lastAddressBookSize = addressBook.registeredNodes.length;

        const registeredNode =
            addressBook.registeredNodes.find((node) =>
                node.registeredNodeId.eq(registeredNodeId),
            ) ?? null;

        if (registeredNode != null && predicate(registeredNode)) {
            return registeredNode;
        }

        await sleep(delayMs);
    }

    throw new Error(
        `Expected registered node ${registeredNodeId.toString()} to ${expectation}, but it was not observed after ${attempts} attempts. Last address book size: ${lastAddressBookSize}.`,
    );
}

/**
 * @param {Client} client
 * @param {import("long").default} registeredNodeId
 * @param {object} [options]
 * @param {number} [options.attempts]
 * @param {number} [options.delayMs]
 * @param {number} [options.limit]
 * @returns {Promise<void>}
 */
export async function waitForRegisteredNodeRemoval(
    client,
    registeredNodeId,
    options = {},
) {
    const attempts = options.attempts ?? DEFAULT_WAIT_ATTEMPTS;
    const delayMs = options.delayMs ?? DEFAULT_WAIT_DELAY_MS;
    const limit = options.limit ?? DEFAULT_QUERY_LIMIT;
    let lastAddressBookSize = 0;

    for (let attempt = 0; attempt < attempts; attempt++) {
        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(limit)
            .execute(client);

        lastAddressBookSize = addressBook.registeredNodes.length;

        const registeredNode = addressBook.registeredNodes.find((node) =>
            node.registeredNodeId.eq(registeredNodeId),
        );

        if (registeredNode == null) {
            return;
        }

        await sleep(delayMs);
    }

    throw new Error(
        `Expected registered node ${registeredNodeId.toString()} to be removed from the mirror node, but it was still present after ${attempts} attempts. Last address book size: ${lastAddressBookSize}.`,
    );
}

/**
 * @param {() => Promise<*>} execute
 * @param {import("../../../src/Status.js").default} expectedStatus
 * @returns {Promise<Error>}
 */
export async function expectStatusError(execute, expectedStatus) {
    try {
        await execute();
        expect.fail(`Expected status ${expectedStatus.toString()}.`);
    } catch (error) {
        expect(error.status).to.equal(expectedStatus);
        return error;
    }
}

/**
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export { Status };
