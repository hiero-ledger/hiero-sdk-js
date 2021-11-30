import Channel, { encodeRequest, decodeUnaryResponse } from "./Channel.js";
import * as base64 from "../encoding/base64.native.js";

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
     * @returns {import("@exodus/protobufjs/minimal").RPCImpl}
     */
    _createUnaryClient(serviceName) {
        return async (method, requestData, callback) => {
            const data = base64.encode(
                new Uint8Array(encodeRequest(requestData))
            );

            const response = await fetch(
                `${this._address}/proto.${serviceName}/${method.name}`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/grpc-web-text",
                        "x-user-agent": "hedera-sdk-js/v2",
                        "x-accept-content-transfer-encoding": "base64",
                        "x-grpc-web": "1",
                    },
                    body: data,
                }
            );

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
                responseData.startsWith("data:application/octet-stream;base64,")
            ) {
                responseBuffer = base64.decode(
                    responseData.split(
                        "data:application/octet-stream;base64,"
                    )[1]
                );
            } else if (
                responseData.startsWith(
                    "data:application/grpc-web+proto;base64,"
                )
            ) {
                responseBuffer = base64.decode(
                    responseData.split(
                        "data:application/grpc-web+proto;base64,"
                    )[1]
                );
            } else {
                throw new Error(
                    `Expected response data to be base64 encode with a 'data:application/octet-stream;base64,' or 'data:application/grpc-web+proto;base64,' prefix, but found: ${responseData}`
                );
            }

            const unaryResponse = decodeUnaryResponse(
                responseBuffer.buffer,
                responseBuffer.byteOffset,
                responseBuffer.byteLength
            );

            callback(null, unaryResponse);
        };
    }
}
