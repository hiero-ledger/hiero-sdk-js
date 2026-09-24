// SPDX-License-Identifier: Apache-2.0

import {
    isLoopbackBaseUrl,
    isLoopbackHost,
    parseMirrorRestBaseUrl,
    resolveMirrorRestBaseUrl,
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

    it("rewrites only loopback base URLs, per endpoint family", function () {
        for (const base of [
            "http://127.0.0.1:5551/api/v1",
            "http://localhost:5551/api/v1",
            "https://LOCALHOST:5600/api/v1/",
        ]) {
            const host = parseMirrorRestBaseUrl(base).host;
            expect(resolveMirrorRestBaseUrl(base, "rest"), base).to.equal(
                `http://${host}:5551/api/v1`,
            );
            expect(resolveMirrorRestBaseUrl(base, "rest-java"), base).to.equal(
                `http://${host}:8084/api/v1`,
            );
            expect(resolveMirrorRestBaseUrl(base, "web3"), base).to.equal(
                `http://${host}:8545/api/v1`,
            );
        }
        expect(
            resolveMirrorRestBaseUrl("http://[::1]:5551/api/v1", "web3"),
        ).to.equal("http://[::1]:8545/api/v1");
        for (const family of ["rest", "rest-java", "web3"]) {
            expect(
                resolveMirrorRestBaseUrl(
                    "https://mirror.example.com:443/api/v1",
                    family,
                ),
                family,
            ).to.equal("https://mirror.example.com:443/api/v1");
        }
        expect(resolveMirrorRestBaseUrl("not a url", "rest")).to.equal(
            "not a url",
        );
    });

    it("rejects an unknown family on a loopback URL", function () {
        expect(() =>
            resolveMirrorRestBaseUrl(
                "http://127.0.0.1:5551/api/v1",
                // @ts-ignore deliberately wrong
                "graphql",
            ),
        ).to.throw("unknown mirror REST endpoint family");
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
        expect(isLoopbackBaseUrl("http://127.0.0.1:5551/api/v1")).to.be.true;
        expect(isLoopbackBaseUrl("https://mirror.example.com:443/api/v1")).to.be
            .false;
        expect(isLoopbackBaseUrl("garbage")).to.be.false;
    });
});
