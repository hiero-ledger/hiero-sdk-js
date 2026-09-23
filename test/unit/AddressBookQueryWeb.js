// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import AddressBookQueryWeb from "../../src/network/AddressBookQueryWeb.js";

/**
 * The minimum a client needs to expose for the web address book query.
 * @param {number} [maxAttempts]
 */
function stubClient(maxAttempts = 3) {
    return {
        _mirrorNetwork: {
            getNextMirrorNode: () => ({
                address: { address: "127.0.0.1", port: 5551 },
            }),
        },
        _network: { ledgerId: null },
        maxAttempts,
        isClientShutDown: false,
    };
}

/**
 * @param {number} nodeId
 */
function node(nodeId) {
    return {
        node_id: nodeId,
        node_account_id: `0.0.${nodeId + 3}`,
        node_cert_hash: "0xabc",
        public_key: "302a300506032b6570032100aa",
        description: `node ${nodeId}`,
        stake: 1,
        grpc_proxy_endpoint: { domain_name: "node.example.com", port: 443 },
        service_endpoints: [],
    };
}

/**
 * @param {object} body
 * @param {number} [status]
 */
function jsonResponse(body, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
    };
}

/**
 * @param {number} status
 * @param {string} detail
 */
function errorResponse(status, detail) {
    return jsonResponse(
        { _status: { messages: [{ message: "Error", detail }] } },
        status,
    );
}

function query() {
    // Keep the backoff negligible so retries do not slow the suite down.
    return new AddressBookQueryWeb().setFileId("0.0.102").setMaxBackoff(1);
}

describe("AddressBookQueryWeb", function () {
    /** @type {import("vitest").Mock} */
    let fetchMock;

    beforeEach(function () {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(function () {
        vi.unstubAllGlobals();
    });

    it("does not retry a 4xx and surfaces the mirror node detail", async function () {
        fetchMock.mockResolvedValue(errorResponse(404, "Not found"));

        await expect(query().execute(stubClient())).rejects.toThrow(
            "Failed to query address book: HTTP 404: Error: Not found",
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry a malformed body", async function () {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.reject(new SyntaxError("Unexpected token <")),
            text: () => Promise.resolve("<html>"),
        });

        await expect(query().execute(stubClient())).rejects.toThrow(
            "Failed to query address book: Unexpected token <",
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries a 5xx and succeeds on the next attempt", async function () {
        fetchMock
            .mockResolvedValueOnce(errorResponse(503, "Unavailable"))
            .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));

        const book = await query().execute(stubClient());

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(book.nodeAddresses).to.have.length(1);
        expect(book.nodeAddresses[0].accountId.toString()).to.equal("0.0.3");
    });

    it("retries a timeout", async function () {
        const timeout = new Error("The operation was aborted due to timeout");
        timeout.name = "TimeoutError";
        fetchMock
            .mockRejectedValueOnce(timeout)
            .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));

        const book = await query().execute(stubClient());

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(book.nodeAddresses).to.have.length(1);
    });

    it("gives up after maxAttempts + 1 tries on a persistent 5xx", async function () {
        fetchMock.mockResolvedValue(errorResponse(503, "Unavailable"));

        await expect(query().execute(stubClient(2))).rejects.toThrow(
            "Failed to query address book after 3 attempts. Last error: HTTP 503: Error: Unavailable",
        );
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("follows pagination and applies the retry budget per page", async function () {
        fetchMock
            .mockResolvedValueOnce(
                jsonResponse({
                    nodes: [node(0)],
                    links: {
                        next: "/api/v1/network/nodes?limit=1&node.id=gt:0",
                    },
                }),
            )
            .mockResolvedValueOnce(errorResponse(502, "Bad gateway"))
            .mockResolvedValueOnce(
                jsonResponse({ nodes: [node(1)], links: { next: null } }),
            );

        const book = await query().execute(stubClient());

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[0][0]).to.equal(
            "http://127.0.0.1:5551/api/v1/network/nodes?file.id=0.0.102&limit=25",
        );
        expect(fetchMock.mock.calls[1][0]).to.equal(
            "http://127.0.0.1:5551/api/v1/network/nodes?limit=1&node.id=gt:0",
        );
        expect(
            book.nodeAddresses.map((a) => a.accountId.toString()),
        ).to.deep.equal(["0.0.3", "0.0.4"]);
    });

    it("stops retrying once the client is shut down", async function () {
        const client = stubClient();
        fetchMock.mockImplementation(() => {
            client.isClientShutDown = true;
            return Promise.resolve(errorResponse(503, "Unavailable"));
        });

        await expect(query().execute(client)).rejects.toThrow("HTTP 503");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
