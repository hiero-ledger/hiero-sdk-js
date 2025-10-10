// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import Key from "../Key.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ServiceEndpoint from "./ServiceEndpoint.js";
import Long from "long";

const DESCRIPTION_MAX_LENGTH = 100;
const GOSSIP_ENDPOINTS_MAX_LENGTH = 10;
const SERVICE_ENDPOINTS_MAX_LENGTH = 8;

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hashgraph/proto").proto.ITransaction} ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} ITransactionResponse
 */

/**
 * @namespace com.hedera.hapi.node.addressbook
 * @typedef {import("@hashgraph/proto").com.hedera.hapi.node.addressbook.INodeUpdateTransactionBody} INodeUpdateTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * @description A transaction to update a consensus node in the network.
 */
export default class NodeUpdateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Long} [props.nodeId]
     * @param {AccountId} [props.accountId]
     * @param {?string} [props.description]
     * @param {Array<ServiceEndpoint>} [props.gossipEndpoints]
     * @param {?Array<ServiceEndpoint>} [props.serviceEndpoints]
     * @param {?Uint8Array} [props.gossipCaCertificate]
     * @param {?Uint8Array} [props.grpcCertificateHash]
     * @param {ServiceEndpoint} [props.grpcWebProxyEndpoint]
     * @param {Key} [props.adminKey]
     * @param {boolean} [props.declineReward]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Long}
         * @description A consensus node identifier in the network state. It's required.
         */
        this._nodeId = props?.nodeId != null ? props.nodeId : null;

        /**
         * @private
         * @type {?AccountId}
         * @description Desired new account identifier of the node.
         */
        this._accountId = props?.accountId != null ? props.accountId : null;

        /**
         * @private
         * @type {?string}
         * @description Short description of the node. If set, this value SHALL replace the previous value.
         */
        this._description =
            props?.description != null ? props.description : null;

        /**
         * @private
         * @type {?Array<ServiceEndpoint>}
         * @description List of service endpoints for gossip.
         */
        this._gossipEndpoints =
            props?.gossipEndpoints != null ? props.gossipEndpoints : null;

        /**
         * @private
         * @type {?Array<ServiceEndpoint>}
         * @description List of service endpoints for gRPC calls.
         */
        this._serviceEndpoints =
            props?.serviceEndpoints != null ? props.serviceEndpoints : null;

        /**
         * @private
         * @type {?Uint8Array}
         * @description Certificate used to sign gossip events.
         */
        this._gossipCaCertificate =
            props?.gossipCaCertificate != null
                ? props.gossipCaCertificate
                : null;

        /**
         * @private
         * @type {?Uint8Array}
         * @description Hash of the node gRPC TLS certificate.
         */
        this._grpcCertificateHash =
            props?.grpcCertificateHash != null
                ? props.grpcCertificateHash
                : null;

        /**
         * @private
         * @type {?ServiceEndpoint}
         * @description Proxy endpoint for gRPC web calls.
         */
        this._grpcWebProxyEndpoint = props?.grpcWebProxyEndpoint || null;

        /**
         * @private
         * @type {?Key}
         * @description Administrative key controlled by the node operator.
         */
        this._adminKey = props?.adminKey != null ? props.adminKey : null;

        /**
         * @private
         * @type {?boolean}
         * @description Whether the node declines rewards.
         */
        this._declineReward =
            props?.declineReward != null ? props.declineReward : null;
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {NodeUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const nodeUpdate = /** @type {INodeUpdateTransactionBody} */ (
            body.nodeUpdate
        );

        return Transaction._fromProtobufTransactions(
            new NodeUpdateTransaction({
                nodeId:
                    nodeUpdate.nodeId != null ? nodeUpdate.nodeId : undefined,
                accountId:
                    nodeUpdate.accountId != null
                        ? AccountId._fromProtobuf(nodeUpdate.accountId)
                        : undefined,
                description:
                    nodeUpdate.description != null
                        ? Object.hasOwn(nodeUpdate.description, "value")
                            ? nodeUpdate.description.value
                            : undefined
                        : undefined,
                gossipEndpoints:
                    nodeUpdate.gossipEndpoint != null
                        ? nodeUpdate.gossipEndpoint.map((endpoint) =>
                              ServiceEndpoint._fromProtobuf(endpoint),
                          )
                        : undefined,
                serviceEndpoints:
                    nodeUpdate.serviceEndpoint != null
                        ? nodeUpdate.serviceEndpoint.map((endpoint) =>
                              ServiceEndpoint._fromProtobuf(endpoint),
                          )
                        : undefined,
                gossipCaCertificate:
                    nodeUpdate.gossipCaCertificate != null
                        ? Object.hasOwn(nodeUpdate.gossipCaCertificate, "value")
                            ? nodeUpdate.gossipCaCertificate.value
                            : undefined
                        : undefined,
                grpcCertificateHash:
                    nodeUpdate.grpcCertificateHash != null
                        ? Object.hasOwn(nodeUpdate.grpcCertificateHash, "value")
                            ? nodeUpdate.grpcCertificateHash.value
                            : undefined
                        : undefined,
                grpcWebProxyEndpoint:
                    nodeUpdate.grpcProxyEndpoint != null
                        ? ServiceEndpoint._fromProtobuf(
                              nodeUpdate.grpcProxyEndpoint,
                          )
                        : undefined,
                adminKey:
                    nodeUpdate.adminKey != null
                        ? Key._fromProtobufKey(nodeUpdate.adminKey)
                        : undefined,
                declineReward:
                    nodeUpdate.declineReward?.value != null
                        ? nodeUpdate.declineReward.value
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
     * @param {Long} nodeId
     * @description Set consensus node identifier in the network state.
     * @returns {NodeUpdateTransaction}
     */
    setNodeId(nodeId) {
        this._requireNotFrozen();

        if (nodeId == null) {
            this._nodeId = null;
            return this;
        }

        // Convert to Long if it's a plain number
        const longNodeId = Long.isLong(nodeId)
            ? nodeId
            : Long.fromValue(nodeId);

        if (longNodeId.toNumber() < 0) {
            throw new Error(
                "NodeUpdateTransaction: 'nodeId' must be positive.",
            );
        }

        this._nodeId = longNodeId;

        return this;
    }

    /**
     * @description Get consensus node identifier in the network state.
     * @returns {?Long}
     */
    get nodeId() {
        return this._nodeId;
    }

    /**
     * @param {AccountId | string} accountId
     * @description Set desired new account identifier of the node.
     * @returns {NodeUpdateTransaction}
     */
    setAccountId(accountId) {
        this._requireNotFrozen();
        this._accountId =
            accountId instanceof AccountId
                ? accountId
                : AccountId.fromString(accountId);

        return this;
    }

    /**
     * @description Get desired new account identifier of the node.
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * @param {string} description
     * @description Set description of the node.
     * @returns {NodeUpdateTransaction}
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
     * @description Clear description of the node.
     * @returns {void}
     */
    clearDescription() {
        this._description = "";
    }

    /**
     * @description Get description of the node.
     * @returns {?string}
     */
    get description() {
        return this._description;
    }

    /**
     * @param {ServiceEndpoint[]} gossipEndpoints
     * @description Set list of service endpoints for gossip.
     * @returns {NodeUpdateTransaction}
     */
    setGossipEndpoints(gossipEndpoints) {
        this._requireNotFrozen();
        if (gossipEndpoints.length == 0) {
            throw new Error("GossipEndpoints list must not be empty.");
        }

        if (gossipEndpoints.length > GOSSIP_ENDPOINTS_MAX_LENGTH) {
            throw new Error(
                `GossipEndpoints list must not contain more than ${GOSSIP_ENDPOINTS_MAX_LENGTH} entries.`,
            );
        }

        this._gossipEndpoints = [...gossipEndpoints];

        return this;
    }

    /**
     * @description Get list of service endpoints for gossip.
     * @returns {?Array<ServiceEndpoint>}
     */
    get gossipEndpoints() {
        return this._gossipEndpoints;
    }

    /**
     * @param {ServiceEndpoint} endpoint
     * @description Add an endpoint to the list of service endpoints for gossip.
     * @returns {NodeUpdateTransaction}
     */
    addGossipEndpoint(endpoint) {
        this._requireNotFrozen();
        if (this._gossipEndpoints != null) {
            this._gossipEndpoints.push(endpoint);
        }
        return this;
    }

    /**
     * @param {ServiceEndpoint[]} serviceEndpoints
     * @description Set list of service endpoints for gRPC calls.
     * @returns {NodeUpdateTransaction}
     */
    setServiceEndpoints(serviceEndpoints) {
        this._requireNotFrozen();
        if (serviceEndpoints.length == 0) {
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
     * @description Get list of service endpoints for gRPC calls.
     * @returns {?Array<ServiceEndpoint>}
     */
    get serviceEndpoints() {
        return this._serviceEndpoints;
    }

    /**
     * @param {ServiceEndpoint} endpoint
     * @description Add an endpoint to the list of service endpoints for gRPC calls.
     * @returns {NodeUpdateTransaction}
     */
    addServiceEndpoint(endpoint) {
        this._requireNotFrozen();
        if (this._serviceEndpoints != null) {
            this._serviceEndpoints.push(endpoint);
        }
        return this;
    }

    /**
     * @param {Uint8Array} bytes
     * @description Set certificate used to sign gossip events.
     * @returns {NodeUpdateTransaction}
     */
    setGossipCaCertificate(bytes) {
        this._requireNotFrozen();
        if (bytes.length == 0) {
            throw new Error("GossipCaCertificate must not be empty.");
        }

        this._gossipCaCertificate = bytes;

        return this;
    }

    /**
     * @description Get certificate used to sign gossip events.
     * @returns {?Uint8Array}
     */
    get gossipCaCertificate() {
        return this._gossipCaCertificate;
    }

    /**
     * @param {Uint8Array} bytes
     * @description Set hash of the node gRPC TLS certificate.
     * @returns {NodeUpdateTransaction}
     */
    setCertificateHash(bytes) {
        this._requireNotFrozen();
        this._grpcCertificateHash = bytes;

        return this;
    }

    /**
     * @description Get hash of the node gRPC TLS certificate.
     * @returns {?Uint8Array}
     */
    get certificateHash() {
        return this._grpcCertificateHash;
    }

    /**
     * @param {ServiceEndpoint} endpoint
     * @description Set proxy endpoint for gRPC web calls.
     * @returns {NodeUpdateTransaction}
     */
    setGrpcWebProxyEndpoint(endpoint) {
        this._requireNotFrozen();
        this._grpcWebProxyEndpoint = endpoint;
        return this;
    }

    /**
     * @description Get proxy endpoint for gRPC web calls.
     * @returns {?ServiceEndpoint}
     */
    get grpcWebProxyEndpoint() {
        return this._grpcWebProxyEndpoint;
    }

    /**
     * @param {Key} adminKey
     * @description Set administrative key controlled by the node operator.
     * @returns {NodeUpdateTransaction}
     */
    setAdminKey(adminKey) {
        this._requireNotFrozen();
        this._adminKey = adminKey;

        return this;
    }

    /**
     * @description Get administrative key controlled by the node operator.
     * @returns {?Key}
     */
    get adminKey() {
        return this._adminKey;
    }

    /**
     * @param {boolean} declineReward
     * @description Set whether the node declines rewards.
     * @returns {NodeUpdateTransaction}
     */
    setDeclineReward(declineReward) {
        this._requireNotFrozen();
        this._declineReward = declineReward;
        return this;
    }

    /**
     * @description Get whether the node declines rewards.
     * @returns {?boolean}
     */
    get declineReward() {
        return this._declineReward;
    }

    /**
     * @description Deletes the gRPC proxy endpoint and sets it to null in the mirror node, effectively removing it from the network state.
     * @returns {NodeUpdateTransaction}
     */
    deleteGrpcWebProxyEndpoint() {
        this._grpcWebProxyEndpoint = new ServiceEndpoint();
        return this;
    }

    /**
     * @override
     * @param {?import("../client/Client.js").default<Channel, *>} client
     * @returns {this}
     */
    freezeWith(client) {
        if (this.nodeId == null) {
            throw new Error(
                "NodeUpdateTransaction: 'nodeId' must be explicitly set before calling freeze().",
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
        return channel.addressBook.updateNode(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "nodeUpdate";
    }

    /**
     * @override
     * @protected
     * @returns {INodeUpdateTransactionBody}
     */
    _makeTransactionData() {
        return {
            accountId:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            description: {
                value: this._description != null ? this._description : null,
            },
            gossipEndpoint:
                this._gossipEndpoints != null
                    ? this._gossipEndpoints.map(
                          (/** @type {ServiceEndpoint} */ endpoint) =>
                              endpoint._toProtobuf(),
                      )
                    : null,
            serviceEndpoint:
                this._serviceEndpoints != null
                    ? this._serviceEndpoints.map(
                          (/** @type {ServiceEndpoint} */ endpoint) =>
                              endpoint._toProtobuf(),
                      )
                    : null,
            gossipCaCertificate:
                this._gossipCaCertificate != null
                    ? {
                          value: this._gossipCaCertificate,
                      }
                    : null,
            grpcCertificateHash:
                this._grpcCertificateHash != null
                    ? {
                          value: this._grpcCertificateHash,
                      }
                    : null,
            grpcProxyEndpoint:
                this._grpcWebProxyEndpoint != null
                    ? this._grpcWebProxyEndpoint._toProtobuf()
                    : null,
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
            nodeId: this._nodeId != null ? this._nodeId : null,
            declineReward:
                this._declineReward != null
                    ? { value: this._declineReward }
                    : null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `NodeUpdateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "nodeUpdate",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    NodeUpdateTransaction._fromProtobuf,
);
