// SPDX-License-Identifier: Apache-2.0

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
 * A registered service endpoint for a mirror node.
 */
export default class MirrorNodeServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {RegisteredServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);
        this._setType("mirrorNode");
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {MirrorNodeServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new MirrorNodeServiceEndpoint({
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
     * @returns {MirrorNodeServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new MirrorNodeServiceEndpoint();
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
            mirrorNode: {},
        };
    }
}

ENDPOINT_FROM_PROTOBUF_REGISTRY.set(
    "mirrorNode",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    MirrorNodeServiceEndpoint._fromProtobuf,
);
ENDPOINT_FROM_JSON_REGISTRY.set(
    "mirrorNode",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    MirrorNodeServiceEndpoint._fromJson,
);
