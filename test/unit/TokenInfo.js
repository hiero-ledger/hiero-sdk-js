import {
    TokenId,
    AccountId,
    Timestamp,
    TokenType,
    TokenSupplyType,
    CustomFixedFee,
    LedgerId,
    PrivateKey,
} from "../../src/index.js";
import TokenInfo from "../../src/token/TokenInfo.js";
import Duration from "../../src/Duration.js";
import Long from "long";

describe("TokenInfo", function () {
    let defaultTokenInfo;
    let tokenId;
    let treasuryId;
    let autoRenewAccountId;
    let expirationTime;
    let autoRenewPeriod;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 1234);
        treasuryId = new AccountId(0, 0, 5678);
        autoRenewAccountId = new AccountId(0, 0, 9876);
        expirationTime = new Timestamp(1624430225, 0);
        autoRenewPeriod = new Duration(90, 0);

        defaultTokenInfo = new TokenInfo({
            tokenId: tokenId,
            name: "Test Token",
            symbol: "TTK",
            decimals: 8,
            totalSupply: Long.fromNumber(1000000),
            treasuryAccountId: treasuryId,
            adminKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            kycKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            freezeKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            pauseKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            wipeKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            supplyKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            feeScheduleKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            defaultFreezeStatus: false,
            defaultKycStatus: true,
            pauseStatus: false,
            isDeleted: false,
            autoRenewAccountId: autoRenewAccountId,
            autoRenewPeriod: autoRenewPeriod,
            expirationTime: expirationTime,
            tokenMemo: "Test memo",
            customFees: [
                new CustomFixedFee({
                    feeCollectorAccountId: new AccountId(0, 0, 4321),
                    amount: Long.fromNumber(10),
                    denominatingTokenId: tokenId,
                }),
            ],
            tokenType: TokenType.FungibleCommon,
            supplyType: TokenSupplyType.Finite,
            maxSupply: Long.fromNumber(2000000),
            ledgerId: LedgerId.fromString("mainnet"),
            metadataKey: PrivateKey.fromStringDer(
                "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
            ),
            metadata: new Uint8Array([1, 2, 3, 4]),
        });
    });

    describe("_toProtobuf", function () {
        it("should correctly convert all fields to protobuf format", function () {
            const protoObj = defaultTokenInfo._toProtobuf();

            // Verify token basics
            expect(protoObj.tokenId.shardNum.toNumber()).to.equal(0);
            expect(protoObj.tokenId.realmNum.toNumber()).to.equal(0);
            expect(protoObj.tokenId.tokenNum.toNumber()).to.equal(1234);
            expect(protoObj.name).to.equal("Test Token");
            expect(protoObj.symbol).to.equal("TTK");
            expect(protoObj.decimals).to.equal(8);
            expect(protoObj.totalSupply.toNumber()).to.equal(1000000);

            // Verify account IDs
            expect(protoObj.treasury.shardNum.toNumber()).to.equal(0);
            expect(protoObj.treasury.realmNum.toNumber()).to.equal(0);
            expect(protoObj.treasury.accountNum.toNumber()).to.equal(5678);

            expect(protoObj.autoRenewAccount.shardNum.toNumber()).to.equal(0);
            expect(protoObj.autoRenewAccount.realmNum.toNumber()).to.equal(0);
            expect(protoObj.autoRenewAccount.accountNum.toNumber()).to.equal(
                9876,
            );

            // Verify keys exist
            expect(protoObj.adminKey).to.not.be.null;
            expect(protoObj.kycKey).to.not.be.null;
            expect(protoObj.freezeKey).to.not.be.null;
            expect(protoObj.pauseKey).to.not.be.null;
            expect(protoObj.wipeKey).to.not.be.null;
            expect(protoObj.supplyKey).to.not.be.null;
            expect(protoObj.feeScheduleKey).to.not.be.null;
            expect(protoObj.metadataKey).to.not.be.null;

            // Verify status values
            expect(protoObj.defaultFreezeStatus).to.equal(2); // false = 2
            expect(protoObj.defaultKycStatus).to.equal(1); // true = 1
            expect(protoObj.pauseStatus).to.equal(2); // false = 2
            expect(protoObj.deleted).to.be.false;

            // Verify time-related fields
            expect(protoObj.autoRenewPeriod.seconds.toNumber()).to.equal(90);
            expect(protoObj.expiry.seconds.toNumber()).to.equal(1624430225);

            // Verify other fields
            expect(protoObj.memo).to.equal("Test memo");
            expect(protoObj.customFees.length).to.equal(1);
            expect(protoObj.tokenType).to.equal(0); // FungibleCommon = 0
            expect(protoObj.supplyType).to.equal(1); // Finite = 1
            expect(protoObj.maxSupply.toNumber()).to.equal(2000000);
            expect(protoObj.ledgerId).to.not.be.null;
            expect(protoObj.metadata).to.not.be.null;
        });

        it("should handle null values correctly", function () {
            const minimalTokenInfo = new TokenInfo({
                tokenId: tokenId,
                name: "Minimal Token",
                symbol: "MIN",
                decimals: 0,
                totalSupply: Long.fromNumber(0),
                treasuryAccountId: null,
                adminKey: null,
                kycKey: null,
                freezeKey: null,
                pauseKey: null,
                wipeKey: null,
                supplyKey: null,
                feeScheduleKey: null,
                defaultFreezeStatus: null,
                defaultKycStatus: null,
                pauseStatus: null,
                isDeleted: false,
                autoRenewAccountId: null,
                autoRenewPeriod: null,
                expirationTime: null,
                tokenMemo: "",
                customFees: [],
                tokenType: null,
                supplyType: null,
                maxSupply: null,
                ledgerId: null,
                metadataKey: null,
                metadata: null,
            });

            const protoObj = minimalTokenInfo._toProtobuf();

            // Verify token basics still present
            expect(protoObj.tokenId.tokenNum.toNumber()).to.equal(1234);
            expect(protoObj.name).to.equal("Minimal Token");
            expect(protoObj.symbol).to.equal("MIN");

            // Verify null fields
            expect(protoObj.treasury).to.be.null;
            expect(protoObj.adminKey).to.be.null;
            expect(protoObj.kycKey).to.be.null;
            expect(protoObj.freezeKey).to.be.null;
            expect(protoObj.pauseKey).to.be.null;
            expect(protoObj.wipeKey).to.be.null;
            expect(protoObj.supplyKey).to.be.null;
            expect(protoObj.feeScheduleKey).to.be.null;

            // Verify default status values
            expect(protoObj.defaultFreezeStatus).to.equal(0); // null = 0
            expect(protoObj.defaultKycStatus).to.equal(0); // null = 0
            expect(protoObj.pauseStatus).to.equal(0); // null = 0

            // Verify other fields
            expect(protoObj.autoRenewAccount).to.be.undefined;
            expect(protoObj.autoRenewPeriod).to.be.null;
            expect(protoObj.expiry).to.be.null;
            expect(protoObj.memo).to.equal("");
            expect(protoObj.customFees).to.be.an("array").that.is.empty;
            expect(protoObj.tokenType).to.be.null;
            expect(protoObj.supplyType).to.be.null;
            expect(protoObj.maxSupply).to.be.null;
            expect(protoObj.ledgerId).to.be.null;
            expect(protoObj.metadataKey).to.be.null;
            expect(protoObj.metadata).to.be.null;
        });

        it("should handle status codes correctly", function () {
            // Test all combinations of freeze/kyc/pause status
            const combinations = [
                {
                    defaultFreezeStatus: null,
                    defaultKycStatus: null,
                    pauseStatus: null,
                    expected: [0, 0, 0],
                },
                {
                    defaultFreezeStatus: true,
                    defaultKycStatus: true,
                    pauseStatus: true,
                    expected: [1, 1, 1],
                },
                {
                    defaultFreezeStatus: false,
                    defaultKycStatus: false,
                    pauseStatus: false,
                    expected: [2, 2, 2],
                },
                {
                    defaultFreezeStatus: true,
                    defaultKycStatus: false,
                    pauseStatus: null,
                    expected: [1, 2, 0],
                },
            ];

            for (const combo of combinations) {
                const tokenInfo = new TokenInfo({
                    ...defaultTokenInfo,
                    defaultFreezeStatus: combo.defaultFreezeStatus,
                    defaultKycStatus: combo.defaultKycStatus,
                    pauseStatus: combo.pauseStatus,
                });

                const protoObj = tokenInfo._toProtobuf();

                expect(protoObj.defaultFreezeStatus).to.equal(
                    combo.expected[0],
                    `defaultFreezeStatus=${combo.defaultFreezeStatus} should convert to ${combo.expected[0]}`,
                );
                expect(protoObj.defaultKycStatus).to.equal(
                    combo.expected[1],
                    `defaultKycStatus=${combo.defaultKycStatus} should convert to ${combo.expected[1]}`,
                );
                expect(protoObj.pauseStatus).to.equal(
                    combo.expected[2],
                    `pauseStatus=${combo.pauseStatus} should convert to ${combo.expected[2]}`,
                );
            }
        });

        it("should correctly handle metadata values", function () {
            // Test with provided metadata
            const metadata = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in bytes
            const tokenInfo = new TokenInfo({
                ...defaultTokenInfo,
                metadata: metadata,
            });

            const protoObj = tokenInfo._toProtobuf();
            expect(protoObj.metadata).to.deep.equal(metadata);

            // Test with null metadata
            const nullMetadataInfo = new TokenInfo({
                ...defaultTokenInfo,
                metadata: null,
            });

            const nullProtoObj = nullMetadataInfo._toProtobuf();
            expect(nullProtoObj.metadata).to.be.null;
        });

        it("should convert custom fees correctly", function () {
            // Create token info with multiple custom fees
            const fixedFee = new CustomFixedFee({
                feeCollectorAccountId: new AccountId(0, 0, 4321),
                amount: Long.fromNumber(10),
                denominatingTokenId: tokenId,
            });

            const tokenInfo = new TokenInfo({
                ...defaultTokenInfo,
                customFees: [fixedFee, fixedFee], // Add two instances
            });

            const protoObj = tokenInfo._toProtobuf();
            expect(protoObj.customFees).to.be.an("array").with.lengthOf(2);

            // Verify first custom fee
            expect(protoObj.customFees[0].fixedFee).to.not.be.null;
            expect(protoObj.customFees[0].fixedFee.amount.toNumber()).to.equal(
                10,
            );
        });
    });
});
