import { screamingSnakeToPascalCase } from "../../src/util.js";

/**
 * Finds the highest existing status code in the Status.js file
 * @param {string} existingContent - The content of the existing Status.js file
 * @returns {number} The highest status code found
 */
export function findHighestExistingStatusCode(existingContent) {
    let highestExistingCode = 0;

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
    return highestExistingCode;
}

/**
 * Updates the toString method with new status codes
 * @param {string} existingContent - The current content of Status.js
 * @param {Array<[string, number]>} newStatusCodes - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateStatusToStringMethod(existingContent, newStatusCodes) {
    const toStringStartMarker = "toString() {";
    const toStringEndMarker = "            default:";
    const toStringPos = existingContent.indexOf(toStringStartMarker);

    if (toStringPos === -1) return existingContent;

    const defaultPos = existingContent.indexOf(toStringEndMarker, toStringPos);

    if (defaultPos === -1) return existingContent;

    let toStringInsert = "";
    for (const [name, _] of newStatusCodes) {
        const pascalCase = screamingSnakeToPascalCase(name);
        toStringInsert += `            case Status.${pascalCase}:\n`;
        toStringInsert += `                return "${name}";\n`;
    }

    return (
        existingContent.slice(0, defaultPos) +
        toStringInsert +
        existingContent.slice(defaultPos)
    );
}

/**
 * Updates the _fromCode method with new status codes
 * @param {string} existingContent - The current content of Status.js
 * @param {Array<[string, number]>} newStatusCodes - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateStatusFromCodeMethod(existingContent, newStatusCodes) {
    const fromCodeStartMarker = "static _fromCode(code) {";
    const fromCodeEndMarker = "            default:";
    const fromCodePos = existingContent.indexOf(fromCodeStartMarker);

    if (fromCodePos === -1) return existingContent;

    const defaultPos = existingContent.indexOf(fromCodeEndMarker, fromCodePos);

    if (defaultPos === -1) return existingContent;

    let fromCodeInsert = "";
    for (const [name, code] of newStatusCodes) {
        const pascalCase = screamingSnakeToPascalCase(name);
        fromCodeInsert += `            case ${code}:\n`;
        fromCodeInsert += `                return Status.${pascalCase};\n`;
    }

    return (
        existingContent.slice(0, defaultPos) +
        fromCodeInsert +
        existingContent.slice(defaultPos)
    );
}

/**
 * Generates static properties for status codes
 * @param {Array<[string, number]>} statusCodes - Array of [name, code] pairs
 * @returns {string} Generated static properties
 */
export function generateStatusStaticProperties(statusCodes) {
    let content = "";
    for (const [name, code] of statusCodes) {
        const pascalCase = screamingSnakeToPascalCase(name);
        content += `/* ${name.toLowerCase().split("_").join(" ")} */\n`;
        content += `Status.${pascalCase} = new Status(${code});\n`;
    }
    return content;
}

/**
 * Generates the complete Status.js file from scratch
 * @param {Object} statusCodes - The status codes from proto definitions
 * @returns {string} The complete Status.js file content
 */
export function generateCompleteStatusFile(statusCodes) {
    // Start with the file header and class definition
    let content = `/**
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
        content += `/* ${name.toLowerCase().split("_").join(" ")} */\n`;
        content += `Status.${pascalCase} = new Status(${code});\n\n`;
    }

    return content;
}
