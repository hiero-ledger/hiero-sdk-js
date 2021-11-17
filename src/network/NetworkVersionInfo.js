import SemanticVersion from "./SemanticVersion.js";
import * as proto from "@exodus/hashgraph-proto";

/**
 * Response when the client sends the node CryptoGetVersionInfoQuery.
 */
export default class NetworkVersionInfo {
    /**
     * @private
     * @param {object} props
     * @param {SemanticVersion} props.protobufVersion
     * @param {SemanticVersion} props.servicesVesion
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
        this.servicesVesion = props.servicesVesion;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.INetworkGetVersionInfoResponse} info
     * @returns {NetworkVersionInfo}
     */
    static _fromProtobuf(info) {
        return new NetworkVersionInfo({
            protobufVersion: SemanticVersion._fromProtobuf(
                /** @type {proto.ISemanticVersion} */
                (info.hapiProtoVersion)
            ),
            servicesVesion: SemanticVersion._fromProtobuf(
                /** @type {proto.ISemanticVersion} */
                (info.hederaServicesVersion)
            ),
        });
    }

    /**
     * @internal
     * @returns {proto.INetworkGetVersionInfoResponse}
     */
    _toProtobuf() {
        return {
            hapiProtoVersion: this.protobufVersion._toProtobuf(),
            hederaServicesVersion: this.servicesVesion._toProtobuf(),
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {NetworkVersionInfo}
     */
    static fromBytes(bytes) {
        return NetworkVersionInfo._fromProtobuf(
            proto.NetworkGetVersionInfoResponse.decode(bytes)
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.NetworkGetVersionInfoResponse.encode(
            this._toProtobuf()
        ).finish();
    }
}
