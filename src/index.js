// SPDX-License-Identifier: Apache-2.0

/**
 * The entry point for NodeJS applications
 */

export * from "./exports.js";
// Fills the lookup tables behind fromBytes(), schedule() and key parsing.
// Imported after exports.js so the classes load in the same order as before.
import "./registry.js";

export { default as LocalProvider } from "./LocalProvider.js";
export { default as Client } from "./client/NodeClient.js";
export {
    default as DefaultHttpTransport,
    default as NodeHttpTransport,
} from "./http/NodeHttpTransport.js";
export { default as AddressBookQuery } from "./network/AddressBookQuery.js";
