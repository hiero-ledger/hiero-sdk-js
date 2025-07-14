import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { SDK_NAME, SDK_VERSION } from "../../src/version.js";
import NativeChannel from "../../src/channel/NativeChannel.js";

// Mock the client constants if needed
vi.mock("../../src/constants/ClientConstants.js", () => ({
    ALL_NODES: {
        "https://example.com": {
            toString: () => "example-node",
        },
    },
}));

// Mock FileReader for the native environment
class MockFileReader {
    constructor() {
        this.onloadend = null;
        this.onerror = null;
    }

    // eslint-disable-next-line no-unused-vars
    readAsDataURL(blob) {
        // Simulate async reading
        setTimeout(() => {
            this.result = "data:application/grpc-web+proto;base64,dGVzdA=="; // "test" in base64
            if (this.onloadend) this.onloadend();
        }, 0);
    }
}

// Get the global object in any environment
const getGlobalObject = () => {
    if (typeof window !== "undefined") return window;
    if (typeof global !== "undefined") return global;
    if (typeof self !== "undefined") return self;
    return {};
};

// Mock for base64 encoding/decoding
vi.mock("../../src/encoding/base64.native.js", () => ({
    // eslint-disable-next-line no-unused-vars
    encode: (data) => "encoded",
    // eslint-disable-next-line no-unused-vars
    decode: (data) => new Uint8Array([1, 2, 3, 4]),
}));

describe("NativeChannel", () => {
    let fetchSpy;
    let originalFetch;
    let originalFileReader;

    beforeEach(() => {
        // Store original fetch and FileReader
        originalFetch = getGlobalObject().fetch;
        originalFileReader = getGlobalObject().FileReader;

        // Mock FileReader
        getGlobalObject().FileReader = MockFileReader;

        // Create a spy for fetch
        fetchSpy = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                blob: () => Promise.resolve(new Blob(["test"])),
            }),
        );

        // Replace window fetch with our spy
        getGlobalObject().fetch = fetchSpy;
    });

    afterEach(() => {
        // Restore original fetch and FileReader
        getGlobalObject().fetch = originalFetch;
        getGlobalObject().FileReader = originalFileReader;
    });

    it("includes SDK version in x-user-agent header", async () => {
        // Create a NativeChannel instance
        const channel = new NativeChannel("https://example.com");

        // Get a unary client
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
        expect(headers["x-user-agent"]).toBe(`${SDK_NAME}/${SDK_VERSION}`);
    });
});
