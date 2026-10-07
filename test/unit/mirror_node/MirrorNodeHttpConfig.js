// SPDX-License-Identifier: Apache-2.0

import MirrorNodeHttpConfig from "../../../src/mirror_node/MirrorNodeHttpConfig.js";
import MirrorNodeHttpRetryPolicy from "../../../src/mirror_node/MirrorNodeHttpRetryPolicy.js";
import HttpTransportConfiguration from "../../../src/http/HttpTransportConfiguration.js";
import FakeHttpTransport from "../utils/FakeHttpTransport.js";

describe("MirrorNodeHttpConfig", function () {
    it("defaults every field, nested types included", function () {
        const config = new MirrorNodeHttpConfig();

        expect(config.transport).to.be.null;
        expect(config.transportConfiguration).to.be.instanceOf(
            HttpTransportConfiguration,
        );
        expect(config.transportConfiguration.maxRedirects).to.equal(5);
        expect(config.retryPolicy).to.be.instanceOf(MirrorNodeHttpRetryPolicy);
        expect(config.retryPolicy.maxAttempts).to.equal(5);
        expect(config.requestHeaders).to.deep.equal({});
        expect(Object.isFrozen(config)).to.be.true;
    });

    it("normalizes nested plain objects and keeps their unnamed fields at defaults", function () {
        const transport = new FakeHttpTransport();
        const config = new MirrorNodeHttpConfig({
            transport,
            transportConfiguration: { connectTimeout: 2000 },
            retryPolicy: { maxAttempts: 3 },
            requestHeaders: { Authorization: "Bearer test" },
        });

        expect(config.transport).to.equal(transport);
        expect(config.transportConfiguration.connectTimeout).to.equal(2000);
        expect(config.transportConfiguration.maxResponseBytes).to.equal(
            32 * 1024 * 1024,
        );
        expect(config.retryPolicy.maxAttempts).to.equal(3);
        expect(config.retryPolicy.perAttemptTimeout).to.equal(30000);
        expect(config.requestHeaders).to.deep.equal({
            authorization: "Bearer test",
        });
    });

    it("derives a changed copy by spreading", function () {
        const config = new MirrorNodeHttpConfig({
            retryPolicy: { maxAttempts: 3 },
        });
        const derived = new MirrorNodeHttpConfig({
            ...config,
            requestHeaders: { "X-Trace": "1" },
        });

        expect(derived.retryPolicy).to.equal(config.retryPolicy);
        expect(derived.requestHeaders).to.deep.equal({ "x-trace": "1" });
        expect(config.requestHeaders).to.deep.equal({});
    });

    it("rejects the reserved identity headers case-insensitively", function () {
        for (const name of [
            "User-Agent",
            "user-agent",
            "X-User-Agent",
            "X-USER-AGENT",
        ]) {
            expect(
                () =>
                    new MirrorNodeHttpConfig({
                        requestHeaders: { [name]: "me/1.0" },
                    }),
                name,
            ).to.throw("is reserved");
        }
    });

    it("rejects a transport without roundTrip", function () {
        expect(
            () =>
                new MirrorNodeHttpConfig({
                    // @ts-ignore deliberately wrong
                    transport: { close() {} },
                }),
        ).to.throw(TypeError, "roundTrip");
    });

    it("returns an instance as is from `from()`", function () {
        const config = new MirrorNodeHttpConfig();
        expect(MirrorNodeHttpConfig.from(config)).to.equal(config);
        expect(MirrorNodeHttpConfig.from(null)).to.be.instanceOf(
            MirrorNodeHttpConfig,
        );
    });
});
