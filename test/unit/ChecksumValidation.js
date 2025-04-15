import { AccountId } from "../../src/index.js";

import Client from "../../src/client/NodeClient.js";

describe("ChecksumValidation", function () {
    it("should parse mainnet ID with checksum {0.0.123-vfmkw}", function () {
        const accountId = AccountId.fromString("0.0.123-vfmkw");

        expect(accountId.num.toNumber()).to.eql(123);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);

        expect(
            accountId.toStringWithChecksum(
                Client.forMainnet({ scheduleNetworkUpdate: false }),
            ),
        ).to.be.eql("0.0.123-vfmkw");
    });

    it("should parse testnet ID with checksum {0.0.123-esxsf}", function () {
        const accountId = AccountId.fromString("0.0.123-esxsf");

        expect(accountId.num.toNumber()).to.eql(123);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);

        expect(
            accountId.toStringWithChecksum(
                Client.forTestnet({ scheduleNetworkUpdate: false }),
            ),
        ).to.be.eql("0.0.123-esxsf");
    });

    it("should parse previewnet ID with checksum {0.0.123-ogizo}", function () {
        const accountId = AccountId.fromString("0.0.123-ogizo");

        expect(accountId.num.toNumber()).to.eql(123);
        expect(accountId.realm.toNumber()).to.eql(0);
        expect(accountId.shard.toNumber()).to.eql(0);

        expect(
            accountId.toStringWithChecksum(
                Client.forPreviewnet({ scheduleNetworkUpdate: false }),
            ),
        ).to.be.eql("0.0.123-ogizo");
    });
});
