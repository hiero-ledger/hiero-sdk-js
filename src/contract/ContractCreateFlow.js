// SPDX-License-Identifier: Apache-2.0

import FileCreateTransaction from "../file/FileCreateTransaction.js";
import FileAppendTransaction from "../file/FileAppendTransaction.js";
import FileDeleteTransaction from "../file/FileDeleteTransaction.js";
import ContractCreateTransaction from "./ContractCreateTransaction.js";
import * as utf8 from "../encoding/utf8.js";
import * as hex from "../encoding/hex.js";
import PublicKey from "../PublicKey.js";

/**
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../file/FileId.js").default} FileId
 * @typedef {import("../Key.js").default} Key
 * @typedef {import("./ContractFunctionParameters.js").default} ContractFunctionParameters
 * @typedef {import("../Hbar.js").default} Hbar
 * @typedef {import("../Duration.js").default} Duration
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("../transaction/TransactionReceipt.js").default} TransactionReceipt
 * @typedef {import("../client/Client.js").ClientOperator} ClientOperator
 * @typedef {import("../Signer.js").Signer} Signer
 * @typedef {import("../PrivateKey.js").default} PrivateKey
 * @typedef {import("../transaction/Transaction.js").default} Transaction
 */

/**
 * @typedef {import("bignumber.js").BigNumber} BigNumber
 * @typedef {import("long")} Long
 */

/**
 * A convenience flow that handles the creation of a smart contract on the Hedera network.
 * This flow abstracts away the complexity of the contract creation process by:
 *
 * 1. Creating a file to store the contract bytecode
 * 2. Uploading the contract bytecode in chunks if necessary
 * 3. Creating the contract instance using the uploaded bytecode
 * 4. Cleaning up by deleting the bytecode file (if operator key is available)
 *
 * This flow is particularly useful when deploying large contracts that exceed the 2048 byte
 * limit of a single transaction.
 */
export default class ContractCreateFlow {
    constructor() {
        /** @type {Uint8Array | null} */
        this._bytecode = null;
        this._contractCreate = new ContractCreateTransaction();

        /**
         * Read `Transaction._signerPublicKeys`
         *
         * @internal
         * @type {Set<string>}
         */
        this._signerPublicKeys = new Set();

        /**
         * Read `Transaction._publicKeys`
         *
         * @private
         * @type {PublicKey[]}
         */
        this._publicKeys = [];

        /**
         * Read `Transaction._transactionSigners`
         *
         * @private
         * @type {((message: Uint8Array) => Promise<Uint8Array>)[]}
         */
        this._transactionSigners = [];

        this._maxChunks = null;
    }

    /**
     * @returns {number | null}
     */
    get maxChunks() {
        return this._maxChunks;
    }

    /**
     * @param {number} maxChunks
     * @returns {this}
     */
    setMaxChunks(maxChunks) {
        this._maxChunks = maxChunks;
        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get bytecode() {
        return this._bytecode;
    }

    /**
     * @param {string | Uint8Array} bytecode
     * @returns {this}
     */
    setBytecode(bytecode) {
        this._bytecode =
            bytecode instanceof Uint8Array ? bytecode : utf8.encode(bytecode);

        return this;
    }

    /**
     * @returns {?Key}
     */
    get adminKey() {
        return this._contractCreate.adminKey;
    }

    /**
     * @param {Key} adminKey
     * @returns {this}
     */
    setAdminKey(adminKey) {
        this._contractCreate.setAdminKey(adminKey);
        return this;
    }

    /**
     * @returns {?Long}
     */
    get gas() {
        return this._contractCreate.gas;
    }

    /**
     * @param {number | Long} gas
     * @returns {this}
     */
    setGas(gas) {
        this._contractCreate.setGas(gas);
        return this;
    }

    /**
     * @returns {?Hbar}
     */
    get initialBalance() {
        return this._contractCreate.initialBalance;
    }

    /**
     * Set the initial amount to transfer into this contract.
     *
     * @param {number | string | Long | BigNumber | Hbar} initialBalance
     * @returns {this}
     */
    setInitialBalance(initialBalance) {
        this._contractCreate.setInitialBalance(initialBalance);
        return this;
    }

    /**
     * @deprecated
     * @returns {?AccountId}
     */
    get proxyAccountId() {
        // eslint-disable-next-line deprecation/deprecation
        return this._contractCreate.proxyAccountId;
    }

    /**
     * @deprecated
     * @param {AccountId | string} proxyAccountId
     * @returns {this}
     */
    setProxyAccountId(proxyAccountId) {
        // eslint-disable-next-line deprecation/deprecation
        this._contractCreate.setProxyAccountId(proxyAccountId);
        return this;
    }

    /**
     * @returns {Duration}
     */
    get autoRenewPeriod() {
        return this._contractCreate.autoRenewPeriod;
    }

    /**
     * @param {Duration | Long | number} autoRenewPeriod
     * @returns {this}
     */
    setAutoRenewPeriod(autoRenewPeriod) {
        this._contractCreate.setAutoRenewPeriod(autoRenewPeriod);
        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get constructorParameters() {
        return this._contractCreate.constructorParameters;
    }

    /**
     * @param {Uint8Array | ContractFunctionParameters} constructorParameters
     * @returns {this}
     */
    setConstructorParameters(constructorParameters) {
        this._contractCreate.setConstructorParameters(constructorParameters);
        return this;
    }

    /**
     * @returns {?string}
     */
    get contractMemo() {
        return this._contractCreate.contractMemo;
    }

    /**
     * @param {string} contractMemo
     * @returns {this}
     */
    setContractMemo(contractMemo) {
        this._contractCreate.setContractMemo(contractMemo);
        return this;
    }

    /**
     * @returns {?number}
     */
    get maxAutomaticTokenAssociation() {
        return this._contractCreate.maxAutomaticTokenAssociations;
    }

    /**
     * @param {number} maxAutomaticTokenAssociation
     * @returns {this}
     */
    setMaxAutomaticTokenAssociations(maxAutomaticTokenAssociation) {
        this._contractCreate.setMaxAutomaticTokenAssociations(
            maxAutomaticTokenAssociation,
        );

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get stakedAccountId() {
        return this._contractCreate.stakedAccountId;
    }

    /**
     * @param {AccountId | string} stakedAccountId
     * @returns {this}
     */
    setStakedAccountId(stakedAccountId) {
        this._contractCreate.setStakedAccountId(stakedAccountId);
        return this;
    }

    /**
     * @returns {?Long}
     */
    get stakedNodeId() {
        return this._contractCreate.stakedNodeId;
    }

    /**
     * @param {Long | number} stakedNodeId
     * @returns {this}
     */
    setStakedNodeId(stakedNodeId) {
        this._contractCreate.setStakedNodeId(stakedNodeId);
        return this;
    }

    /**
     * @returns {boolean}
     */
    get declineStakingRewards() {
        return this._contractCreate.declineStakingRewards;
    }

    /**
     * @param {boolean} declineStakingReward
     * @returns {this}
     */
    setDeclineStakingReward(declineStakingReward) {
        this._contractCreate.setDeclineStakingReward(declineStakingReward);
        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get autoRenewAccountId() {
        return this._contractCreate.autoRenewAccountId;
    }

    /**
     * @param {string | AccountId} autoRenewAccountId
     * @returns {this}
     */
    setAutoRenewAccountId(autoRenewAccountId) {
        this._contractCreate.setAutoRenewAccountId(autoRenewAccountId);
        return this;
    }

    /**
     * Sign the transaction with the private key
     * **NOTE**: This is a thin wrapper around `.signWith()`
     *
     * @param {PrivateKey} privateKey
     * @returns {this}
     */
    sign(privateKey) {
        return this.signWith(privateKey.publicKey, (message) =>
            Promise.resolve(privateKey.sign(message)),
        );
    }

    /**
     * Sign the transaction with the public key and signer function
     *
     * If sign on demand is enabled no signing will be done immediately, instead
     * the private key signing function and public key are saved to be used when
     * a user calls an exit condition method (not sure what a better name for this is)
     * such as `toBytes[Async]()`, `getTransactionHash[PerNode]()` or `execute()`.
     *
     * @param {PublicKey} publicKey
     * @param {(message: Uint8Array) => Promise<Uint8Array>} transactionSigner
     * @returns {this}
     */
    signWith(publicKey, transactionSigner) {
        const publicKeyData = publicKey.toBytesRaw();
        const publicKeyHex = hex.encode(publicKeyData);

        if (this._signerPublicKeys.has(publicKeyHex)) {
            // this public key has already signed this transaction
            return this;
        }

        this._publicKeys.push(publicKey);
        this._transactionSigners.push(transactionSigner);

        return this;
    }

    /**
     * @template {Channel} ChannelT
     * @template {MirrorChannel} MirrorChannelT
     * @param {import("../client/Client.js").default<ChannelT, MirrorChannelT>} client
     * @param {number=} requestTimeout
     * @returns {Promise<TransactionResponse>}
     */
    async execute(client, requestTimeout) {
        if (this._bytecode == null) {
            throw new Error("cannot create contract with no bytecode");
        }

        const key = client.operatorPublicKey;

        const fileCreateTransaction = new FileCreateTransaction()
            .setKeys(key != null ? [key] : [])
            .setContents(
                this._bytecode.subarray(
                    0,
                    Math.min(this._bytecode.length, 2048),
                ),
            )
            .freezeWith(client);
        await addSignersToTransaction(
            fileCreateTransaction,
            this._publicKeys,
            this._transactionSigners,
        );

        let response = await fileCreateTransaction.execute(
            client,
            requestTimeout,
        );
        const receipt = await response.getReceipt(client);

        const fileId = /** @type {FileId} */ (receipt.fileId);

        if (this._bytecode.length > 2048) {
            const fileAppendTransaction = new FileAppendTransaction()
                .setFileId(fileId)
                .setContents(this._bytecode.subarray(2048))
                .freezeWith(client);
            await addSignersToTransaction(
                fileAppendTransaction,
                this._publicKeys,
                this._transactionSigners,
            );
            await fileAppendTransaction.execute(client, requestTimeout);
        }

        this._contractCreate.setBytecodeFileId(fileId).freezeWith(client);

        await addSignersToTransaction(
            this._contractCreate,
            this._publicKeys,
            this._transactionSigners,
        );

        response = await this._contractCreate.execute(client, requestTimeout);
        await response.getReceipt(client);

        if (key != null) {
            const fileDeleteTransaction = new FileDeleteTransaction()
                .setFileId(fileId)
                .freezeWith(client);
            await addSignersToTransaction(
                fileDeleteTransaction,
                this._publicKeys,
                this._transactionSigners,
            );
            await (
                await fileDeleteTransaction.execute(client, requestTimeout)
            ).getReceipt(client);
        }

        return response;
    }

    /**
     * @param {Signer} signer
     * @returns {Promise<TransactionResponse>}
     */
    async executeWithSigner(signer) {
        if (this._bytecode == null) {
            throw new Error("cannot create contract with no bytecode");
        }

        if (signer.getAccountKey == null) {
            throw new Error(
                "`Signer.getAccountKey()` is not implemented, but is required for `ContractCreateFlow`",
            );
        }
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const key = await signer.getAccountKey();
        let formattedPublicKey;

        if (key instanceof PublicKey) {
            formattedPublicKey = key;
        } else {
            const propertyValues = Object.values(
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                key._key._key._keyData,
            );
            const keyArray = new Uint8Array(propertyValues);

            formattedPublicKey = PublicKey.fromBytes(keyArray);
        }

        const fileCreateTransaction = await new FileCreateTransaction()
            .setKeys(formattedPublicKey != null ? [formattedPublicKey] : [])
            .setContents(
                this._bytecode.subarray(
                    0,
                    Math.min(this._bytecode.length, 2048),
                ),
            )
            .freezeWithSigner(signer);
        await fileCreateTransaction.signWithSigner(signer);
        await addSignersToTransaction(
            fileCreateTransaction,
            this._publicKeys,
            this._transactionSigners,
        );

        let response = await fileCreateTransaction.executeWithSigner(signer);
        const receipt = await response.getReceiptWithSigner(signer);

        const fileId = /** @type {FileId} */ (receipt.fileId);

        if (this._bytecode.length > 2048) {
            let fileAppendTransaction = new FileAppendTransaction()
                .setFileId(fileId)
                .setContents(this._bytecode.subarray(2048));
            if (this._maxChunks != null) {
                fileAppendTransaction.setMaxChunks(this._maxChunks);
            }
            fileAppendTransaction =
                await fileAppendTransaction.freezeWithSigner(signer);
            await fileAppendTransaction.signWithSigner(signer);
            await addSignersToTransaction(
                fileAppendTransaction,
                this._publicKeys,
                this._transactionSigners,
            );
            await fileAppendTransaction.executeWithSigner(signer);
        }

        this._contractCreate = await this._contractCreate
            .setBytecodeFileId(fileId)
            .freezeWithSigner(signer);
        this._contractCreate =
            await this._contractCreate.signWithSigner(signer);
        await addSignersToTransaction(
            this._contractCreate,
            this._publicKeys,
            this._transactionSigners,
        );

        response = await this._contractCreate.executeWithSigner(signer);

        await response.getReceiptWithSigner(signer);

        if (key != null) {
            const fileDeleteTransaction = await new FileDeleteTransaction()
                .setFileId(fileId)
                .freezeWithSigner(signer);
            await fileDeleteTransaction.signWithSigner(signer);
            await addSignersToTransaction(
                fileDeleteTransaction,
                this._publicKeys,
                this._transactionSigners,
            );
            await (
                await fileDeleteTransaction.executeWithSigner(signer)
            ).getReceiptWithSigner(signer);
        }

        return response;
    }
}

/**
 * @template {Transaction} T
 * @param {T} transaction
 * @param {PublicKey[]} publicKeys
 * @param {((message: Uint8Array) => Promise<Uint8Array>)[]} transactionSigners
 * @returns {Promise<void>}
 */
async function addSignersToTransaction(
    transaction,
    publicKeys,
    transactionSigners,
) {
    for (let i = 0; i < publicKeys.length; i++) {
        await transaction.signWith(publicKeys[i], transactionSigners[i]);
    }
}
