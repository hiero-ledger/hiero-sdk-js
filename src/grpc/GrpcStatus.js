// SPDX-License-Identifier: Apache-2.0

export default class GrpcStatus {
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
     * @internal
     * @param {number} code
     * @returns {GrpcStatus}
     */
    static _fromValue(code) {
        switch (code) {
            case 0:
                return GrpcStatus.Ok;
            case 1:
                return GrpcStatus.Cancelled;
            case 2:
                return GrpcStatus.Unknown;
            case 3:
                return GrpcStatus.InvalidArgument;
            case 4:
                return GrpcStatus.DeadlineExceeded;
            case 5:
                return GrpcStatus.NotFound;
            case 6:
                return GrpcStatus.AlreadyExists;
            case 7:
                return GrpcStatus.PermissionDenied;
            case 8:
                return GrpcStatus.ResourceExhausted;
            case 9:
                return GrpcStatus.FailedPrecondition;
            case 10:
                return GrpcStatus.Aborted;
            case 11:
                return GrpcStatus.OutOfRange;
            case 12:
                return GrpcStatus.Unimplemented;
            case 13:
                return GrpcStatus.Internal;
            case 14:
                return GrpcStatus.Unavailable;
            case 15:
                return GrpcStatus.DataLoss;
            case 16:
                return GrpcStatus.Unauthenticated;
            case 17:
                return GrpcStatus.Timeout;
            case 18:
                return GrpcStatus.GrpcWeb;
            default:
                throw new Error(
                    "(BUG) non-exhaustive GrpcStatus switch statement",
                );
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case GrpcStatus.Ok:
                return "OK";
            case GrpcStatus.Cancelled:
                return "CANCELLED";
            case GrpcStatus.Unknown:
                return "UNKNOWN";
            case GrpcStatus.InvalidArgument:
                return "INVALID_ARGUMENT";
            case GrpcStatus.DeadlineExceeded:
                return "DEADLINE_EXCEEDED";
            case GrpcStatus.NotFound:
                return "NOT_FOUND";
            case GrpcStatus.AlreadyExists:
                return "ALREADY_EXISTS";
            case GrpcStatus.PermissionDenied:
                return "PERMISSION_DENIED";
            case GrpcStatus.Unauthenticated:
                return "UNAUTHENTICATED";
            case GrpcStatus.ResourceExhausted:
                return "RESOURCE_EXHAUSTED";
            case GrpcStatus.FailedPrecondition:
                return "FAILED_PRECONDITION";
            case GrpcStatus.Aborted:
                return "ABORTED";
            case GrpcStatus.OutOfRange:
                return "OUT_OF_RANGE";
            case GrpcStatus.Unimplemented:
                return "UNIMPLEMENTED";
            case GrpcStatus.Internal:
                return "INTERNAL";
            case GrpcStatus.Unavailable:
                return "UNAVAILABLE";
            case GrpcStatus.DataLoss:
                return "DATA_LOSS";
            case GrpcStatus.Timeout:
                return "TIMEOUT";
            case GrpcStatus.GrpcWeb:
                return "GRPC_WEB";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @returns {number}
     */
    valueOf() {
        return this._code;
    }
}

GrpcStatus.Ok = new GrpcStatus(0);
GrpcStatus.Cancelled = new GrpcStatus(1);
GrpcStatus.Unknown = new GrpcStatus(2);
GrpcStatus.InvalidArgument = new GrpcStatus(3);
GrpcStatus.DeadlineExceeded = new GrpcStatus(4);
GrpcStatus.NotFound = new GrpcStatus(5);
GrpcStatus.AlreadyExists = new GrpcStatus(6);
GrpcStatus.PermissionDenied = new GrpcStatus(7);
GrpcStatus.ResourceExhausted = new GrpcStatus(8);
GrpcStatus.FailedPrecondition = new GrpcStatus(9);
GrpcStatus.Aborted = new GrpcStatus(10);
GrpcStatus.OutOfRange = new GrpcStatus(11);
GrpcStatus.Unimplemented = new GrpcStatus(12);
GrpcStatus.Internal = new GrpcStatus(13);
GrpcStatus.Unavailable = new GrpcStatus(14);
GrpcStatus.DataLoss = new GrpcStatus(15);
GrpcStatus.Unauthenticated = new GrpcStatus(16);
GrpcStatus.Timeout = new GrpcStatus(17);
GrpcStatus.GrpcWeb = new GrpcStatus(18);
