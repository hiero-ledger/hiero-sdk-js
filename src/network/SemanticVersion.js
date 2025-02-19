// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hashgraph/proto";
/**
 * Represents a semantic versioning structure for software components.
 *
 * This class encapsulates the major, minor, and patch version numbers, following
 * the Semantic Versioning (SemVer) specification. It provides methods for creating,
 * comparing, and manipulating version numbers, ensuring that versioning adheres to
 * the SemVer rules.
 */
export default class SemanticVersion {
    /**
     * @private
     * @param {object} props
     * @param {number} props.major
     * @param {number} props.minor
     * @param {number} props.patch
     */
    constructor(props) {
        /** @readonly */
        this.major = props.major;
        /** @readonly */
        this.minor = props.minor;
        /** @readonly */
        this.patch = props.patch;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HieroProto.proto.ISemanticVersion} version
     * @returns {SemanticVersion}
     */
    static _fromProtobuf(version) {
        return new SemanticVersion({
            major: /** @type {number} */ (version.major),
            minor: /** @type {number} */ (version.minor),
            patch: /** @type {number} */ (version.patch),
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ISemanticVersion}
     */
    _toProtobuf() {
        return {
            major: this.major,
            minor: this.minor,
            patch: this.patch,
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {SemanticVersion}
     */
    static fromBytes(bytes) {
        return SemanticVersion._fromProtobuf(
            HieroProto.proto.SemanticVersion.decode(bytes),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.SemanticVersion.encode(
            this._toProtobuf(),
        ).finish();
    }
}
