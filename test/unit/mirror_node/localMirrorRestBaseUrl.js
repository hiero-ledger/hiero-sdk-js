// SPDX-License-Identifier: Apache-2.0

import {
    isLoopbackBaseUrl,
    isLoopbackHost,
    parseMirrorRestBaseUrl,
} from "../../../src/mirror_node/localMirrorRestBaseUrl.js";

describe("localMirrorRestBaseUrl", function () {
    it("parses scheme, host, port and path without URL", function () {
        expect(
            parseMirrorRestBaseUrl("https://mirror.example.com:443/api/v1"),
        ).to.deep.equal({
            scheme: "https",
            host: "mirror.example.com",
            port: "443",
            path: "/api/v1",
        });
        expect(
            parseMirrorRestBaseUrl("HTTP://localhost/api/v1/"),
        ).to.deep.equal({
            scheme: "http",
            host: "localhost",
            port: null,
            path: "/api/v1/",
        });
        expect(
            parseMirrorRestBaseUrl("http://[::1]:5551/api/v1"),
        ).to.deep.equal({
            scheme: "http",
            host: "[::1]",
            port: "5551",
            path: "/api/v1",
        });
        expect(
            parseMirrorRestBaseUrl("https://mirror.example.com"),
        ).to.deep.equal({
            scheme: "https",
            host: "mirror.example.com",
            port: null,
            path: "",
        });
        expect(parseMirrorRestBaseUrl("mirror.example.com/api/v1")).to.be.null;
        expect(parseMirrorRestBaseUrl("ftp://mirror.example.com")).to.be.null;
        expect(parseMirrorRestBaseUrl("https://mirror.example.com/api?x=1")).to
            .be.null;
    });

    it("detects loopback hosts and base URLs", function () {
        for (const host of [
            "localhost",
            "LocalHost",
            "127.0.0.1",
            "[::1]",
            "::1",
        ]) {
            expect(isLoopbackHost(host), host).to.be.true;
        }
        expect(isLoopbackHost("mirror.example.com")).to.be.false;
        expect(isLoopbackHost("127.0.0.2")).to.be.false;
        expect(isLoopbackBaseUrl("http://127.0.0.1:38081/api/v1")).to.be.true;
        expect(isLoopbackBaseUrl("https://mirror.example.com:443/api/v1")).to.be
            .false;
        expect(isLoopbackBaseUrl("garbage")).to.be.false;
    });
});
