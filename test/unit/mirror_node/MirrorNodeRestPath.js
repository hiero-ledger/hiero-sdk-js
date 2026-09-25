// SPDX-License-Identifier: Apache-2.0

import MirrorNodeRestPath, {
    trimTrailingSlashes,
} from "../../../src/mirror_node/MirrorNodeRestPath.js";
import MirrorNodeHttpError, {
    MirrorNodeHttpErrorCode,
} from "../../../src/mirror_node/MirrorNodeHttpError.js";

/**
 * @param {() => unknown} fn
 * @returns {any}
 */
function thrown(fn) {
    try {
        fn();
    } catch (error) {
        return error;
    }
    throw new Error("expected a throw");
}

describe("MirrorNodeRestPath", function () {
    it("rejects an absolute URL", function () {
        const error = thrown(() =>
            MirrorNodeRestPath.of("https://evil.example/api/v1/accounts"),
        );
        expect(error).to.be.instanceOf(MirrorNodeHttpError);
        expect(error.code).to.equal(MirrorNodeHttpErrorCode.INVALID_PATH_ERROR);
    });

    it("rejects a protocol-relative path", function () {
        expect(
            thrown(() => MirrorNodeRestPath.of("//evil.example/steal")).code,
        ).to.equal(MirrorNodeHttpErrorCode.INVALID_PATH_ERROR);
    });

    it("rejects a path without a leading slash, with whitespace, or with a .. segment", function () {
        for (const path of [
            "accounts/0.0.3",
            "/accounts/0.0 .3",
            "/accounts/../admin",
            "/../x",
            "",
            42,
        ]) {
            expect(
                thrown(() => MirrorNodeRestPath.of(path)).code,
                String(path),
            ).to.equal(MirrorNodeHttpErrorCode.INVALID_PATH_ERROR);
        }
    });

    it("allows .. inside the query string", function () {
        expect(MirrorNodeRestPath.of("/x?next=..").value).to.equal(
            "/x?next=..",
        );
    });

    it("resolves by concatenation against both spellings of the base URL", function () {
        const path = MirrorNodeRestPath.of("/network/nodes?limit=1");

        expect(path.resolve("https://mirror/api/v1")).to.equal(
            "https://mirror/api/v1/network/nodes?limit=1",
        );
        expect(path.resolve("https://mirror/api/v1/")).to.equal(
            "https://mirror/api/v1/network/nodes?limit=1",
        );
        expect(path.toString()).to.equal("/network/nodes?limit=1");
        expect(Object.isFrozen(path)).to.be.true;
    });

    it("strips the /api/v1 prefix of a next link exactly once", function () {
        expect(
            MirrorNodeRestPath.fromNextLink(
                "/api/v1/network/nodes?limit=100&order=asc",
            ).value,
        ).to.equal("/network/nodes?limit=100&order=asc");
        expect(
            MirrorNodeRestPath.fromNextLink("/api/v1/api/v1/x").value,
        ).to.equal("/api/v1/x");
        expect(MirrorNodeRestPath.fromNextLink("/api/v1").value).to.equal("/");
        expect(MirrorNodeRestPath.fromNextLink("/api/v1?a=1").value).to.equal(
            "/?a=1",
        );
        expect(MirrorNodeRestPath.fromNextLink("/api/v10/x").value).to.equal(
            "/api/v10/x",
        );
        expect(
            MirrorNodeRestPath.fromNextLink("/network/nodes").value,
        ).to.equal("/network/nodes");
    });

    it("trims trailing slashes without backtracking", function () {
        expect(trimTrailingSlashes("https://mirror/api/v1///")).to.equal(
            "https://mirror/api/v1",
        );
        expect(trimTrailingSlashes("https://mirror/api/v1")).to.equal(
            "https://mirror/api/v1",
        );
        expect(trimTrailingSlashes("///")).to.equal("");
        expect(trimTrailingSlashes("")).to.equal("");
        const hostile = `${"/".repeat(100000)}x`;
        const started = Date.now();
        expect(trimTrailingSlashes(hostile)).to.equal(hostile);
        // A backtracking regex would take minutes here; a loop takes
        // milliseconds. The bound is generous for a busy CI runner.
        expect(Date.now() - started).to.be.below(5000);
    });

    it("rejects a next link naming another host", function () {
        for (const link of [
            "https://evil.example/api/v1/network/nodes",
            "//evil.example/api/v1/network/nodes",
            "http://mirror/api/v1/x",
            null,
        ]) {
            expect(
                thrown(() => MirrorNodeRestPath.fromNextLink(link)).code,
                String(link),
            ).to.equal(MirrorNodeHttpErrorCode.INVALID_PATH_ERROR);
        }
    });
});
