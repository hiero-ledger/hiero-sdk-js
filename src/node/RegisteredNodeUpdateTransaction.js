// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import Key from "../Key.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import RegisteredServiceEndpoint from "./RegisteredServiceEndpoint.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hiero-ledger/proto").proto.ISignedTransaction} ISignedTransaction
 * @typedef {import("@hiero-ledger/proto").proto.TransactionBody} TransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionResponse} ITransactionResponse
 */

/**
 * @namespace com.hedera.hapi.node.addressbook
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.IRegisteredNodeUpdateTransactionBody} IRegisteredNodeUpdateTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Updates an existing registered node in the network address book.
 *
 * Partial-update semantics:
 * - When `serviceEndpoints` is left unset (`null`), the existing endpoint
 *   list is unchanged. When set to a non-empty list, it replaces the
 *   existing list entirely.
 * - When `description` is left unset (`null`), the existing description is
 *   unchanged. To explicitly clear it on the network, call
 *   `setDescription("")`.
 */
export default class RegisteredNodeUpdateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Long} [props.registeredNodeId]
     * @param {?Key} [props.adminKey]
     * @param {?string} [props.description]
     * @param {?RegisteredServiceEndpoint[]} [props.serviceEndpoints]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Long}
         */
        this._registeredNodeId = null;

        /**
         * @private
         * @type {?Key}
         */
        this._adminKey = null;

        /**
         * @private
         * @type {?string}
         */
        this._description = null;

        /**
         * Null when no replacement has been set (partial update keeps existing
         * endpoints). A populated array when the user has explicitly called
         * `setServiceEndpoints` or `addServiceEndpoint`.
         *
         * @private
         * @type {?RegisteredServiceEndpoint[]}
         */
        this._serviceEndpoints = null;

        if (props?.registeredNodeId != null) {
            this.setRegisteredNodeId(props.registeredNodeId);
        }

        if (props?.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }

        if (props?.description != null) {
            this.setDescription(props.description);
        }

        if (props?.serviceEndpoints != null) {
            this.setServiceEndpoints(props.serviceEndpoints);
        }
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {RegisteredNodeUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const registeredNodeUpdate =
            /** @type {IRegisteredNodeUpdateTransactionBody} */ (
                body.registeredNodeUpdate
            );

        return Transaction._fromProtobufTransactions(
            new RegisteredNodeUpdateTransaction({
                registeredNodeId:
                    registeredNodeUpdate.registeredNodeId != null
                        ? Long.fromValue(registeredNodeUpdate.registeredNodeId)
                        : undefined,
                adminKey:
                    registeredNodeUpdate.adminKey != null
                        ? Key._fromProtobufKey(registeredNodeUpdate.adminKey)
                        : null,
                description:
                    registeredNodeUpdate.description != null &&
                    Object.hasOwn(registeredNodeUpdate.description, "value")
                        ? registeredNodeUpdate.description.value
                        : null,
                serviceEndpoints:
                    registeredNodeUpdate.serviceEndpoint != null &&
                    registeredNodeUpdate.serviceEndpoint.length > 0
                        ? registeredNodeUpdate.serviceEndpoint.map((endpoint) =>
                              RegisteredServiceEndpoint._fromProtobuf(endpoint),
                          )
                        : null,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * Sets the target registered node ID. Invalid / non-existent IDs are
     * rejected by the consensus node with `INVALID_REGISTERED_NODE_ID`.
     *
     * @param {Long | number} registeredNodeId
     * @returns {RegisteredNodeUpdateTransaction}
     */
    setRegisteredNodeId(registeredNodeId) {
        this._requireNotFrozen();

        if (registeredNodeId == null) {
            throw new TypeError(
                "registeredNodeId must not be null or undefined.",
            );
        }

        this._registeredNodeId = Long.isLong(registeredNodeId)
            ? registeredNodeId
            : Long.fromValue(registeredNodeId);
        return this;
    }

    /**
     * @returns {?Long}
     */
    get registeredNodeId() {
        return this._registeredNodeId;
    }

    /**
     * @param {Key} adminKey
     * @returns {RegisteredNodeUpdateTransaction}
     */
    setAdminKey(adminKey) {
        this._requireNotFrozen();

        if (adminKey == null) {
            throw new TypeError("adminKey must not be null or undefined.");
        }

        this._adminKey = adminKey;
        return this;
    }

    /**
     * @returns {?Key}
     */
    get adminKey() {
        return this._adminKey;
    }

    /**
     * Sets the description. To clear the description on the network, pass
     * an empty string (`setDescription("")`). Leaving it unset (the default)
     * means "do not change the existing description". Per the proto contract
     * the description must not exceed 100 bytes when encoded as UTF-8 — the
     * consensus node enforces that.
     *
     * @param {string} description
     * @returns {RegisteredNodeUpdateTransaction}
     */
    setDescription(description) {
        this._requireNotFrozen();

        if (description == null) {
            throw new TypeError("description must not be null or undefined.");
        }

        this._description = description;
        return this;
    }

    /**
     * @returns {?string}
     */
    get description() {
        return this._description;
    }

    /**
     * Replaces the existing service endpoints. Empty / oversized lists and
     * malformed endpoints are rejected by the consensus node with
     * `INVALID_REGISTERED_ENDPOINT` / `REGISTERED_ENDPOINTS_EXCEEDED_LIMIT`.
     *
     * @param {RegisteredServiceEndpoint[]} serviceEndpoints
     * @returns {RegisteredNodeUpdateTransaction}
     */
    setServiceEndpoints(serviceEndpoints) {
        this._requireNotFrozen();

        if (serviceEndpoints == null) {
            throw new TypeError(
                "serviceEndpoints must not be null or undefined.",
            );
        }

        this._serviceEndpoints = [...serviceEndpoints];
        return this;
    }

    /**
     * Returns the configured service-endpoint replacement, or `null` when
     * the existing endpoints will be left unchanged.
     *
     * @returns {?RegisteredServiceEndpoint[]}
     */
    get serviceEndpoints() {
        return this._serviceEndpoints != null
            ? [...this._serviceEndpoints]
            : null;
    }

    /**
     * @param {RegisteredServiceEndpoint} serviceEndpoint
     * @returns {RegisteredNodeUpdateTransaction}
     */
    addServiceEndpoint(serviceEndpoint) {
        this._requireNotFrozen();

        if (serviceEndpoint == null) {
            throw new TypeError(
                "serviceEndpoint must not be null or undefined.",
            );
        }

        if (this._serviceEndpoints == null) {
            this._serviceEndpoints = [];
        }

        this._serviceEndpoints.push(serviceEndpoint);
        return this;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.addressBook.updateRegisteredNode(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "registeredNodeUpdate";
    }

    /**
     * @override
     * @protected
     * @returns {IRegisteredNodeUpdateTransactionBody}
     */
    _makeTransactionData() {
        /** @type {IRegisteredNodeUpdateTransactionBody} */
        const data = {
            registeredNodeId:
                this._registeredNodeId != null ? this._registeredNodeId : null,
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
            description:
                this._description != null ? { value: this._description } : null,
            // Per HIP-1137 + proto: only emit serviceEndpoint when the user
            // explicitly set a replacement list. An empty/missing list means
            // "leave existing endpoints unchanged".
            serviceEndpoint:
                this._serviceEndpoints != null
                    ? this._serviceEndpoints.map((endpoint) =>
                          endpoint._toProtobuf(),
                      )
                    : null,
        };

        return data;
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `RegisteredNodeUpdateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "registeredNodeUpdate",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    RegisteredNodeUpdateTransaction._fromProtobuf,
);
