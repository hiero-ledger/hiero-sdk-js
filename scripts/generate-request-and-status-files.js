import * as HieroProto from "@hashgraph/proto";
import fs from "fs";
import path from "path";

import {
    findHighestExistingRequestTypeCode,
    updateRequestTypeToStringMethod,
    updateRequestTypeFromCodeMethod,
    generateRequestTypeStaticProperties,
    generateCompleteRequestTypeFile,
} from "./helpers/request-type.js";

import {
    findHighestExistingStatusCode,
    updateStatusToStringMethod,
    updateStatusFromCodeMethod,
    generateStatusStaticProperties,
    generateCompleteStatusFile,
} from "./helpers/status-file.js";

/**
 * Generates the RequestType.js file dynamically based on HederaFunctionality proto definitions
 */
function generateRequestTypeFile() {
    const requestTypePath = path.join(process.cwd(), "src/RequestType.js");
    let existingContent = "";

    if (fs.existsSync(requestTypePath)) {
        existingContent = fs.readFileSync(requestTypePath, "utf8");
    }

    const functionalities = HieroProto.proto.HederaFunctionality;

    // If we have existing content, update the file by appending new codes
    if (existingContent) {
        const highestExistingCode =
            findHighestExistingRequestTypeCode(existingContent);

        // Filter only new request types
        const newRequestTypes = Object.entries(functionalities).filter(
            ([_, code]) => code > highestExistingCode,
        );

        if (newRequestTypes.length === 0) {
            console.log("No new functionalities to add.");
            return;
        }

        console.log(
            `Found ${newRequestTypes.length} new functionality/functionalities to add.`,
        );

        // Update the toString method
        let updatedContent = updateRequestTypeToStringMethod(
            existingContent,
            newRequestTypes,
        );

        // Update the _fromCode method
        updatedContent = updateRequestTypeFromCodeMethod(
            updatedContent,
            newRequestTypes,
        );

        // Append new static properties
        const newProperties =
            generateRequestTypeStaticProperties(newRequestTypes);
        updatedContent += newProperties;

        // Write the updated file
        fs.writeFileSync(requestTypePath, updatedContent, "utf8");
        console.log(
            `Updated RequestType.js with ${newRequestTypes.length} new functionality/functionalities.`,
        );
        return;
    }

    // If we don't have existing content, generate the entire file
    const completeFileContent =
        generateCompleteRequestTypeFile(functionalities);

    // Write the file
    fs.writeFileSync(requestTypePath, completeFileContent, "utf8");
    console.log("Generated new RequestType.js file.");
}

/**
 * Generates the Status.js file dynamically based on ResponseCodeEnum proto definitions
 */
function generateStatusFile() {
    const statusPath = path.join(process.cwd(), "src/Status.js");
    let existingContent = "";

    if (fs.existsSync(statusPath)) {
        existingContent = fs.readFileSync(statusPath, "utf8");
    }

    const statusCodes = HieroProto.proto.ResponseCodeEnum;

    // If we have existing content, update the file by appending new codes
    if (existingContent) {
        const highestExistingCode =
            findHighestExistingStatusCode(existingContent);

        // Filter only new status codes that are higher than the highest existing one
        const newStatusCodes = Object.entries(statusCodes).filter(
            ([_, code]) => code > highestExistingCode,
        );

        if (newStatusCodes.length === 0) {
            console.log("No new status codes to add.");
            return;
        }

        console.log(
            `Found ${newStatusCodes.length} new status code(s) to add.`,
        );

        // Update the toString method
        let updatedContent = updateStatusToStringMethod(
            existingContent,
            newStatusCodes,
        );

        // Update the _fromCode method
        updatedContent = updateStatusFromCodeMethod(
            updatedContent,
            newStatusCodes,
        );

        // Append new static properties
        const newProperties = generateStatusStaticProperties(newStatusCodes);
        updatedContent += newProperties;

        // Write the updated file
        fs.writeFileSync(statusPath, updatedContent, "utf8");
        console.log(
            `Updated Status.js with ${newStatusCodes.length} new status codes.`,
        );
        return;
    }

    // If we don't have existing content, generate the entire file
    const completeFileContent = generateCompleteStatusFile(statusCodes);

    // Write the file
    fs.writeFileSync(statusPath, completeFileContent, "utf8");
    console.log("Generated new Status.js file.");
}

// Generate both files
generateRequestTypeFile();
generateStatusFile();
