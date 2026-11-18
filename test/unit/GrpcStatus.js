import GrpcStatus from "../../src/grpc/GrpcStatus.js";

describe("GrpcStatus", function () {
    it.each([
        [0, "OK", GrpcStatus.Ok],
        [1, "CANCELLED", GrpcStatus.Cancelled],
        [2, "UNKNOWN", GrpcStatus.Unknown],
        [3, "INVALID_ARGUMENT", GrpcStatus.InvalidArgument],
        [4, "DEADLINE_EXCEEDED", GrpcStatus.DeadlineExceeded],
        [5, "NOT_FOUND", GrpcStatus.NotFound],
        [6, "ALREADY_EXISTS", GrpcStatus.AlreadyExists],
        [7, "PERMISSION_DENIED", GrpcStatus.PermissionDenied],
        [8, "RESOURCE_EXHAUSTED", GrpcStatus.ResourceExhausted],
        [9, "FAILED_PRECONDITION", GrpcStatus.FailedPrecondition],
        [10, "ABORTED", GrpcStatus.Aborted],
        [11, "OUT_OF_RANGE", GrpcStatus.OutOfRange],
        [12, "UNIMPLEMENTED", GrpcStatus.Unimplemented],
        [13, "INTERNAL", GrpcStatus.Internal],
        [14, "UNAVAILABLE", GrpcStatus.Unavailable],
        [15, "DATA_LOSS", GrpcStatus.DataLoss],
        [16, "UNAUTHENTICATED", GrpcStatus.Unauthenticated],
        [17, "TIMEOUT", GrpcStatus.Timeout],
        [18, "GRPC_WEB", GrpcStatus.GrpcWeb],
    ])("maps code %i to %s", function (code, name, status) {
        expect(GrpcStatus._fromValue(code)).to.equal(status);
        expect(status.toString()).to.equal(name);
        expect(status.valueOf()).to.equal(code);
    });

    it("throws for an unknown code", function () {
        expect(() => GrpcStatus._fromValue(99)).to.throw(
            "(BUG) non-exhaustive GrpcStatus switch statement",
        );
    });

    it("returns UNKNOWN (code) for a non-static instance", function () {
        expect(new GrpcStatus(99).toString()).to.equal("UNKNOWN (99)");
    });
});
