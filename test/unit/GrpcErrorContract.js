// SPDX-License-Identifier: Apache-2.0

import GrpcServiceError from "../../src/grpc/GrpcServiceError.js";

describe("gRPC error conversion", function () {
    const names = [
        "OK",
        "CANCELLED",
        "UNKNOWN",
        "INVALID_ARGUMENT",
        "DEADLINE_EXCEEDED",
        "NOT_FOUND",
        "ALREADY_EXISTS",
        "PERMISSION_DENIED",
        "RESOURCE_EXHAUSTED",
        "FAILED_PRECONDITION",
        "ABORTED",
        "OUT_OF_RANGE",
        "UNIMPLEMENTED",
        "INTERNAL",
        "UNAVAILABLE",
        "DATA_LOSS",
        "UNAUTHENTICATED",
        "TIMEOUT",
        "GRPC_WEB",
    ];

    for (const [code, name] of names.entries()) {
        it(`retains ${name} (${code}), details and the original cause stack`, function () {
            const cause = Object.assign(new Error("transport failure"), {
                code,
                details: "node unavailable",
            });
            const error = GrpcServiceError._fromResponse(cause);
            expect(error).to.be.instanceOf(GrpcServiceError);
            expect(Number(error.status)).to.equal(code);
            expect(error.toString()).to.equal(
                `GrpcServiceError: gRPC service failed with: Status: ${name}, Code: ${code}: node unavailable`,
            );
            expect(error.stack).to.include(cause.stack);
        });
    }

    it("preserves errors without a complete gRPC response", function () {
        const error = new Error("connection failed before a response");
        expect(GrpcServiceError._fromResponse(error)).to.equal(error);
        expect(
            GrpcServiceError._fromResponse(Object.assign(error, { code: 14 })),
        ).to.equal(error);
    });

    it("rejects an unknown wire status rather than misclassifying it", function () {
        expect(() =>
            GrpcServiceError._fromResponse(
                Object.assign(new Error(), { code: 99, details: "unknown" }),
            ),
        ).to.throw("non-exhaustive GrpcStatus");
    });
});
