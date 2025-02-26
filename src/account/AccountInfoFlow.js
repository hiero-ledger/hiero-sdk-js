// SPDX-License-Identifier: Apache-2.0

import AccountInfoQuery from "./AccountInfoQuery.js";
import KeyList from "../KeyList.js";

/**
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/Transaction.js").default} Transaction
 * @typedef {import("../PublicKey.js").default} PublicKey
 * @typedef {import("./AccountId.js").default} AccountId
 * @typedef {import("../Signer.js").Signer} Signer
 */

/**
 * This class provides static methods to verify signatures and transactions by fetching the account's key
 * from the network. It supports both Client and Signer-based operations.
 *
 * The class provides methods to:
 * - Verify message signatures using account public key
 * - Verify transaction signatures using account public key
 * - Perform verifications using either a Client or Signer instance
 */
export default class AccountInfoFlow {
    /**
     * @param {Client} client
     * @param {AccountId | string} accountId
     * @param {Uint8Array} message
     * @param {Uint8Array} signature
     * @returns {Promise<boolean>}
     */
    static async verifySignature(client, accountId, message, signature) {
        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(client);

        if (info.key instanceof KeyList) {
            return false;
        }

        return /** @type {PublicKey} */ (info.key).verify(message, signature);
    }

    /**
     * @param {Client} client
     * @param {AccountId | string} accountId
     * @param {Transaction} transaction
     * @returns {Promise<boolean>}
     */
    static async verifyTransaction(client, accountId, transaction) {
        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(client);

        if (info.key instanceof KeyList) {
            return false;
        }

        return /** @type {PublicKey} */ (info.key).verifyTransaction(
            transaction,
        );
    }

    /**
     * @param {Signer} signer
     * @param {AccountId | string} accountId
     * @param {Uint8Array} message
     * @param {Uint8Array} signature
     * @returns {Promise<boolean>}
     */
    static async verifySignatureWithSigner(
        signer,
        accountId,
        message,
        signature,
    ) {
        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .executeWithSigner(signer);

        if (info.key instanceof KeyList) {
            return false;
        }

        return /** @type {PublicKey} */ (info.key).verify(message, signature);
    }

    /**
     * @param {Signer} signer
     * @param {AccountId | string} accountId
     * @param {Transaction} transaction
     * @returns {Promise<boolean>}
     */
    static async verifyTransactionWithSigner(signer, accountId, transaction) {
        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .executeWithSigner(signer);

        if (info.key instanceof KeyList) {
            return false;
        }

        return /** @type {PublicKey} */ (info.key).verifyTransaction(
            transaction,
        );
    }
}
