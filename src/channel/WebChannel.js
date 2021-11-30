import Channel, { encodeRequest, decodeUnaryResponse } from "./Channel.js";

export default class WebChannel extends Channel {
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
            const response = await fetch(
                `${this._address}/proto.${serviceName}/${method.name}`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/grpc-web+proto",
                        "x-user-agent": "hedera-sdk-js/v2",
                        "x-grpc-web": "1",
                    },
                    body: encodeRequest(requestData),
                }
            );

            const responseBuffer = await response.arrayBuffer();
            const unaryResponse = decodeUnaryResponse(responseBuffer);

            callback(null, unaryResponse);
        };
    }
}
