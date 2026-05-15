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
 * @typedef {RegisteredServiceEndpointProps & { description?: ?string }} GeneralServiceEndpointProps
 */

/**
 * A registered service endpoint for a general-purpose service.
 */
export default class GeneralServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {GeneralServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);

        /**
         * @private
         * @type {?string}
         */
        this._description = null;

        this._setType("generalService");

        if (props.description != null) {
            this.setDescription(props.description);
        }
    }

    /**
     * Sets the description. Pass `null` to clear it. Per the proto contract
     * the description must not exceed 100 bytes when encoded as UTF-8 — the
     * consensus node enforces that.
     *
     * @param {?string} description
     * @returns {this}
     */
    setDescription(description) {
        this._description = description != null ? description : null;
        return this;
    }

    /**
     * @returns {?string}
     */
    get description() {
        return this._description;
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {GeneralServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new GeneralServiceEndpoint({
            ipAddress: endpoint.ipAddress != null ? endpoint.ipAddress : null,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : null,
            port: endpoint.port != null ? endpoint.port : null,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : null,
            description:
                endpoint.generalService?.description != null
                    ? endpoint.generalService.description
                    : null,
        });
    }

    /**
     * @internal
     * @param {RegisteredServiceEndpointJson} json
     * @returns {GeneralServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new GeneralServiceEndpoint();
        endpoint._applyJsonBaseFields(json);
        if (json.general_service?.description != null) {
            endpoint.setDescription(json.general_service.description);
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
            generalService: {
                description:
                    this._description != null ? this._description : null,
            },
        };
    }
}

ENDPOINT_FROM_PROTOBUF_REGISTRY.set(
    "generalService",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    GeneralServiceEndpoint._fromProtobuf,
);
ENDPOINT_FROM_JSON_REGISTRY.set(
    "generalService",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    GeneralServiceEndpoint._fromJson,
);
