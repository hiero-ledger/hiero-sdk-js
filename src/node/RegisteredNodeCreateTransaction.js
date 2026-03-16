// SPDX-License-Identifier: Apache-2.0

import Key from "../Key.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import RegisteredServiceEndpoint from "./RegisteredServiceEndpoint.js";

const DESCRIPTION_MAX_LENGTH = 100;
const SERVICE_ENDPOINTS_MAX_LENGTH = 50;

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
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.IRegisteredNodeCreateTransactionBody} IRegisteredNodeCreateTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Creates a new registered node in the network address book.
 */
export default class RegisteredNodeCreateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {?Key} [props.adminKey]
     * @param {?string} [props.description]
     * @param {RegisteredServiceEndpoint[]} [props.serviceEndpoints]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Key}
         */
        this._adminKey = props?.adminKey != null ? props.adminKey : null;

        /**
         * @private
         * @type {?string}
         */
        this._description =
            props?.description != null ? props.description : null;

        /**
         * @private
         * @type {RegisteredServiceEndpoint[]}
         */
        this._serviceEndpoints =
            props?.serviceEndpoints != null ? [...props.serviceEndpoints] : [];
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {RegisteredNodeCreateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const registeredNodeCreate =
            /** @type {IRegisteredNodeCreateTransactionBody} */ (
                body.registeredNodeCreate
            );

        return Transaction._fromProtobufTransactions(
            new RegisteredNodeCreateTransaction({
                adminKey:
                    registeredNodeCreate.adminKey != null
                        ? Key._fromProtobufKey(registeredNodeCreate.adminKey)
                        : undefined,
                description:
                    registeredNodeCreate.description != null
                        ? registeredNodeCreate.description
                        : undefined,
                serviceEndpoints:
                    registeredNodeCreate.serviceEndpoint != null
                        ? registeredNodeCreate.serviceEndpoint.map((endpoint) =>
                              RegisteredServiceEndpoint._fromProtobuf(endpoint),
                          )
                        : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @param {Key} adminKey
     * @returns {RegisteredNodeCreateTransaction}
     */
    setAdminKey(adminKey) {
        this._requireNotFrozen();
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
     * @param {string} description
     * @returns {RegisteredNodeCreateTransaction}
     */
    setDescription(description) {
        this._requireNotFrozen();

        if (description.length > DESCRIPTION_MAX_LENGTH) {
            throw new Error(
                `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`,
            );
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
     * @param {RegisteredServiceEndpoint[]} serviceEndpoints
     * @returns {RegisteredNodeCreateTransaction}
     */
    setServiceEndpoints(serviceEndpoints) {
        this._requireNotFrozen();

        if (serviceEndpoints.length === 0) {
            throw new Error("ServiceEndpoints list must not be empty.");
        }

        if (serviceEndpoints.length > SERVICE_ENDPOINTS_MAX_LENGTH) {
            throw new Error(
                `ServiceEndpoints list must not contain more than ${SERVICE_ENDPOINTS_MAX_LENGTH} entries.`,
            );
        }

        this._serviceEndpoints = [...serviceEndpoints];
        return this;
    }

    /**
     * @returns {RegisteredServiceEndpoint[]}
     */
    get serviceEndpoints() {
        return this._serviceEndpoints;
    }

    /**
     * @param {RegisteredServiceEndpoint} serviceEndpoint
     * @returns {RegisteredNodeCreateTransaction}
     */
    addServiceEndpoint(serviceEndpoint) {
        this._requireNotFrozen();

        if (this._serviceEndpoints.length >= SERVICE_ENDPOINTS_MAX_LENGTH) {
            throw new Error(
                `ServiceEndpoints list must not contain more than ${SERVICE_ENDPOINTS_MAX_LENGTH} entries.`,
            );
        }

        this._serviceEndpoints.push(serviceEndpoint);
        return this;
    }

    /**
     * @override
     * @param {?import("../client/Client.js").default<Channel, *>} client
     * @returns {this}
     */
    freezeWith(client) {
        if (this._adminKey == null) {
            throw new Error(
                "RegisteredNodeCreateTransaction: 'adminKey' must be set before calling freeze().",
            );
        }

        if (this._serviceEndpoints.length === 0) {
            throw new Error(
                "RegisteredNodeCreateTransaction: 'serviceEndpoints' must not be empty before calling freeze().",
            );
        }

        return super.freezeWith(client);
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.addressBook.createRegisteredNode(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "registeredNodeCreate";
    }

    /**
     * @override
     * @protected
     * @returns {IRegisteredNodeCreateTransactionBody}
     */
    _makeTransactionData() {
        /** @type {IRegisteredNodeCreateTransactionBody} */
        const data = {
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
            description: this._description != null ? this._description : null,
            serviceEndpoint: this._serviceEndpoints.map((endpoint) =>
                endpoint._toProtobuf(),
            ),
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
        return `RegisteredNodeCreateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "registeredNodeCreate",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    RegisteredNodeCreateTransaction._fromProtobuf,
);
