// SPDX-License-Identifier: Apache-2.0

import * as grpc from "@grpc/grpc-js";
import MirrorChannel from "./MirrorChannel.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("./MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * @internal
 */
export default class NodeMirrorChannel extends MirrorChannel {
    /**
     * @internal
     * @param {string} address
     */
    constructor(address) {
        super();

        /**
         * @type {grpc.Client}
         * @private
         */
        this._client = new grpc.Client(
            address,
            address.endsWith(":50212") || address.endsWith(":443")
                ? grpc.credentials.createSsl()
                : grpc.credentials.createInsecure(),
            {
                "grpc.keepalive_time_ms": 90000,
                "grpc.keepalive_timeout_ms": 5000,
            },
        );
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
     * @internal
     * @param {string} serviceName
     * @param {string} methodName
     * @param {Uint8Array} requestData
     * @param {(data: Uint8Array) => void} callback
     * @param {(error: MirrorError | Error) => void} error
     * @param {() => void} end
     * @returns {() => void}
     */
    makeServerStreamRequest(
        serviceName,
        methodName,
        requestData,
        callback,
        error,
        end,
    ) {
        const stream = this._client
            .makeServerStreamRequest(
                `/com.hedera.mirror.api.proto.${serviceName}/${methodName}`,
                (value) => value,
                (value) => value,
                Buffer.from(requestData),
            )
            .on("data", (/** @type {Uint8Array} */ data) => {
                callback(data);
            })
            .on("status", (/** @type {grpc.StatusObject} */ status) => {
                if (status.code == 0) {
                    end();
                }
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .on("error", (/** @type {grpc.StatusObject} */ err) => {
                error(err);
            });

        return () => {
            stream.cancel();
        };
    }
}
