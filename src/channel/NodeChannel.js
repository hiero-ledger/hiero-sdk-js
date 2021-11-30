import { Client, credentials } from "@grpc/grpc-js";
import Channel from "./Channel.js";
import GrpcServicesError from "../grpc/GrpcServiceError.js";
import GrpcStatus from "../grpc/GrpcStatus.js";

/**
 * @property {?proto.CryptoService} _crypto
 * @property {?proto.SmartContractService} _smartContract
 * @property {?proto.FileService} _file
 * @property {?proto.FreezeService} _freeze
 * @property {?proto.ConsensusService} _consensus
 * @property {?proto.NetworkService} _network
 */
export default class NodeChannel extends Channel {
    /**
     * @internal
     * @param {string} address
     * @param {string=} cert
     */
    constructor(address, cert) {
        super();

        this.cert = cert;

        let security;
        let options;

        if (this.cert != null) {
            security = credentials.createSsl(Buffer.from(this.cert));
            options = {
                "grpc.ssl_target_name_override": "127.0.0.1",
                "grpc.default_authority": "127.0.0.1",
                "grpc.http_connect_creds": "0",
                // https://github.com/grpc/grpc-node/issues/1593
                // https://github.com/grpc/grpc-node/issues/1545
                // https://github.com/grpc/grpc/issues/13163
                "grpc.keepalive_timeout_ms": 1,
                "grpc.keepalive_permit_without_calls": 1,
            };
        } else {
            security = credentials.createInsecure();
        }

        /**
         * @type {Client}
         * @private
         */
        this._client = new Client(address, security, options);
    }

    /**
     * @override
     * @returns {void}
     */
    close() {
        this._client.close();
    }

    /**
     * @override
     * @protected
     * @param {string} serviceName
     * @returns {import("@exodus/protobufjs/minimal").RPCImpl}
     */
    _createUnaryClient(serviceName) {
        return (method, requestData, callback) => {
            if (this._client.getChannel().getConnectivityState(false) == 4) {
                callback(new GrpcServicesError(GrpcStatus.Unavailable));
                return;
            }

            let received = false;

            setTimeout(() => {
                if (!received) {
                    this._client.close();
                    callback(new GrpcServicesError(GrpcStatus.Unavailable));
                }
            }, 10_000);

            this._client.makeUnaryRequest(
                `/proto.${serviceName}/${method.name}`,
                (value) => value,
                (value) => {
                    received = true;
                    return value;
                },
                Buffer.from(requestData),
                (e, r) => {
                    callback(e, r);
                }
            );
        };
    }
}
