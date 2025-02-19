// SPDX-License-Identifier: Apache-2.0

import SemanticVersion from "./SemanticVersion.js";
import * as HashgraphProto from "@hashgraph/proto";

/**
 * Response when the client sends the node CryptoGetVersionInfoQuery.
 */
export default class NetworkVersionInfo {
    /**
     * @private
     * @param {object} props
     * @param {SemanticVersion} props.protobufVersion
     * @param {SemanticVersion} props.servicesVersion
     */
    constructor(props) {
        /**
         * The account ID for which this information applies.
         *
         * @readonly
         */
        this.protobufVersion = props.protobufVersion;

        /**
         * The account ID for which this information applies.
         *
         * @readonly
         */
        this.servicesVersion = props.servicesVersion;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.INetworkGetVersionInfoResponse} info
     * @returns {NetworkVersionInfo}
     */
    static _fromProtobuf(info) {
        return new NetworkVersionInfo({
            protobufVersion: SemanticVersion._fromProtobuf(
                /** @type {HashgraphProto.proto.ISemanticVersion} */
                (info.hapiProtoVersion),
            ),
            servicesVersion: SemanticVersion._fromProtobuf(
                /** @type {HashgraphProto.proto.ISemanticVersion} */
                (info.hederaServicesVersion),
            ),
        });
    }

    /**
     * @internal
     * @returns {HashgraphProto.proto.INetworkGetVersionInfoResponse}
     */
    _toProtobuf() {
        return {
            hapiProtoVersion: this.protobufVersion._toProtobuf(),
            hederaServicesVersion: this.servicesVersion._toProtobuf(),
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {NetworkVersionInfo}
     */
    static fromBytes(bytes) {
        return NetworkVersionInfo._fromProtobuf(
            HashgraphProto.proto.NetworkGetVersionInfoResponse.decode(bytes),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HashgraphProto.proto.NetworkGetVersionInfoResponse.encode(
            this._toProtobuf(),
        ).finish();
    }
}
