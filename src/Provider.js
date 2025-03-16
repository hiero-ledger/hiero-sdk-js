// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./LedgerId.js").default} LedgerId
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./transaction/Transaction.js").default} Transaction
 * @typedef {import("./transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("./transaction/TransactionReceipt.js").default} TransactionReceipt
 * @typedef {import("./transaction/TransactionRecord.js").default} TransactionRecord
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./account/AccountBalance.js").default} AccountBalance
 * @typedef {import("./account/AccountInfo.js").default} AccountInfo
 */

/**
 * @template O
 * @typedef {import("./query/Query.js").default<O>} Query<O>
 */

/**
 * @template RequestT
 * @template ResponseT
 * @template OutputT
 * @typedef {import("./Executable.js").default<RequestT, ResponseT, OutputT>} Executable<RequestT, ResponseT, OutputT>
 */

/**
 * @typedef {object} Provider
 * @property {() => LedgerId?} getLedgerId
 * @property {() => {[key: string]: (string | AccountId)}} getNetwork
 * @property {() => string[]} getMirrorNetwork
 * @property {(accountId: AccountId | string) => Promise<AccountBalance>} getAccountBalance
 * @property {(accountId: AccountId | string) => Promise<AccountInfo>} getAccountInfo
 * @property {(accountId: AccountId | string) => Promise<TransactionRecord[]>} getAccountRecords
 * @property {(transactionId: TransactionId | string) => Promise<TransactionReceipt>} getTransactionReceipt
 * @property {(response: TransactionResponse) => Promise<TransactionReceipt>} waitForReceipt
 * @property {<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>) => Promise<OutputT>} call
 */

export default {};
