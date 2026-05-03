// SPDX-License-Identifier: Apache-2.0

import BlockNodeApi from "./BlockNodeApi.js";
import RegisteredServiceEndpoint, {
    ENDPOINT_FROM_JSON_REGISTRY,
    ENDPOINT_FROM_PROTOBUF_REGISTRY,
} from "./RegisteredServiceEndpoint.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.IRegisteredServiceEndpoint} IRegisteredServiceEndpoint
 * @typedef {import("./RegisteredServiceEndpoint.js").RegisteredServiceEndpointProps} RegisteredServiceEndpointProps
 * @typedef {import("./RegisteredServiceEndpoint.js").RegisteredServiceEndpointJson} RegisteredServiceEndpointJson
 */

/**
 * @typedef {RegisteredServiceEndpointProps & {
 *   endpointApis?: ?((BlockNodeApi | number)[]),
 * }} BlockNodeServiceEndpointProps
 */

/**
 * A registered service endpoint for a block node.
 */
export default class BlockNodeServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {BlockNodeServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);

        /**
         * @private
         * @type {BlockNodeApi[]}
         */
        this._endpointApis = [BlockNodeApi.Other];

        this._setType("blockNode");

        if (props.endpointApis != null) {
            this.setEndpointApis(props.endpointApis);
        }
    }

    /**
     * @param {Array<BlockNodeApi | number>} endpointApis
     * @returns {this}
     */
    setEndpointApis(endpointApis) {
        if (endpointApis == null) {
            throw new TypeError("endpointApis must not be null or undefined.");
        }

        this._endpointApis = endpointApis.map((endpointApi) =>
            endpointApi instanceof BlockNodeApi
                ? endpointApi
                : BlockNodeApi._fromCode(endpointApi),
        );
        return this;
    }

    /**
     * @param {BlockNodeApi | number} endpointApi
     * @returns {this}
     */
    addEndpointApi(endpointApi) {
        if (endpointApi == null) {
            throw new TypeError("endpointApi must not be null or undefined.");
        }

        this._endpointApis.push(
            endpointApi instanceof BlockNodeApi
                ? endpointApi
                : BlockNodeApi._fromCode(endpointApi),
        );
        return this;
    }

    /**
     * @returns {BlockNodeApi[]}
     */
    get endpointApis() {
        return [...this._endpointApis];
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {BlockNodeServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new BlockNodeServiceEndpoint({
            ipAddress: endpoint.ipAddress != null ? endpoint.ipAddress : null,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : null,
            port: endpoint.port != null ? endpoint.port : null,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : null,
            endpointApis:
                endpoint.blockNode?.endpointApi != null
                    ? endpoint.blockNode.endpointApi
                    : null,
        });
    }

    /**
     * @internal
     * @param {RegisteredServiceEndpointJson} json
     * @returns {BlockNodeServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new BlockNodeServiceEndpoint();
        endpoint._applyJsonBaseFields(json);

        const apis = json.block_node?.endpoint_apis;
        if (apis != null && apis.length > 0) {
            endpoint.setEndpointApis(
                apis.map((api) => BlockNodeApi._fromString(api)),
            );
        }
        return endpoint;
    }

    /**
     * @internal
     * @returns {IRegisteredServiceEndpoint}
     */
    _toProtobuf() {
        return {
            ...this._toProtobufBase(),
            blockNode: {
                endpointApi: this._endpointApis.map((endpointApi) =>
                    endpointApi.valueOf(),
                ),
            },
        };
    }
}

ENDPOINT_FROM_PROTOBUF_REGISTRY.set(
    "blockNode",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    BlockNodeServiceEndpoint._fromProtobuf,
);
ENDPOINT_FROM_JSON_REGISTRY.set(
    "blockNode",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    BlockNodeServiceEndpoint._fromJson,
);
