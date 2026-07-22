import GrpcWebFrameParser, {
    TRAILER_FLAG,
    parseGrpcWebTrailers,
} from "../../src/channel/GrpcWebFrameParser.js";
import WebMirrorChannel from "../../src/channel/WebMirrorChannel.js";
import NativeMirrorChannel, {
    Base64StreamDecoder,
} from "../../src/channel/NativeMirrorChannel.js";

/**
 * @param {number} type
 * @param {Uint8Array} payload
 * @returns {Uint8Array}
 */
function frame(type, payload) {
    const out = new Uint8Array(5 + payload.length);
    out[0] = type;
    new DataView(out.buffer).setUint32(1, payload.length);
    out.set(payload, 5);
    return out;
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
function ascii(text) {
    return Uint8Array.from(text, (c) => c.charCodeAt(0));
}

describe("GrpcWebFrameParser", function () {
    it("parses a single frame in one chunk", function () {
        const parser = new GrpcWebFrameParser();
        const payload = Uint8Array.from([1, 2, 3]);

        const frames = parser.feed(frame(0, payload));

        expect(frames).to.have.length(1);
        expect(frames[0].type).to.equal(0);
        expect([...frames[0].data]).to.deep.equal([1, 2, 3]);
    });

    it("parses multiple frames in one chunk", function () {
        const parser = new GrpcWebFrameParser();
        const chunk = new Uint8Array([
            ...frame(0, Uint8Array.from([1])),
            ...frame(TRAILER_FLAG, ascii("grpc-status: 0\r\n")),
        ]);

        const frames = parser.feed(chunk);

        expect(frames).to.have.length(2);
        expect(frames[0].type).to.equal(0);
        expect(frames[1].type).to.equal(TRAILER_FLAG);
    });

    it("buffers frames split across chunks, including inside the header", function () {
        const parser = new GrpcWebFrameParser();
        const whole = frame(0, Uint8Array.from([9, 8, 7, 6]));

        expect(parser.feed(whole.slice(0, 3))).to.have.length(0);
        expect(parser.feed(whole.slice(3, 7))).to.have.length(0);

        const frames = parser.feed(whole.slice(7));
        expect(frames).to.have.length(1);
        expect([...frames[0].data]).to.deep.equal([9, 8, 7, 6]);
    });

    it("parses trailers with status and message", function () {
        expect(
            parseGrpcWebTrailers(ascii("grpc-status: 5\r\ngrpc-message: nope")),
        ).to.deep.equal({ code: 5, details: "nope" });

        expect(parseGrpcWebTrailers(ascii("grpc-status: 0\r\n")).code).to.equal(
            0,
        );
    });

    it("returns UNKNOWN for trailers without grpc-status", function () {
        expect(parseGrpcWebTrailers(ascii("some-header: x\r\n")).code).to.equal(
            2,
        );
    });
});

describe("Base64StreamDecoder", function () {
    it("decodes base64 split at arbitrary boundaries", function () {
        const decoder = new Base64StreamDecoder();
        const encoded = Buffer.from([1, 2, 3, 4, 5, 6]).toString("base64");

        const out = [
            ...decoder.feed(encoded.slice(0, 3)),
            ...decoder.feed(encoded.slice(3)),
        ];

        expect(out).to.deep.equal([1, 2, 3, 4, 5, 6]);
    });

    it("decodes independently padded segments mid-stream", function () {
        const decoder = new Base64StreamDecoder();
        // two frames base64-encoded separately, as proxies may do
        const encoded =
            Buffer.from([1, 2, 3, 4, 5]).toString("base64") +
            Buffer.from([6, 7]).toString("base64");

        expect([...decoder.feed(encoded)]).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
    });
});

describe("WebMirrorChannel", function () {
    afterEach(function () {
        vi.unstubAllGlobals();
    });

    /**
     * @param {Uint8Array[]} chunks
     */
    function stubFetchStreaming(chunks) {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    new ReadableStream({
                        start(controller) {
                            for (const chunk of chunks) {
                                controller.enqueue(chunk);
                            }
                            controller.close();
                        },
                    }),
                ),
            ),
        );
    }

    it("delivers messages and calls end on grpc-status 0", async function () {
        stubFetchStreaming([
            frame(0, Uint8Array.from([1, 2])),
            frame(0, Uint8Array.from([3])),
            frame(TRAILER_FLAG, ascii("grpc-status: 0\r\n")),
        ]);

        const channel = new WebMirrorChannel("mirror.example.com:443");
        const received = [];

        await new Promise((resolve, reject) => {
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([0]),
                (data) => received.push([...data]),
                reject,
                resolve,
            );
        });

        expect(received).to.deep.equal([[1, 2], [3]]);
    });

    it("reports non-zero trailer status as a MirrorError", async function () {
        stubFetchStreaming([
            frame(TRAILER_FLAG, ascii("grpc-status: 5\r\ngrpc-message: gone")),
        ]);

        const channel = new WebMirrorChannel("mirror.example.com:443");

        const err = await new Promise((resolve, reject) => {
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([0]),
                () => {},
                resolve,
                () => reject(new Error("should not end cleanly")),
            );
        });

        expect(err).to.deep.equal({ code: 5, details: "gone" });
    });

    it("reports a retryable UNAVAILABLE when the stream ends without trailers", async function () {
        stubFetchStreaming([frame(0, Uint8Array.from([1]))]);

        const channel = new WebMirrorChannel("mirror.example.com:443");

        const err = await new Promise((resolve, reject) => {
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([0]),
                () => {},
                resolve,
                () => reject(new Error("should not end cleanly")),
            );
        });

        expect(err.code).to.equal(14);
    });
});

describe("NativeMirrorChannel", function () {
    class FakeXMLHttpRequest {
        static instances = [];

        constructor() {
            FakeXMLHttpRequest.instances.push(this);
            this.responseText = "";
            this.headers = {};
        }

        open(method, url) {
            this.method = method;
            this.url = url;
        }

        setRequestHeader(name, value) {
            this.headers[name] = value;
        }

        send(body) {
            this.body = body;
        }

        abort() {
            this.aborted = true;
        }

        /** test helper: stream a chunk of base64 text to the channel */
        push(text) {
            this.responseText += text;
            this.onprogress();
        }
    }

    beforeEach(function () {
        FakeXMLHttpRequest.instances = [];
        vi.stubGlobal("XMLHttpRequest", FakeXMLHttpRequest);
    });

    afterEach(function () {
        vi.unstubAllGlobals();
    });

    it("decodes streamed base64 frames and calls end on grpc-status 0", async function () {
        const channel = new NativeMirrorChannel("mirror.example.com:443");
        const received = [];

        const done = new Promise((resolve, reject) => {
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([0]),
                (data) => received.push([...data]),
                reject,
                resolve,
            );
        });

        const xhr = FakeXMLHttpRequest.instances[0];
        expect(xhr.method).to.equal("POST");
        expect(xhr.url).to.include(
            "/com.hedera.mirror.api.proto.ConsensusService/subscribeTopic",
        );

        const message = Buffer.from(
            frame(0, Uint8Array.from([7, 8, 9])),
        ).toString("base64");
        const trailers = Buffer.from(
            frame(TRAILER_FLAG, ascii("grpc-status: 0\r\n")),
        ).toString("base64");

        // stream in awkwardly split chunks
        xhr.push(message.slice(0, 5));
        xhr.push(message.slice(5) + trailers);
        xhr.onload();

        await done;
        expect(received).to.deep.equal([[7, 8, 9]]);
    });

    it("reports a retryable UNAVAILABLE when the stream ends without trailers", async function () {
        const channel = new NativeMirrorChannel("mirror.example.com:443");

        const done = new Promise((resolve, reject) => {
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([0]),
                () => {},
                resolve,
                () => reject(new Error("should not end cleanly")),
            );
        });

        FakeXMLHttpRequest.instances[0].onload();

        const err = await done;
        expect(err.code).to.equal(14);
    });
});
