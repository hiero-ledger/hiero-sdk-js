#!/usr/bin/env node
/**
 * Helper script to extract account information from Solo CLI output and convert to JSON.
 *
 * This script parses Solo's account creation output and extracts:
 * - Account ID
 * - Public Key
 * - Account Alias (if present)
 *
 * Usage:
 *   solo account create ... | node extractAccountAsJson.js
 */

import { createInterface } from "readline";

/**
 * Extract account information from Solo CLI output.
 *
 * @param {string} text - The output from Solo CLI account creation command
 * @returns {Object} Object containing accountId, publicKey, and optionally alias
 */
function extractAccountInfo(text) {
    const result = {};

    // Extract Account ID - matches patterns like "0.0.1234"
    const accountIdMatch = text.match(
        /accountId[:\s]+([0-9]+\.[0-9]+\.[0-9]+)/i,
    );
    if (accountIdMatch) {
        result.accountId = accountIdMatch[1];
    }

    // Extract Public Key - matches hex strings typically 64+ characters
    const publicKeyMatch = text.match(/publicKey[:\s]+([0-9a-fA-F]{64,})/i);
    if (publicKeyMatch) {
        result.publicKey = publicKeyMatch[1];
    }

    // Extract Account Alias if present
    const aliasMatch = text.match(/alias[:\s]+([0-9a-fA-F]+)/i);
    if (aliasMatch) {
        result.alias = aliasMatch[1];
    }

    // If standard format doesn't match, try alternate parsing
    // Solo might output in different formats depending on version
    if (!result.accountId) {
        // Try to find any pattern that looks like an account ID
        const altIdMatch = text.match(/\b([0-9]+\.[0-9]+\.[0-9]{3,})\b/);
        if (altIdMatch) {
            result.accountId = altIdMatch[1];
        }
    }

    if (!result.publicKey) {
        // Try to find any hex string that could be a public key
        const altKeyMatch = text.match(/\b([0-9a-fA-F]{64,})\b/);
        if (altKeyMatch) {
            result.publicKey = altKeyMatch[1];
        }
    }

    return result;
}

/**
 * Main function to read from stdin and output JSON.
 */
async function main() {
    try {
        // Read all input from stdin
        let inputText = "";

        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });

        for await (const line of rl) {
            inputText += line + "\n";
        }

        if (!inputText.trim()) {
            console.error(JSON.stringify({ error: "No input received" }));
            process.exit(1);
        }

        // Extract account information
        const accountInfo = extractAccountInfo(inputText);

        // Validate that we got at least an account ID
        if (!accountInfo.accountId) {
            console.error(
                JSON.stringify({
                    error: "Could not extract account ID from output",
                }),
            );
            console.error(`Input was:\n${inputText}`);
            process.exit(1);
        }

        // Output as JSON
        console.log(JSON.stringify(accountInfo));
        process.exit(0);
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

// Run main function
main();
