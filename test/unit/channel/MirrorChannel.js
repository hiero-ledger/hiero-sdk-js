// SPDX-License-Identifier: Apache-2.0

import MirrorChannel from "../../../src/channel/MirrorChannel.js";

class TestMirrorChannel extends MirrorChannel {
    constructor() {
        super();

        this.closed = false;
        this.serverStreamRequested = false;
        this.serverStreamCancelled = false;
    }

    close() {
        this.closed = true;
    }

    makeServerStreamRequest() {
        this.serverStreamRequested = true;

        return () => {
            this.serverStreamCancelled = true;
        };
    }
}

describe("MirrorChannel", function () {
    it("should throw 'not implemented' when close() is called directly", function () {
        const channel = new MirrorChannel();

        expect(() => channel.close()).to.throw("not implemented");
    });

    it("should throw 'not implemented' when makeServerStreamRequest() is called directly", function () {
        const channel = new MirrorChannel();

        expect(() => channel.makeServerStreamRequest()).to.throw(
            "not implemented",
        );
    });

    it("should allow subclasses to override abstract methods", function () {
        const channel = new TestMirrorChannel();

        expect(() => channel.close()).to.not.throw();
        expect(channel.closed).to.be.true;

        const cancel = channel.makeServerStreamRequest();

        expect(channel.serverStreamRequested).to.be.true;
        expect(() => cancel()).to.not.throw();
        expect(channel.serverStreamCancelled).to.be.true;
    });
});
