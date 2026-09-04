import MirrorNode from "../../src/MirrorNode.js";

describe("ManagedNode", function () {
    it("preserves distinct min and max backoff when cloning", function () {
        const minBackoff = 8000;
        const maxBackoff = 1000 * 60 * 60;

        const node = new MirrorNode({
            newNode: {
                address: "testnet.mirrornode.hedera.com:443",
                channelInitFunction: () => ({}),
            },
        });

        expect(node.minBackoff).to.equal(minBackoff);
        expect(node.maxBackoff).to.equal(maxBackoff);

        // Clone via ManagedNode cloneNode constructor path
        const cloned = new MirrorNode({
            cloneNode: {
                node,
                address: node.address,
            },
        });

        expect(cloned.minBackoff).to.equal(minBackoff);
        expect(cloned.maxBackoff).to.equal(maxBackoff);
        expect(cloned.maxBackoff).to.not.equal(cloned.minBackoff);
    });
});
