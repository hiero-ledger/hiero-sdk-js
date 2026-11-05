// SPDX-License-Identifier: Apache-2.0

import RegisteredServiceEndpoint from "./RegisteredServiceEndpoint.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.IRegisteredServiceEndpoint} IRegisteredServiceEndpoint
 * @typedef {import("./RegisteredServiceEndpoint.js").RegisteredServiceEndpointProps} RegisteredServiceEndpointProps
 * @typedef {import("./RegisteredServiceEndpoint.js").RegisteredServiceEndpointJson} RegisteredServiceEndpointJson
 */

/**
 * A registered service endpoint for an RPC relay.
 */
export default class RpcRelayServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {RegisteredServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);
        this._setType("rpcRelay");
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {RpcRelayServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new RpcRelayServiceEndpoint({
            ipAddress: endpoint.ipAddress != null ? endpoint.ipAddress : null,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : null,
            port: endpoint.port != null ? endpoint.port : null,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : null,
        });
    }

    /**
     * @internal
     * @param {RegisteredServiceEndpointJson} json
     * @returns {RpcRelayServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new RpcRelayServiceEndpoint();
        endpoint._applyJsonBaseFields(json);
        return endpoint;
    }

    /**
     * @internal
     * @returns {IRegisteredServiceEndpoint}
     */
    _toProtobuf() {
        return {
            ...this._toProtobufBase(),
            rpcRelay: {},
        };
    }
}
