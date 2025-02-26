// SPDX-License-Identifier: Apache-2.0

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IServiceEndpoint} IServiceEndpoint
 */

export default class ServiceEndpoint {
    /**
     * @param {object} [props]
     * @param {?Uint8Array} [props.ipAddressV4]
     * @param {?number} [props.port]
     * @param {?string} [props.domainName]
     */
    constructor(props) {
        /**
         * @type {?Uint8Array}
         * @description The 4-byte IPv4 address of the endpoint
         * encoded in left to right order
         * (e.g. 127.0.0.1 has bytes [127, 0, 0, 1]).
         */
        this._ipAddressV4 =
            props?.ipAddressV4 != null ? props.ipAddressV4 : null;

        /**
         * @type {?number}
         * @description The port of the service endpoint. It's required.
         */
        this._port = props?.port != null ? props.port : null;

        /**
         * @type {?string}
         * @description A node domain name. This MUST be the
         * fully qualified domain(DNS) name of the node. This
         * value MUST NOT be more than 253 characters.
         * domain_name and ipAddressV4 are mutually exclusive.
         * When the `domain_name` field is set, the `ipAddressV4`
         * field MUST NOT be set. When the `ipAddressV4` field
         * is set, the `domain_name` field MUST NOT be set.
         */
        this._domainName = props?.domainName != null ? props.domainName : null;
    }

    /**
     * @param {Uint8Array} ipAddressV4
     * @description Set 4-byte IPv4 address of the endpoint.
     * @returns {ServiceEndpoint}
     *
     */
    setIpAddressV4(ipAddressV4) {
        if (this._domainName != null) {
            throw new Error(
                "Cannot set IP address when domain name is already set.",
            );
        }
        this._ipAddressV4 = ipAddressV4;
        return this;
    }

    /**
     * @description Get 4-byte IPv4 address of the endpoint.
     * @returns {?Uint8Array}
     *
     */
    get getIpAddressV4() {
        return this._ipAddressV4;
    }

    /**
     * @param {number} port
     * @description Set port of the endpoint.
     * @returns {ServiceEndpoint}
     *
     */
    setPort(port) {
        this._port = port;
        return this;
    }

    /**
     * @description Get port of the endpoint.
     * @returns {?number}
     *
     */
    get getPort() {
        return this._port;
    }

    /**
     * @param {string} domainName
     * @description Set domain name of the endpoint.
     * @returns {ServiceEndpoint}
     *
     */
    setDomainName(domainName) {
        if (this._ipAddressV4 != null) {
            throw new Error(
                "Cannot set domain name when IP address is already set.",
            );
        }
        this._domainName = domainName;
        return this;
    }

    /**
     * @description Get domain name of the endpoint.
     * @returns {?string}
     *
     */
    get getDomainName() {
        return this._domainName;
    }

    /**
     * @internal
     * @param {IServiceEndpoint} serviceEndpoint
     * @returns {ServiceEndpoint}
     */
    static _fromProtobuf(serviceEndpoint) {
        return new ServiceEndpoint({
            ipAddressV4:
                serviceEndpoint.ipAddressV4 != null
                    ? serviceEndpoint.ipAddressV4
                    : undefined,
            port:
                serviceEndpoint.port != null ? serviceEndpoint.port : undefined,
            domainName:
                serviceEndpoint.domainName != null
                    ? serviceEndpoint.domainName
                    : undefined,
        });
    }

    /**
     * @internal
     * @returns {IServiceEndpoint}
     */
    _toProtobuf() {
        return {
            ipAddressV4: this._ipAddressV4,
            port: this._port,
            domainName: this._domainName,
        };
    }
}
