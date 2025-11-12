import fs from "fs";
import path from "path";

/**
 * Get the comment for a specific functionality from the proto file
 * @param {string} name - The functionality name
 * @returns {string} The comment associated with the functionality
 */
function getRequestTypeComment(name) {
    try {
        const protoPath = path.join(
            process.cwd(),
            "packages/proto/src/proto/services/basic_types.proto",
        );
        const protoContent = fs.readFileSync(protoPath, "utf8");

        // Find the comment for the functionality
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

    // Return a default comment based on the name if not found
    return name
        .replace(/([A-Z])/g, " $1")
        .trim()
        .toLowerCase();
}

/**
 * Finds the highest existing RequestType code in the RequestType.js file
 * @param {string} existingContent - The content of the existing RequestType.js file
 * @returns {number} The highest code found
 */
export function findHighestExistingRequestTypeCode(existingContent) {
    let highestExistingCode = 0;

    try {
        // Use regex to find all "new RequestType(NUM)" declarations
        const codeRegex = /new RequestType\((\d+)\)/g;
        let match;

        while ((match = codeRegex.exec(existingContent)) !== null) {
            const code = Number(match[1]);
            if (code > highestExistingCode) {
                highestExistingCode = code;
            }
        }

        console.log(
            `Highest existing RequestType code: ${highestExistingCode}`,
        );
    } catch (error) {
        console.error(
            `Error finding highest RequestType code: ${error.message}`,
        );
    }

    return highestExistingCode;
}

/**
 * Updates the toString method with new RequestType codes
 * @param {string} existingContent - The current content of RequestType.js
 * @param {Array<[string, number]>} newRequestTypes - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateRequestTypeToStringMethod(
    existingContent,
    newRequestTypes,
) {
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
        for (const [name, _] of newRequestTypes) {
            toStringMethodInsert += `            case RequestType.${name}:\n`;
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
 * Updates the _fromCode method with new RequestType codes
 * @param {string} existingContent - The current content of RequestType.js
 * @param {Array<[string, number]>} newRequestTypes - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateRequestTypeFromCodeMethod(
    existingContent,
    newRequestTypes,
) {
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

        if (defaultPos === -1) {
            // If no default case found, try to find the end of the switch statement
            const switchEndMarker = "        }";

            // Find the position of the end of the switch statement
            const switchEndPos = existingContent.indexOf(
                switchEndMarker,
                switchPos,
            );
            if (switchEndPos === -1) {
                console.warn(
                    "Could not find appropriate insertion point in _fromCode method",
                );
                return existingContent;
            }

            // Insert the new cases
            let fromCodeInsert = "";
            for (const [name, code] of newRequestTypes) {
                fromCodeInsert += `            case ${code}:\n`;
                fromCodeInsert += `                return RequestType.${name};\n`;
            }

            return (
                existingContent.slice(0, switchEndPos) +
                fromCodeInsert +
                existingContent.slice(switchEndPos)
            );
        }

        // Normal case - insert before default
        let fromCodeInsert = "";
        for (const [name, code] of newRequestTypes) {
            fromCodeInsert += `            case ${code}:\n`;
            fromCodeInsert += `                return RequestType.${name};\n`;
        }

        return (
            existingContent.slice(0, defaultPos) +
            fromCodeInsert +
            existingContent.slice(defaultPos)
        );
    } catch (error) {
        console.error(`Error updating _fromCode method: ${error.message}`);
        return existingContent;
    }
}

/**
 * Generates static properties for RequestType codes
 * @param {Array<[string, number]>} requestTypes - Array of [name, code] pairs
 * @returns {string} Generated static properties
 */
export function generateRequestTypeStaticProperties(requestTypes) {
    try {
        let content = "";
        for (const [name, code] of requestTypes) {
            const comment = getRequestTypeComment(name);
            content += `\n/**
 * ${comment}
 */
RequestType.${name} = new RequestType(${code});\n`;
        }
        return content;
    } catch (error) {
        console.error(`Error generating static properties: ${error.message}`);
        return "";
    }
}

/**
 * Generates the complete RequestType.js file from scratch
 * @param {Object} requestTypes - The RequestType codes from proto definitions
 * @returns {string} The complete RequestType.js file content
 */
export function generateCompleteRequestTypeFile(requestTypes) {
    try {
        // Start with the file header and class definition
        let content = `// SPDX-License-Identifier: Apache-2.0\n
/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.HederaFunctionality} HieroProto.proto.HederaFunctionality
 */

export default class RequestType {
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
        for (const [name] of Object.entries(requestTypes)) {
            content += `            case RequestType.${name}:\n`;
            content += `                return "${name}";\n`;
        }

        content += `            default:
                return \`UNKNOWN (\${this._code})\`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {RequestType}
     */
    static _fromCode(code) {
        switch (code) {
`;

        // Generate _fromCode() cases
        for (const [name, code] of Object.entries(requestTypes)) {
            content += `            case ${code}:\n`;
            content += `                return RequestType.${name};\n`;
        }

        content += `        }

        throw new Error(
            \`(BUG) RequestType.fromCode() does not handle code: \${code}\`,
        );
    }

    /**
     * @returns {HieroProto.proto.HederaFunctionality}
     */
    valueOf() {
        return this._code;
    }
}

`;

        // Generate static properties
        for (const [name, code] of Object.entries(requestTypes)) {
            const comment = getRequestTypeComment(name);
            content += `/**
 * ${comment}
 */
RequestType.${name} = new RequestType(${code});\n\n`;
        }

        return content;
    } catch (error) {
        console.error(
            `Error generating complete RequestType file: ${error.message}`,
        );
        return error;
    }
}
