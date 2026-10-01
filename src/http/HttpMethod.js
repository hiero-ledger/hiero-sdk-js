// SPDX-License-Identifier: Apache-2.0

/**
 * HTTP request methods accepted by `HttpRequest`.
 *
 * Only `GET` and `POST` are reachable from the mirror node REST queries
 * today. The enumeration is complete so it never has to be reopened, and a
 * closed set is what keeps `"get"`, `"Get"` and `"PROPFIND"` out of a
 * transport.
 *
 * @readonly
 * @enum {string}
 */
const HttpMethod = Object.freeze({
    GET: "GET",
    HEAD: "HEAD",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
    OPTIONS: "OPTIONS",
    TRACE: "TRACE",
    CONNECT: "CONNECT",
});

export default HttpMethod;
