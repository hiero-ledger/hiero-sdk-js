// SPDX-License-Identifier: Apache-2.0

/**
 * The entry point for Browser applications
 */

export * from "./exports.js";
// Fills the lookup tables behind fromBytes(), schedule() and key parsing.
// Imported after exports.js so the classes load in the same order as before.
import "./registry.js";

export { default as Client } from "./client/WebClient.js";
export { default as DefaultHttpTransport } from "./http/FetchHttpTransport.js";
export { default as LocalProvider } from "./LocalProviderWeb.js";
export { default as AddressBookQuery } from "./network/AddressBookQueryWeb.js";
