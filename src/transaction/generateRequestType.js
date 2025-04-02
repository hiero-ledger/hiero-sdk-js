import * as HieroProto from "@hashgraph/proto";
import fs from "fs";
import path from "path";

/**
 * Converts a SCREAMING_SNAKE_CASE string to PascalCase
 * @param {string} name - The string to convert
 * @returns {string} The converted PascalCase string
 */
function toPascalCase(name) {
    const words = name.toLowerCase().split("_");
    let result = "";
    for (let i = 0; i < words.length; i++) {
        result += words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    return result;
}

/**
 * Generates the RequestType.js file dynamically based on HederaFunctionality proto definitions
 */
function generateRequestTypeFile() {
    const functionalities = HieroProto.proto.HederaFunctionality;

    // Start with the file header and class definition
    let content = `// SPDX-License-Identifier: Apache-2.0

/**
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
            RequestType.${name} = new RequestType(${code});\n\n`;
    }

    // Write the file
    fs.writeFileSync(
        path.join(process.cwd(), "../../src/RequestType.js"),
        content,
        "utf8",
    );
}

/**
 * Generates the Status.js file dynamically based on ResponseCodeEnum proto definitions
 */
function generateStatusFile() {
    const statusCodes = HieroProto.proto.ResponseCodeEnum;

    // Start with the file header and class definition
    let content = `// SPDX-License-Identifier: Apache-2.0

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
        const pascalCase = toPascalCase(name);
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
        const pascalCase = toPascalCase(name);
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

    // Generate static properties with PascalCase names
    for (const [name, code] of Object.entries(statusCodes)) {
        const pascalCase = toPascalCase(name);
        content += `/* ${name.toLowerCase().split("_").join(" ")} */
        Status.${pascalCase} = new Status(${code});\n\n`;
    }

    // Write the file
    fs.writeFileSync(
        path.join(process.cwd(), "../../src/Status.js"),
        content,
        "utf8",
    );
}

// Generate both files
generateRequestTypeFile();
generateStatusFile();
