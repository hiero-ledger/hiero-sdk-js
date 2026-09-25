// SPDX-License-Identifier: Apache-2.0

import { HttpTransportErrorCode } from "./HttpTransportError.js";

/**
 * Map a Node.js / undici system error code onto a transport error code.
 * This is the normative derivation for the SDK's own transports; the
 * classification is what lets a mistyped host name fail fast instead of
 * costing the whole attempt budget.
 *
 * Returns `null` for a code the table does not know, which the caller
 * treats as an unrecognised, non-retryable failure.
 *
 * @param {string} code
 * @returns {?string} one of `HttpTransportErrorCode`, or `null`
 */
export function mapSystemErrorCode(code) {
    switch (code) {
        case "ECONNREFUSED":
        case "ECONNRESET":
        case "ECONNABORTED":
        case "EHOSTUNREACH":
        case "ENETUNREACH":
        case "ENETDOWN":
        case "EHOSTDOWN":
        case "EPIPE":
        case "EADDRNOTAVAIL":
        case "ERR_STREAM_PREMATURE_CLOSE":
        case "UND_ERR_SOCKET":
        case "UND_ERR_DESTROYED":
        case "UND_ERR_CLOSED":
            return HttpTransportErrorCode.CONNECTION_ERROR;

        case "ETIMEDOUT":
        case "UND_ERR_CONNECT_TIMEOUT":
        case "UND_ERR_HEADERS_TIMEOUT":
        case "UND_ERR_BODY_TIMEOUT":
            return HttpTransportErrorCode.TIMEOUT_ERROR;

        case "ENOTFOUND":
        case "EAI_AGAIN":
        case "EAI_FAIL":
        case "EAI_NODATA":
        case "EAI_NONAME":
            return HttpTransportErrorCode.UNKNOWN_HOST_ERROR;

        case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
        case "UNABLE_TO_GET_ISSUER_CERT":
        case "UNABLE_TO_GET_ISSUER_CERT_LOCALLY":
        case "DEPTH_ZERO_SELF_SIGNED_CERT":
        case "SELF_SIGNED_CERT_IN_CHAIN":
        case "HOSTNAME_MISMATCH":
        case "EPROTO":
            return HttpTransportErrorCode.TLS_ERROR;

        default:
            break;
    }

    if (
        code.startsWith("ERR_TLS_") ||
        code.startsWith("ERR_SSL_") ||
        code.startsWith("CERT_")
    ) {
        return HttpTransportErrorCode.TLS_ERROR;
    }

    if (code.startsWith("HPE_")) {
        // A malformed response from the peer: the exchange did not
        // complete, and a fresh connection may well behave.
        return HttpTransportErrorCode.CONNECTION_ERROR;
    }

    return null;
}
