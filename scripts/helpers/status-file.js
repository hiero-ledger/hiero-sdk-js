import fs from "fs";
import path from "path";

import { screamingSnakeToPascalCase } from "../../src/util.js";

/**
 * Finds the highest existing status code in the Status.js file
 * @param {string} existingContent - The content of the existing Status.js file
 * @returns {number} The highest status code found
 */
export function findHighestExistingStatusCode(existingContent) {
    let highestExistingCode = 0;

    try {
        // Use regex to find all "new Status(NUM)" declarations
        const codeRegex = /new Status\((\d+)\)/g;
        let match;

        while ((match = codeRegex.exec(existingContent)) !== null) {
            const code = Number(match[1]);
            if (code > highestExistingCode) {
                highestExistingCode = code;
            }
        }

        console.log(`Highest existing status code: ${highestExistingCode}`);
    } catch (error) {
        console.error(`Error finding highest status code: ${error.message}`);
    }

    return highestExistingCode;
}

/**
 * Get the comment for a specific response code from the proto file
 * @param {string} name - The response code name
 * @returns {string} The comment associated with the response code
 */
function getResponseCodeComment(name) {
    try {
        const protoPath = path.join(
            process.cwd(),
            "packages/proto/src/proto/services_response_code.proto",
        );
        const protoContent = fs.readFileSync(protoPath, "utf8");

        // Find the comment for the status code
        const pattern = new RegExp(
            `\\/\\*\\*[^*]*\\*+(?:[^/*][^*]*\\*+)*\\/[\\s]*${name}\\s*=\\s*\\d+`,
            "m",
        );
        const match = protoContent.match(pattern);

        if (match) {
            // Extract the comment
            const commentMatch = match[0].match(/\/\*\*([\s\S]*?)\*\//);
            if (commentMatch) {
                // Format the comment: Remove * at the beginning of lines and trim
                let comment = commentMatch[1]
                    .split("\n")
                    .map((line) => line.replace(/^\s*\*\s*/, "").trim())
                    .filter((line) => line.length > 0)
                    .join(" ");

                return comment;
            }
        }
    } catch (error) {
        console.warn(`Could not get comment for ${name}: ${error.message}`);
    }

    // Return a default comment if not found
    return `${name.toLowerCase().split("_").join(" ")}`;
}

/**
 * Updates the toString method with new status codes
 * @param {string} existingContent - The current content of Status.js
 * @param {Array<[string, number]>} newStatusCodes - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateStatusToStringMethod(existingContent, newStatusCodes) {
    try {
        const toStringMethodStartMarker = "toString() {";
        const toStringMethodEndMarker = "            default:";

        // Find the position of the toString() method
        const toStringMethodPos = existingContent.indexOf(
            toStringMethodStartMarker,
        );
        if (toStringMethodPos === -1) {
            console.warn("toString() method marker not found in file");
            return existingContent;
        }

        // Find the position of the default case
        const defaultPos = existingContent.indexOf(
            toStringMethodEndMarker,
            toStringMethodPos,
        );
        if (defaultPos === -1) {
            console.warn("default case marker not found in toString() method");
            return existingContent;
        }

        let toStringMethodInsert = "";
        for (const [name, _] of newStatusCodes) {
            const pascalCase = screamingSnakeToPascalCase(name);
            toStringMethodInsert += `            case Status.${pascalCase}:\n`;
            toStringMethodInsert += `                return "${name}";\n`;
        }

        return (
            existingContent.slice(0, defaultPos) +
            toStringMethodInsert +
            existingContent.slice(defaultPos)
        );
    } catch (error) {
        console.error(`Error updating toString method: ${error.message}`);
        return existingContent;
    }
}

/**
 * Updates the _fromCode method with new status codes
 * @param {string} existingContent - The current content of Status.js
 * @param {Array<[string, number]>} newStatusCodes - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateStatusFromCodeMethod(existingContent, newStatusCodes) {
    try {
        const fromCodeMethodStartMarker = "static _fromCode(code) {";
        const switchStartMarker = "        switch (code) {";
        const fromCodeMethodEndMarker = "            default:";

        // Find the position of the _fromCode method
        const fromCodeMethodPos = existingContent.indexOf(
            fromCodeMethodStartMarker,
        );
        if (fromCodeMethodPos === -1) {
            console.warn("_fromCode method not found in file");
            return existingContent;
        }

        // Find the position of the switch statement
        const switchPos = existingContent.indexOf(
            switchStartMarker,
            fromCodeMethodPos,
        );
        if (switchPos === -1) {
            console.warn("switch statement not found in file");
            return existingContent;
        }

        // Find the position of the default case
        const defaultPos = existingContent.indexOf(
            fromCodeMethodEndMarker,
            fromCodeMethodPos,
        );

        let fromCodeMethodInsert = "";
        for (const [name, code] of newStatusCodes) {
            const pascalCase = screamingSnakeToPascalCase(name);
            fromCodeMethodInsert += `            case ${code}:\n`;
            fromCodeMethodInsert += `                return Status.${pascalCase};\n`;
        }

        return (
            existingContent.slice(0, defaultPos) +
            fromCodeMethodInsert +
            existingContent.slice(defaultPos)
        );
    } catch (error) {
        console.error(`Error updating _fromCode method: ${error.message}`);
        return existingContent;
    }
}

/**
 * Generates static properties for status codes
 * @param {Array<[string, number]>} statusCodes - Array of [name, code] pairs
 * @returns {string} Generated static properties
 */
export function generateStatusStaticProperties(statusCodes) {
    try {
        let content = "";
        for (const [name, code] of statusCodes) {
            const pascalCase = screamingSnakeToPascalCase(name);
            const comment = getResponseCodeComment(name);
            content += `\n/**\n * ${comment}\n */\n`;
            content += `Status.${pascalCase} = new Status(${code});\n`;
        }
        return content;
    } catch (error) {
        console.error(`Error generating static properties: ${error.message}`);
        return "";
    }
}

/**
 * Generates the complete Status.js file from scratch
 * @param {Object} statusCodes - The status codes from proto definitions
 * @returns {string} The complete Status.js file content
 */
export function generateCompleteStatusFile(statusCodes) {
    try {
        // Start with the file header and class definition
        let content = `// SPDX-License-Identifier: Apache-2.0\n
/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ResponseCodeEnum} HieroProto.proto.ResponseCodeEnum
 */

export default class Status {
    /**
     * @hideconstructor
     * @internal
     * @param {number} code
     */
    constructor(code) {
        /** @readonly */
        this._code = code;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
`;

        // Generate toString() cases
        for (const [name] of Object.entries(statusCodes)) {
            const pascalCase = screamingSnakeToPascalCase(name);
            content += `            case Status.${pascalCase}:\n`;
            content += `                return "${name}";\n`;
        }

        content += `            default:
                return \`UNKNOWN (\${this._code})\`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {Status}
     */
    static _fromCode(code) {
        switch (code) {
`;

        // Generate _fromCode() cases
        for (const [name, code] of Object.entries(statusCodes)) {
            const pascalCase = screamingSnakeToPascalCase(name);
            content += `            case ${code}:\n`;
            content += `                return Status.${pascalCase};\n`;
        }

        content += `            default:
                throw new Error(
                    \`(BUG) Status.fromCode() does not handle code: \${code}\`,
                );
        }
    }

    /**
     * @returns {HieroProto.proto.ResponseCodeEnum}
     */
    valueOf() {
        return this._code;
    }
}

`;

        // Generate static properties
        for (const [name, code] of Object.entries(statusCodes)) {
            const pascalCase = screamingSnakeToPascalCase(name);
            const comment = getResponseCodeComment(name);
            content += `/**\n * ${comment}\n */\n`;
            content += `Status.${pascalCase} = new Status(${code});\n\n`;
        }

        return content;
    } catch (error) {
        console.error(
            `Error generating complete Status file: ${error.message}`,
        );
        return error;
    }
}
