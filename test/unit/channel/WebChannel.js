// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import WebChannel from "../../../src/channel/WebChannel.js";

describe("WebChannel", function () {
    // _shouldUseHttps
    describe("_shouldUseHttps", function () {
        it("should return false for localhost", function () {
            const channel = new WebChannel("localhost:8080");
            expect(channel._shouldUseHttps("localhost:8080")).to.be.false;
        });

        it("should return false for 127.0.0.1", function () {
            const channel = new WebChannel("127.0.0.1:50211");
            expect(channel._shouldUseHttps("127.0.0.1:50211")).to.be.false;
        });

        it("should return false for .cluster.local addresses", function () {
            const channel = new WebChannel("node.ns.svc.cluster.local:443");
            expect(channel._shouldUseHttps("node.ns.svc.cluster.local:443")).to
                .be.false;
        });

        it("should return true for public addresses", function () {
            const channel = new WebChannel("node00.swirldslabs.com:443");
            expect(channel._shouldUseHttps("node00.swirldslabs.com:443")).to.be
                .true;
        });
    });

    // _buildUrl
    describe("_buildUrl", function () {
        it("should prepend https:// for public addresses", function () {
            const channel = new WebChannel("node00.swirldslabs.com:443");
            expect(channel._buildUrl("node00.swirldslabs.com:443")).to.equal(
                "https://node00.swirldslabs.com:443",
            );
        });

        it("should prepend http:// for localhost", function () {
            const channel = new WebChannel("localhost:8080");
            expect(channel._buildUrl("localhost:8080")).to.equal(
                "http://localhost:8080",
            );
        });

        it("should prepend http:// for 127.0.0.1", function () {
            const channel = new WebChannel("127.0.0.1:50211");
            expect(channel._buildUrl("127.0.0.1:50211")).to.equal(
                "http://127.0.0.1:50211",
            );
        });

        it("should preserve existing http:// scheme", function () {
            const channel = new WebChannel("http://custom.example.com:443");
            expect(channel._buildUrl("http://custom.example.com:443")).to.equal(
                "http://custom.example.com:443",
            );
        });

        it("should preserve existing https:// scheme", function () {
            const channel = new WebChannel("https://custom.example.com:443");
            expect(
                channel._buildUrl("https://custom.example.com:443"),
            ).to.equal("https://custom.example.com:443");
        });
    });

    // close
    describe("close", function () {
        it("should be a no-op and not throw", function () {
            const channel = new WebChannel("localhost:8080");
            expect(() => channel.close()).to.not.throw();
        });
    });
});
