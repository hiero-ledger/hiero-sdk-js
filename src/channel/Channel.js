// SPDX-License-Identifier: Apache-2.0

import * as HashgraphProto from "@hashgraph/proto";
import * as utf8 from "../encoding/utf8.js";

const { proto } = HashgraphProto;

/**
 * @internal
 * @abstract
 */
export default class Channel {
    /**
     * @protected
     */
    constructor() {
        /**
         * @protected
         * @type {?HashgraphProto.proto.CryptoService}
         */
        this._crypto = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.SmartContractService}
         */
        this._smartContract = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.FileService}
         */
        this._file = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.ConsensusService}
         */
        this._consensus = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.FreezeService}
         */
        this._freeze = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.NetworkService}
         */
        this._network = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.TokenService}
         */
        this._token = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.ScheduleService}
         */
        this._schedule = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.UtilService}
         */
        this._util = null;

        /**
         * @protected
         * @type {?HashgraphProto.proto.AddressBookService}
         */
        this._addressBook = null;
    }

    /**
     * @abstract
     * @returns {void}
     */
    close() {
        throw new Error("not implemented");
    }

    /**
     * @returns {HashgraphProto.proto.CryptoService}
     */
    get crypto() {
        if (this._crypto != null) {
            return this._crypto;
        }

        this._crypto = proto.CryptoService.create(
            this._createUnaryClient("CryptoService"),
        );

        return this._crypto;
    }

    /**
     * @returns {HashgraphProto.proto.SmartContractService}
     */
    get smartContract() {
        if (this._smartContract != null) {
            return this._smartContract;
        }

        this._smartContract = proto.SmartContractService.create(
            this._createUnaryClient("SmartContractService"),
        );

        return this._smartContract;
    }

    /**
     * @returns {HashgraphProto.proto.FileService}
     */
    get file() {
        if (this._file != null) {
            return this._file;
        }

        this._file = proto.FileService.create(
            this._createUnaryClient("FileService"),
        );

        return this._file;
    }

    /**
     * @returns {HashgraphProto.proto.ConsensusService}
     */
    get consensus() {
        if (this._consensus != null) {
            return this._consensus;
        }

        this._consensus = proto.ConsensusService.create(
            this._createUnaryClient("ConsensusService"),
        );

        return this._consensus;
    }

    /**
     * @returns {HashgraphProto.proto.FreezeService}
     */
    get freeze() {
        if (this._freeze != null) {
            return this._freeze;
        }

        this._freeze = proto.FreezeService.create(
            this._createUnaryClient("FreezeService"),
        );

        return this._freeze;
    }

    /**
     * @returns {HashgraphProto.proto.NetworkService}
     */
    get network() {
        if (this._network != null) {
            return this._network;
        }

        this._network = proto.NetworkService.create(
            this._createUnaryClient("NetworkService"),
        );

        return this._network;
    }

    /**
     * @returns {HashgraphProto.proto.TokenService}
     */
    get token() {
        if (this._token != null) {
            return this._token;
        }

        this._token = proto.TokenService.create(
            this._createUnaryClient("TokenService"),
        );

        return this._token;
    }

    /**
     * @returns {HashgraphProto.proto.ScheduleService}
     */
    get schedule() {
        if (this._schedule != null) {
            return this._schedule;
        }

        this._schedule = proto.ScheduleService.create(
            this._createUnaryClient("ScheduleService"),
        );

        return this._schedule;
    }

    /**
     * @returns {HashgraphProto.proto.UtilService}
     */
    get util() {
        if (this._util != null) {
            return this._util;
        }

        this._util = proto.UtilService.create(
            this._createUnaryClient("UtilService"),
        );

        return this._util;
    }

    /**
     * @returns {HashgraphProto.proto.AddressBookService}
     */
    get addressBook() {
        if (this._addressBook != null) {
            return this._addressBook;
        }

        this._addressBook = proto.AddressBookService.create(
            this._createUnaryClient("AddressBookService"),
        );

        return this._addressBook;
    }

    /**
     * @abstract
     * @protected
     * @param {string} serviceName
     * @returns {import("protobufjs").RPCImpl}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _createUnaryClient(serviceName) {
        throw new Error("not implemented");
    }
}

// grpc-web+proto is a series of data or trailer frames

// a frame is identified by a single byte (0 = data or 1 = trailer) followed by 4 bytes for the
// length of the frame, followed by the frame data

/**
 * @param {Uint8Array} data
 * @returns {ArrayBuffer}
 */
export function encodeRequest(data) {
    // for our requests, we want to transfer a single data frame

    const frame = new ArrayBuffer(data.byteLength + 5);

    // the frame type (data) is zero and can be left default-initialized

    // the length of the frame data
    new DataView(frame, 1, 4).setUint32(0, data.length);

    // copy in the frame data
    new Uint8Array(frame, 5).set(data);

    return frame;
}

/**
 * @param {ArrayBuffer} data
 * @param {number} byteOffset
 * @param {number} byteLength
 * @returns {Uint8Array}
 */
export function decodeUnaryResponse(
    data,
    byteOffset = 0,
    byteLength = data.byteLength,
) {
    const dataView = new DataView(data, byteOffset, byteLength);
    let dataOffset = 0;

    /** @type {?Uint8Array} */
    let unaryResponse = null;

    // 0 = successful
    let status = 0;

    while (dataOffset < dataView.byteLength) {
        const frameByte = dataView.getUint8(dataOffset + 0);
        const frameType = frameByte >> 7;
        const frameByteLength = dataView.getUint32(dataOffset + 1);
        const frameOffset = dataOffset + 5; // offset from the start of the dataView
        if (frameOffset + frameByteLength > dataView.byteLength) {
            throw new Error("(BUG) unexpected frame length past the boundary");
        }
        const frameData = new Uint8Array(
            data,
            dataView.byteOffset + frameOffset,
            frameByteLength,
        );

        if (frameType === 0) {
            if (unaryResponse != null) {
                throw new Error(
                    "(BUG) unexpectedly received more than one data frame",
                );
            }

            unaryResponse = frameData;
        } else if (frameType === 1) {
            const trailer = utf8.decode(frameData);
            const [trailerName, trailerValue] = trailer.split(":");

            if (trailerName === "grpc-status") {
                status = parseInt(trailerValue);
            } else {
                throw new Error(`(BUG) unhandled trailer, ${trailer}`);
            }
        } else {
            throw new Error(`(BUG) unexpected frame type: ${frameType}`);
        }

        dataOffset += frameByteLength + 5;
    }

    if (status !== 0) {
        throw new Error(`(BUG) unhandled grpc-status: ${status}`);
    }

    if (unaryResponse == null) {
        throw new Error("(BUG) unexpectedly received no response");
    }

    return unaryResponse;
}
