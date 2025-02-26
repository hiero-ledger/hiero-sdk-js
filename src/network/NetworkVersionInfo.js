// SPDX-License-Identifier: Apache-2.0

import SemanticVersion from "./SemanticVersion.js";
import * as HieroProto from "@hashgraph/proto";

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
     * @param {HieroProto.proto.INetworkGetVersionInfoResponse} info
     * @returns {NetworkVersionInfo}
     */
    static _fromProtobuf(info) {
        return new NetworkVersionInfo({
            protobufVersion: SemanticVersion._fromProtobuf(
                /** @type {HieroProto.proto.ISemanticVersion} */
                (info.hapiProtoVersion),
            ),
            servicesVersion: SemanticVersion._fromProtobuf(
                /** @type {HieroProto.proto.ISemanticVersion} */
                (info.hederaServicesVersion),
            ),
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.INetworkGetVersionInfoResponse}
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
            HieroProto.proto.NetworkGetVersionInfoResponse.decode(bytes),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.NetworkGetVersionInfoResponse.encode(
            this._toProtobuf(),
        ).finish();
    }
}
