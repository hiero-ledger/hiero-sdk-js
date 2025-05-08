import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { SDK_VERSION } from "../../src/version.js";
import WebChannel from "../../src/channel/WebChannel.js";

// Mock the client constants
vi.mock("../../../src/constants/ClientConstants.js", () => ({
    ALL_WEB_NETWORK_NODES: {
        "https://example.com": {
            toString: () => "example-node",
        },
    },
}));

describe("WebChannel", () => {
    let fetchSpy;
    let originalFetch;

    beforeEach(() => {
        // Store original fetch
        originalFetch = window.fetch;

        // Create a spy for fetch
        fetchSpy = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                headers: {
                    get: () => null,
                },
                arrayBuffer: () => Promise.resolve(new ArrayBuffer()),
            }),
        );

        // Replace window fetch with our spy
        window.fetch = fetchSpy;
    });

    afterEach(() => {
        window.fetch = originalFetch;
    });

    it("includes SDK version in x-user-agent header", async () => {
        const channel = new WebChannel("https://example.com");
        const client = channel._createUnaryClient("CryptoService");

        // Make a request to trigger fetch
        await new Promise((resolve) => {
            client(
                { name: "getFeeSchedule" },
                new Uint8Array(),
                // eslint-disable-next-line no-unused-vars
                (err, data) => {
                    resolve();
                },
            );
        });

        // Verify fetch was called
        expect(fetchSpy).toHaveBeenCalled();

        // Extract the headers from the fetch call
        const headers = fetchSpy.mock.calls[0][1].headers;

        // Verify the SDK version header
        expect(headers["x-user-agent"]).toBe(SDK_VERSION);
    });
});
