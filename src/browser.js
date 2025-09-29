// SPDX-License-Identifier: Apache-2.0

/**
 * The entry point for Browser applications
 */

export * from "./exports.js";

export { default as Client } from "./client/WebClient.js";
export { default as LocalProvider } from "./LocalProviderWeb.js";
export { default as AddressBookQuery } from "./network/AddressBookQueryWeb.js";
