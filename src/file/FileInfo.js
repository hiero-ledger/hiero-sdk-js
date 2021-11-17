import FileId from "./FileId.js";
import Timestamp from "../Timestamp.js";
import { KeyList } from "@exodus/hashgraph-cryptography";
import Long from "long";
import {
    keyListFromProtobuf,
    keyListToProtobuf,
} from "../cryptography/protobuf.js";
import * as proto from "@exodus/hashgraph-proto";

/**
 * Response when the client sends the node CryptoGetInfoQuery.
 */
export default class FileInfo {
    /**
     * @private
     * @param {object} props
     * @param {FileId} props.fileId
     * @param {Long} props.size
     * @param {Timestamp} props.expirationTime
     * @param {boolean} props.isDeleted
     * @param {KeyList} props.keys
     * @param {string} props.fileMemo
     */
    constructor(props) {
        /**
         * The ID of the file for which information is requested.
         *
         * @readonly
         */
        this.fileId = props.fileId;

        /**
         * Number of bytes in contents.
         *
         * @readonly
         */
        this.size = props.size;

        /**
         * The current time at which this account is set to expire.
         *
         * @readonly
         */
        this.expirationTime = props.expirationTime;

        /**
         * True if deleted but not yet expired.
         *
         * @readonly
         */
        this.isDeleted = props.isDeleted;

        /**
         * One of these keys must sign in order to delete the file.
         * All of these keys must sign in order to update the file.
         *
         * @readonly
         */
        this.keys = props.keys;

        this.fileMemo = props.fileMemo;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.IFileInfo} info
     * @returns {FileInfo}
     */
    static _fromProtobuf(info) {
        const size = /** @type {Long | number} */ (info.size);

        return new FileInfo({
            fileId: FileId._fromProtobuf(
                /** @type {proto.IFileID} */ (info.fileID)
            ),
            size: size instanceof Long ? size : Long.fromValue(size),
            expirationTime: Timestamp._fromProtobuf(
                /** @type {proto.ITimestamp} */ (info.expirationTime)
            ),
            isDeleted: /** @type {boolean} */ (info.deleted),
            keys:
                info.keys != null
                    ? keyListFromProtobuf(info.keys)
                    : new KeyList(),
            fileMemo: info.memo != null ? info.memo : "",
        });
    }

    /**
     * @internal
     * @returns {proto.IFileInfo}
     */
    _toProtobuf() {
        return {
            fileID: this.fileId._toProtobuf(),
            size: this.size,
            expirationTime: this.expirationTime._toProtobuf(),
            deleted: this.isDeleted,
            keys: keyListToProtobuf(this.keys),
            memo: this.fileMemo,
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {FileInfo}
     */
    static fromBytes(bytes) {
        return FileInfo._fromProtobuf(
            proto.FileGetInfoResponse.FileInfo.decode(bytes)
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.FileGetInfoResponse.FileInfo.encode(
            this._toProtobuf()
        ).finish();
    }
}
