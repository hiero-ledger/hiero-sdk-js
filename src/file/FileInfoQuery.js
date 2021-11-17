import Query, { QUERY_REGISTRY } from "../query/Query.js";
import FileId from "./FileId.js";
import FileInfo from "./FileInfo.js";
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IResponseHeader} proto.IResponseHeader
 * @typedef {import("@exodus/hashgraph-proto").IFileGetInfoQuery} proto.IFileGetInfoQuery
 * @typedef {import("@exodus/hashgraph-proto").IFileGetInfoResponse} proto.IFileGetInfoResponse
 * @typedef {import("@exodus/hashgraph-proto").IFileInfo} proto.IFileInfo
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * @augments {Query<FileInfo>}
 */
export default class FileInfoQuery extends Query {
    /**
     * @param {object} [props]
     * @param {FileId | string} [props.fileId]
     */
    constructor(props = {}) {
        super();

        /**
         * @type {?FileId}
         * @private
         */
        this._fileId = null;
        if (props.fileId != null) {
            this.setFileId(props.fileId);
        }
    }

    /**
     * @internal
     * @param {proto.IQuery} query
     * @returns {FileInfoQuery}
     */
    static _fromProtobuf(query) {
        const info = /** @type {proto.IFileGetInfoQuery} */ (query.fileGetInfo);

        return new FileInfoQuery({
            fileId:
                info.fileID != null
                    ? FileId._fromProtobuf(info.fileID)
                    : undefined,
        });
    }

    /**
     * @returns {?FileId}
     */
    get fileId() {
        return this._fileId;
    }

    /**
     * Set the file ID for which the info is being requested.
     *
     * @param {FileId | string} fileId
     * @returns {FileInfoQuery}
     */
    setFileId(fileId) {
        this._fileId =
            typeof fileId === "string"
                ? FileId.fromString(fileId)
                : fileId.clone();

        return this;
    }

    /**
     * @override
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @returns {Promise<Hbar>}
     */
    async getCost(client) {
        let cost = await super.getCost(client);

        if (cost.toTinybars().greaterThan(25)) {
            return cost;
        } else {
            return Hbar.fromTinybars(25);
        }
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._fileId != null) {
            this._fileId.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {proto.IQuery} request
     * @returns {Promise<proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.file.getFileInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @returns {proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const fileGetInfo = /** @type {proto.IFileGetInfoResponse} */ (
            response.fileGetInfo
        );
        return /** @type {proto.IResponseHeader} */ (fileGetInfo.header);
    }

    /**
     * @protected
     * @override
     * @param {proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {proto.IQuery} request
     * @returns {Promise<FileInfo>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const info = /** @type {proto.IFileGetInfoResponse} */ (
            response.fileGetInfo
        );

        return Promise.resolve(
            FileInfo._fromProtobuf(
                /** @type {proto.IFileInfo} */ (info.fileInfo)
            )
        );
    }

    /**
     * @override
     * @internal
     * @param {proto.IQueryHeader} header
     * @returns {proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            fileGetInfo: {
                header,
                fileID:
                    this._fileId != null ? this._fileId._toProtobuf() : null,
            },
        };
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("fileGetInfo", FileInfoQuery._fromProtobuf);
