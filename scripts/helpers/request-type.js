/**
 * Finds the highest existing RequestType code in the RequestType.js file
 * @param {string} existingContent - The content of the existing RequestType.js file
 * @returns {number} The highest code found
 */
export function findHighestExistingRequestTypeCode(existingContent) {
    let highestExistingCode = 0;

    // Use regex to find all "new RequestType(NUM)" declarations
    const codeRegex = /new RequestType\((\d+)\)/g;
    let match;

    while ((match = codeRegex.exec(existingContent)) !== null) {
        const code = Number(match[1]);
        if (code > highestExistingCode) {
            highestExistingCode = code;
        }
    }

    console.log(`Highest existing RequestType code: ${highestExistingCode}`);
    return highestExistingCode;
}

/**
 * Updates the toString method with new RequestType codes
 * @param {string} existingContent - The current content of RequestType.js
 * @param {Array<[string, number]>} newFunctionalities - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateRequestTypeToStringMethod(
    existingContent,
    newFunctionalities,
) {
    const toStringStartMarker = "toString() {";
    const toStringEndMarker = "            default:";
    const toStringPos = existingContent.indexOf(toStringStartMarker);

    if (toStringPos === -1) return existingContent;

    const defaultPos = existingContent.indexOf(toStringEndMarker, toStringPos);

    if (defaultPos === -1) return existingContent;

    let toStringInsert = "";
    for (const [name, _] of newFunctionalities) {
        toStringInsert += `            case RequestType.${name}:\n`;
        toStringInsert += `                return "${name}";\n`;
    }

    return (
        existingContent.slice(0, defaultPos) +
        toStringInsert +
        existingContent.slice(defaultPos)
    );
}

/**
 * Updates the _fromCode method with new RequestType codes
 * @param {string} existingContent - The current content of RequestType.js
 * @param {Array<[string, number]>} newFunctionalities - Array of [name, code] pairs
 * @returns {string} Updated file content
 */
export function updateRequestTypeFromCodeMethod(
    existingContent,
    newFunctionalities,
) {
    const fromCodeStartMarker = "static _fromCode(code) {";
    const fromCodeEndMarker = "            default:";
    const fromCodePos = existingContent.indexOf(fromCodeStartMarker);

    if (fromCodePos === -1) {
        // RequestType has a different format
        const altMarker = "static _fromCode(code) {";
        const altPos = existingContent.indexOf(altMarker);
        if (altPos === -1) return existingContent;

        const casesEndMarker = "        }";
        const casesEndPos = existingContent.indexOf(casesEndMarker, altPos);
        if (casesEndPos === -1) return existingContent;

        let fromCodeInsert = "";
        for (const [name, code] of newFunctionalities) {
            fromCodeInsert += `            case ${code}:\n`;
            fromCodeInsert += `                return RequestType.${name};\n`;
        }

        return (
            existingContent.slice(0, casesEndPos) +
            fromCodeInsert +
            existingContent.slice(casesEndPos)
        );
    }

    const defaultPos = existingContent.indexOf(fromCodeEndMarker, fromCodePos);

    if (defaultPos === -1) return existingContent;

    let fromCodeInsert = "";
    for (const [name, code] of newFunctionalities) {
        fromCodeInsert += `            case ${code}:\n`;
        fromCodeInsert += `                return RequestType.${name};\n`;
    }

    return (
        existingContent.slice(0, defaultPos) +
        fromCodeInsert +
        existingContent.slice(defaultPos)
    );
}

/**
 * Generates static properties for RequestType codes
 * @param {Array<[string, number]>} functionalities - Array of [name, code] pairs
 * @returns {string} Generated static properties
 */
export function generateRequestTypeStaticProperties(functionalities) {
    let content = "";
    for (const [name, code] of functionalities) {
        content += `\n/**
 * ${name
     .replace(/([A-Z])/g, " $1")
     .trim()
     .toLowerCase()}
 */
RequestType.${name} = new RequestType(${code});\n`;
    }
    return content;
}

/**
 * Generates the complete RequestType.js file from scratch
 * @param {Object} functionalities - The RequestType codes from proto definitions
 * @returns {string} The complete RequestType.js file content
 */
export function generateCompleteRequestTypeFile(functionalities) {
    // Start with the file header and class definition
    let content = `/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.HederaFunctionality} HieroProto.proto.HederaFunctionality
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
    for (const [name] of Object.entries(functionalities)) {
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
    for (const [name, code] of Object.entries(functionalities)) {
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
    for (const [name, code] of Object.entries(functionalities)) {
        content += `/**
 * ${name
     .replace(/([A-Z])/g, " $1")
     .trim()
     .toLowerCase()}
 */
RequestType.${name} = new RequestType(${code});\n`;
    }

    return content;
}
