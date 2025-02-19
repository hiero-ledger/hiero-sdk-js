// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import FileId from "./FileId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HashgraphProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HashgraphProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HashgraphProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HashgraphProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.IFileGetContentsQuery} HashgraphProto.proto.IFileGetContentsQuery
 * @typedef {import("@hashgraph/proto").proto.IFileGetContentsResponse} HashgraphProto.proto.IFileGetContentsResponse
 * @typedef {import("@hashgraph/proto").proto.FileGetContentsResponse.IFileContents} HashgraphProto.proto.FileGetContentsResponse.IFileContents
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * @augments {Query<Uint8Array>}
 * Retrieve the content of a file in HFS.<br/>
 * Note that this query retrieves _only_ the file content, not any of
 * the metadata for the file.
 */
export default class FileContentsQuery extends Query {
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
     * @param {HashgraphProto.proto.IQuery} query
     * @returns {FileContentsQuery}
     */
    static _fromProtobuf(query) {
        const contents =
            /** @type {HashgraphProto.proto.IFileGetContentsQuery} */ (
                query.fileGetContents
            );

        return new FileContentsQuery({
            fileId:
                contents.fileID != null
                    ? FileId._fromProtobuf(contents.fileID)
                    : undefined,
        });
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
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<HashgraphProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.file.getFileContent(request);
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
     * @returns {FileContentsQuery}
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
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {HashgraphProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const fileGetContents =
            /** @type {HashgraphProto.proto.IFileGetContentsResponse} */ (
                response.fileGetContents
            );
        return /** @type {HashgraphProto.proto.IResponseHeader} */ (
            fileGetContents.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {Promise<Uint8Array>}
     */
    _mapResponse(response) {
        const fileContentsResponse =
            /** @type {HashgraphProto.proto.IFileGetContentsResponse} */ (
                response.fileGetContents
            );
        const fileConents =
            /** @type {HashgraphProto.proto.FileGetContentsResponse.IFileContents} */ (
                fileContentsResponse.fileContents
            );
        const contents = /** @type {Uint8Array} */ (fileConents.contents);

        return Promise.resolve(contents);
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IQueryHeader} header
     * @returns {HashgraphProto.proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            fileGetContents: {
                header,
                fileID:
                    this._fileId != null ? this._fileId._toProtobuf() : null,
            },
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp =
            this._paymentTransactionId != null &&
            this._paymentTransactionId.validStart != null
                ? this._paymentTransactionId.validStart
                : this._timestamp;

        return `FileContentsQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("fileGetContents", FileContentsQuery._fromProtobuf);
