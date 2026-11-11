import {
    AccountId,
    ContractId,
    DelegateContractId,
    BadEntityIdError,
} from "../../src/index.js";

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

    it("should validate and throw for mismatched checksum on AccountId, ContractId and DelegateContractId (#4757)", function () {
        const mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
        const testnet = Client.forTestnet({ scheduleNetworkUpdate: false });

        const accountId = AccountId.fromString("0.0.123-vfmkw");
        expect(accountId.checksum).to.equal("vfmkw");
        expect(() => accountId.validateChecksum(mainnet)).to.not.throw();
        expect(() => accountId.validateChecksum(testnet)).to.throw(
            BadEntityIdError,
        );

        const contractId = ContractId.fromString("0.0.123-vfmkw");
        expect(contractId.checksum).to.equal("vfmkw");
        expect(() => contractId.validateChecksum(mainnet)).to.not.throw();
        expect(() => contractId.validateChecksum(testnet)).to.throw(
            BadEntityIdError,
        );

        const delegateContractId =
            DelegateContractId.fromString("0.0.123-vfmkw");
        expect(delegateContractId.checksum).to.equal("vfmkw");
        expect(() =>
            delegateContractId.validateChecksum(mainnet),
        ).to.not.throw();
        expect(() => delegateContractId.validateChecksum(testnet)).to.throw(
            BadEntityIdError,
        );
    });
});
