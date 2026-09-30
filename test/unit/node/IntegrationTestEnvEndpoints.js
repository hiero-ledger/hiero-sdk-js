// SPDX-License-Identifier: Apache-2.0

import fs from "fs";
import os from "os";
import path from "path";
import {
    AccountId,
    MirrorNodeAccountBalanceQuery,
    PrivateKey,
} from "../../../src/exports.js";
import NodeClient from "../../../src/client/NodeClient.js";
import BaseIntegrationTestEnv from "../../integration/client/BaseIntegrationTestEnv.js";
import {
    applyEndpointOverrides,
    ingressTransport,
} from "../../integration/client/endpointOverrides.js";
import FakeHttpTransport, { jsonResponse } from "../utils/FakeHttpTransport.js";

describe("integration test endpoint overrides", function () {
    /** @type {NodeClient} */
    let client;

    beforeEach(function () {
        client = NodeClient.forLocalNode();
    });

    afterEach(function () {
        client.close();
    });

    it("keeps the local-node defaults when nothing is set", function () {
        applyEndpointOverrides(client, {
            NODE_IP: "",
            NODE_ACCOUNT_ID: "",
            MIRROR_NETWORK: "",
            MIRROR_NODE_REST_URL: "",
        });

        expect(client.network).to.deep.equal({
            "127.0.0.1:50211": new AccountId(3),
        });
        expect(client.mirrorNetwork).to.deep.equal(["127.0.0.1:5600"]);
        expect(client.getMirrorNodeHttpConfig().transport).to.be.null;
    });

    it("points the client at alternate endpoints", function () {
        applyEndpointOverrides(client, {
            NODE_IP: "127.0.0.1:35211",
            NODE_ACCOUNT_ID: "0.0.3",
            MIRROR_NETWORK: "127.0.0.1:35600",
            MIRROR_NODE_REST_URL: "http://127.0.0.1:38081",
        });

        expect(client.network).to.deep.equal({
            "127.0.0.1:35211": new AccountId(3),
        });
        expect(client.mirrorNetwork).to.deep.equal(["127.0.0.1:35600"]);
        expect(client.getMirrorNodeHttpConfig().transport).to.not.be.null;
    });

    it("sends mirror REST calls to the ingress instead of the SDK's local ports", async function () {
        const fake = new FakeHttpTransport(() =>
            jsonResponse(200, {
                balances: [{ account: "0.0.2", balance: 5 }],
            }),
        );
        client.setMirrorNodeHttpConfig({
            transport: ingressTransport("http://127.0.0.1:38081", fake),
        });

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.2")
            .execute(client);

        expect(balance.hbars.toTinybars().toNumber()).to.equal(5);
        expect(fake.requests[0].url).to.match(
            /^http:\/\/127\.0\.0\.1:38081\/api\/v1\/balances\?/,
        );
    });

    for (const [env, message] of [
        [{ NODE_IP: "127.0.0.1:35211" }, "must be set together"],
        [{ NODE_ACCOUNT_ID: "0.0.3" }, "must be set together"],
        [
            { NODE_IP: "127.0.0.1", NODE_ACCOUNT_ID: "0.0.3" },
            'Invalid NODE_IP "127.0.0.1"',
        ],
        [
            { NODE_IP: "127.0.0.1:35211", NODE_ACCOUNT_ID: "three" },
            'Invalid NODE_ACCOUNT_ID "three"',
        ],
        [{ MIRROR_NETWORK: "127.0.0.1" }, 'Invalid MIRROR_NETWORK "127.0.0.1"'],
        [
            { MIRROR_NODE_REST_URL: "127.0.0.1:38081" },
            'Invalid MIRROR_NODE_REST_URL "127.0.0.1:38081"',
        ],
    ]) {
        it(`rejects ${JSON.stringify(env)}`, function () {
            expect(() => applyEndpointOverrides(client, env)).to.throw(message);
        });
    }

    describe("with CONFIG_FILE", function () {
        const operatorKey = PrivateKey.generateED25519();
        /** @type {string} */
        let configFile;

        beforeEach(function () {
            configFile = path.join(
                fs.mkdtempSync(path.join(os.tmpdir(), "sdk-env-")),
                "config.json",
            );
            fs.writeFileSync(
                configFile,
                JSON.stringify({
                    network: { "127.0.0.1:35211": "0.0.3" },
                    mirrorNetwork: ["127.0.0.1:35600"],
                }),
            );
        });

        it("keeps the file's mirror network", async function () {
            const env = await BaseIntegrationTestEnv.new({
                client: NodeClient,
                env: {
                    CONFIG_FILE: configFile,
                    OPERATOR_ID: "0.0.2",
                    OPERATOR_KEY: operatorKey.toStringDer(),
                },
            });

            expect(env.client.network).to.deep.equal({
                "127.0.0.1:35211": new AccountId(3),
            });
            expect(env.client.mirrorNetwork).to.deep.equal(["127.0.0.1:35600"]);
            await env.close();
        });

        it("refuses an endpoint override that would replace the file's", async function () {
            await expect(
                BaseIntegrationTestEnv.new({
                    client: NodeClient,
                    env: {
                        CONFIG_FILE: configFile,
                        MIRROR_NETWORK: "127.0.0.1:5600",
                    },
                }),
            ).rejects.toThrow("CONFIG_FILE sets the network itself");
        });
    });
});
