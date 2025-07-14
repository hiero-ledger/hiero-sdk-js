import { Metadata } from "@grpc/grpc-js";
import { Client as GrpcClient } from "@grpc/grpc-js";

import {
    AccountBalanceQuery,
    TransferTransaction,
    Hbar,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { SDK_NAME, SDK_VERSION } from "../../src/version.js";

describe("gRPC Metadata Integration Test", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    /**
     * Helper function to test metadata in actual gRPC requests
     * @param {Function} operation - The operation function to execute
     * @returns {Promise<void>}
     */
    async function testMetadataInRequest(operation) {
        const originalMakeUnaryRequest = GrpcClient.prototype.makeUnaryRequest;
        let metadataInRequest = null;

        GrpcClient.prototype.makeUnaryRequest = function (
            path,
            serialize,
            deserialize,
            request,
            metadata,
            options,
            callback,
        ) {
            // Capture the metadata that would be sent in the real request
            metadataInRequest = metadata;
            return originalMakeUnaryRequest.call(
                this,
                path,
                serialize,
                deserialize,
                request,
                metadata,
                options,
                callback,
            );
        };

        try {
            // Execute the provided operation
            await operation();

            // Verify the metadata was included in the request
            expect(metadataInRequest).to.not.be.null;

            // Get the user agent value directly using get() method on Metadata
            const userAgentValue = metadataInRequest.get("x-user-agent");

            // Verify the user agent header exists and has correct format
            expect(userAgentValue).to.not.be.undefined;
            expect(userAgentValue[0]).to.equal(`${SDK_NAME}/${SDK_VERSION}`);
        } finally {
            GrpcClient.prototype.makeUnaryRequest = originalMakeUnaryRequest;
        }
    }

    it("should include metadata in the actual request on a query", async function () {
        await testMetadataInRequest(async () => {
            await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);
        });
    });

    it("should include metadata in the actual request on a transaction", async function () {
        await testMetadataInRequest(async () => {
            await new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-1))
                .addHbarTransfer(env.client.operatorAccountId, new Hbar(1))
                .execute(env.client);
        });
    });

    it("should call the metadata set method in sequence of different operations", async function () {
        // Create a spy for Metadata.set
        const originalSet = Metadata.prototype.set;
        const metadataCalls = [];

        Metadata.prototype.set = function (key, value) {
            if (key === "x-user-agent") {
                metadataCalls.push({
                    key: key,
                    value: value,
                });
            }
            return originalSet.call(this, key, value);
        };

        try {
            await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            await new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-1))
                .addHbarTransfer(env.client.operatorAccountId, new Hbar(1))
                .execute(env.client);

            await new AccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);

            // Verify all calls had correct metadata
            expect(metadataCalls.length).to.be.at.least(3);

            // Verify all metadata entries have the same expected format and value
            for (const call of metadataCalls) {
                expect(call.key).to.equal("x-user-agent");
                expect(call.value).to.equal(`${SDK_NAME}/${SDK_VERSION}`);
            }
        } finally {
            // Restore original method
            Metadata.prototype.set = originalSet;
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
