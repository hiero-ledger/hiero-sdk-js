// SPDX-License-Identifier: Apache-2.0
import Channel, { encodeRequest, decodeUnaryResponse } from "./Channel.js";
import * as base64 from "../encoding/base64.native.js";
import HttpError from "../http/HttpError.js";
import HttpStatus from "../http/HttpStatus.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";

export default class NativeChannel extends Channel {
    /**
     * @param {string} address
     */
    constructor(address) {
        super();

        /**
         * @type {string}
         * @private
         */
        this._address = address;
    }

    /**
     * @override
     * @returns {void}
     */
    close() {
        // do nothing
    }

    /**
     * @override
     * @protected
     * @param {string} serviceName
     * @returns {import("protobufjs").RPCImpl}
     */
    _createUnaryClient(serviceName) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return async (method, requestData, callback) => {
            try {
                const data = base64.encode(
                    new Uint8Array(encodeRequest(requestData)),
                );

                const shouldUseHttps = !(
                    this._address.includes("localhost") ||
                    this._address.includes("127.0.0.1")
                );

                const address = shouldUseHttps
                    ? `https://${this._address}`
                    : `http://${this._address}`;
                // this will be executed in react native environment sho
                // fetch should be available
                //eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(
                    `${address}/proto.${serviceName}/${method.name}`,
                    {
                        method: "POST",
                        headers: {
                            "content-type": "application/grpc-web-text",
                            "x-user-agent": `${SDK_NAME}/${SDK_VERSION}`,
                            "x-accept-content-transfer-encoding": "base64",
                            "x-grpc-web": "1",
                        },
                        body: data,
                    },
                );

                if (!response.ok) {
                    const error = new HttpError(
                        HttpStatus._fromValue(response.status),
                    );
                    callback(error, null);
                }

                const blob = await response.blob();

                /** @type {string} */
                const responseData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        resolve(/** @type {string} */ (reader.result));
                    };
                    reader.onerror = reject;
                });

                let responseBuffer;
                if (
                    responseData.startsWith(
                        "data:application/octet-stream;base64,",
                    )
                ) {
                    responseBuffer = base64.decode(
                        responseData.split(
                            "data:application/octet-stream;base64,",
                        )[1],
                    );
                } else if (
                    responseData.startsWith(
                        "data:application/grpc-web+proto;base64,",
                    )
                ) {
                    responseBuffer = base64.decode(
                        responseData.split(
                            "data:application/grpc-web+proto;base64,",
                        )[1],
                    );
                } else {
                    throw new Error(
                        `Expected response data to be base64 encode with a 'data:application/octet-stream;base64,' or 'data:application/grpc-web+proto;base64,' prefix, but found: ${responseData}`,
                    );
                }

                const unaryResponse = decodeUnaryResponse(
                    // @ts-ignore
                    responseBuffer.buffer,
                    responseBuffer.byteOffset,
                    responseBuffer.byteLength,
                );

                callback(null, unaryResponse);
            } catch (error) {
                callback(/** @type {Error} */ (error), null);
            }
        };
    }
}
