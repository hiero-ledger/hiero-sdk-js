// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./LedgerId.js").default} LedgerId
 * @typedef {import("./SignerSignature.js").default} SignerSignature
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./transaction/Transaction.js").default} Transaction
 * @typedef {import("./transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("./transaction/TransactionReceipt.js").default} TransactionReceipt
 * @typedef {import("./transaction/TransactionRecord.js").default} TransactionRecord
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./account/AccountBalance.js").default} AccountBalance
 * @typedef {import("./account/AccountInfo.js").default} AccountInfo
 * @typedef {import("./Key.js").default} Key
 */

/**
 * @template {any} O
 * @typedef {import("./query/Query.js").default<O>} Query<O>
 */

/**
 * @template RequestT
 * @template ResponseT
 * @template OutputT
 * @typedef {import("./Executable.js").default<RequestT, ResponseT, OutputT>} Executable<RequestT, ResponseT, OutputT>
 */

/**
 * @typedef {object} Signer
 * @property {() => LedgerId?} getLedgerId
 * @property {() => AccountId} getAccountId
 * @property {() => Key} [getAccountKey]
 * @property {() => {[key: string]: (string | AccountId)}} getNetwork
 * @property {() => string[]} getMirrorNetwork
 * @property {(messages: Uint8Array[]) => Promise<SignerSignature[]>} sign
 * @property {() => Promise<AccountBalance>} getAccountBalance
 * @property {() => Promise<AccountInfo>} getAccountInfo
 * @property {() => Promise<TransactionRecord[]>} getAccountRecords
 * @property {<T extends Transaction>(transaction: T) => Promise<T>} signTransaction
 * @property {<T extends Transaction>(transaction: T) => Promise<T>} checkTransaction
 * @property {<T extends Transaction>(transaction: T) => Promise<T>} populateTransaction
 * @property {<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>) => Promise<OutputT>} call
 */

export default {};
