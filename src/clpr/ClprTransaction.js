// SPDX-License-Identifier: Apache-2.0

import Transaction from "../transaction/Transaction.js";
import OwnershipProofState from "./OwnershipProofState.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 */

/**
 * Checks CLPR inputs before freezing and before executing decoded frozen bytes.
 * Each transaction supplies its required fields and optional ownership proof.
 * @internal
 */
export default class ClprTransaction extends Transaction {
    /**
     * @protected
     * @abstract
     * @returns {Record<string, unknown>}
     */
    _getRequiredFields() {
        throw new Error("not implemented");
    }

    /**
     * @protected
     * @param {Record<string, unknown>} fields
     * @param {string} [action]
     * @returns {void}
     */
    _requireFields(fields, action = "freezing or executing") {
        for (const [name, value] of Object.entries(fields)) {
            if (value instanceof OwnershipProofState) {
                value.requireComplete(this._getName());
            } else if (value == null) {
                throw new Error(
                    `${this._getName()}: '${name}' must be explicitly set before ${action}.`,
                );
            }
        }
    }

    /**
     * @override
     * @param {?Client} client
     * @returns {this}
     */
    freezeWith(client) {
        this._requireFields(this._getRequiredFields());
        return super.freezeWith(client);
    }

    /**
     * @override
     * @protected
     * @param {Client} client
     * @returns {Promise<void>}
     */
    async _beforeExecute(client) {
        this._requireFields(this._getRequiredFields());
        await super._beforeExecute(client);
    }
}
