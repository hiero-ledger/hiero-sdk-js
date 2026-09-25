// SPDX-License-Identifier: Apache-2.0

import http from "http";
import MirrorNodeHttpClient from "../../../src/mirror_node/MirrorNodeHttpClient.js";
import MirrorNodeHttpRetryPolicy from "../../../src/mirror_node/MirrorNodeHttpRetryPolicy.js";
import NodeHttpTransport from "../../../src/http/NodeHttpTransport.js";
import { SDK_NAME, SDK_VERSION } from "../../../src/version.js";

/**
 * The adapter over the real Node transport against a local server: what
 * actually reaches the wire.
 */
describe("MirrorNodeHttpClient over NodeHttpTransport", function () {
    /** @type {http.Server} */
    let server;
    /** @type {string} */
    let baseUrl;
    /** @type {http.IncomingHttpHeaders[]} */
    let seen;
    /** @type {NodeHttpTransport} */
    let transport;

    beforeEach(async function () {
        seen = [];
        server = http.createServer((req, res) => {
            seen.push(req.headers);
            res.setHeader("Content-Type", "application/json");
            res.end("{}");
        });
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const address = /** @type {import("net").AddressInfo} */ (
            server.address()
        );
        baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
        transport = NodeHttpTransport.create();
    });

    afterEach(async function () {
        await transport.close(0);
        await new Promise((resolve) => server.close(() => resolve(undefined)));
    });

    it("puts the caller headers on the wire together with the SDK identity header", async function () {
        const http = MirrorNodeHttpClient.create(
            baseUrl,
            transport,
            MirrorNodeHttpRetryPolicy.DEFAULT,
            { requestHeaders: { Authorization: "Bearer test" } },
        );

        await http.get("/accounts/0.0.2");

        expect(seen).to.have.length(1);
        expect(seen[0].authorization).to.equal("Bearer test");
        expect(seen[0]["x-user-agent"]).to.equal(`${SDK_NAME}/${SDK_VERSION}`);
        expect(seen[0].accept).to.equal("application/json");
        expect(seen[0]["user-agent"]).to.be.undefined;
    });

    it("lets the endpoint's content type win over a caller header of the same name", async function () {
        const http = MirrorNodeHttpClient.create(
            baseUrl,
            transport,
            MirrorNodeHttpRetryPolicy.DEFAULT,
            { requestHeaders: { "Content-Type": "text/plain" } },
        );

        await http.post(
            "/network/fees",
            "application/protobuf",
            Uint8Array.of(1),
        );

        expect(seen).to.have.length(1);
        expect(seen[0]["content-type"]).to.equal("application/protobuf");
        expect(seen[0]["content-length"]).to.equal("1");
    });
});
