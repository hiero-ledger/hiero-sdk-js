import Long from "long";
import TokenRelationship from "../../src/account/TokenRelationship.js";
import TokenId from "../../src/token/TokenId.js";

describe("TokenRelationship", function () {
    const tokenId = new TokenId(0, 0, 100);
    const symbol = "TEST";

    /**
     * Builds a protobuf token relationship, overriding only the fields a test
     * cares about so each case stays focused on a single branch.
     *
     * @param {object} [overrides]
     * @returns {object}
     */
    function protoWith(overrides = {}) {
        return {
            tokenId: tokenId._toProtobuf(),
            symbol,
            balance: Long.fromNumber(10),
            kycStatus: 0,
            freezeStatus: 0,
            automaticAssociation: false,
            ...overrides,
        };
    }

    describe("constructor", function () {
        it("should store properties correctly", function () {
            const balance = Long.fromNumber(50);

            const relationship = new TokenRelationship({
                tokenId,
                symbol,
                balance,
                isKycGranted: true,
                isFrozen: false,
                automaticAssociation: true,
            });

            expect(relationship.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(relationship.symbol).to.equal(symbol);
            expect(relationship.balance.toNumber()).to.equal(50);
            expect(relationship.isKycGranted).to.be.true;
            expect(relationship.isFrozen).to.be.false;
            expect(relationship.automaticAssociation).to.be.true;
        });

        it("should freeze the object", function () {
            const relationship = new TokenRelationship({
                tokenId,
                symbol,
                balance: Long.ZERO,
                isKycGranted: null,
                isFrozen: null,
                automaticAssociation: null,
            });

            expect(Object.isFrozen(relationship)).to.be.true;
        });
    });

    describe("_fromProtobuf", function () {
        it("should map the token id and symbol", function () {
            const relationship = TokenRelationship._fromProtobuf(protoWith());

            expect(relationship.tokenId.toString()).to.equal("0.0.100");
            expect(relationship.symbol).to.equal(symbol);
        });

        describe("kycStatus", function () {
            it("should map a missing kycStatus to null", function () {
                const proto = protoWith();
                delete proto.kycStatus;

                const relationship = TokenRelationship._fromProtobuf(proto);

                expect(relationship.isKycGranted).to.be.null;
            });

            it("should map a null kycStatus to null", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ kycStatus: null }),
                );

                expect(relationship.isKycGranted).to.be.null;
            });

            it("should map a kycStatus of 0 (KycNotApplicable) to null", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ kycStatus: 0 }),
                );

                expect(relationship.isKycGranted).to.be.null;
            });

            it("should map a kycStatus of 1 (Granted) to true", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ kycStatus: 1 }),
                );

                expect(relationship.isKycGranted).to.be.true;
            });

            it("should map a kycStatus of 2 (Revoked) to false", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ kycStatus: 2 }),
                );

                expect(relationship.isKycGranted).to.be.false;
            });
        });

        describe("freezeStatus", function () {
            it("should map a missing freezeStatus to null", function () {
                const proto = protoWith();
                delete proto.freezeStatus;

                const relationship = TokenRelationship._fromProtobuf(proto);

                expect(relationship.isFrozen).to.be.null;
            });

            it("should map a null freezeStatus to null", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ freezeStatus: null }),
                );

                expect(relationship.isFrozen).to.be.null;
            });

            it("should map a freezeStatus of 0 (FreezeNotApplicable) to null", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ freezeStatus: 0 }),
                );

                expect(relationship.isFrozen).to.be.null;
            });

            it("should map a freezeStatus of 1 (Frozen) to true", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ freezeStatus: 1 }),
                );

                expect(relationship.isFrozen).to.be.true;
            });

            it("should map a freezeStatus of 2 (Unfrozen) to false", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ freezeStatus: 2 }),
                );

                expect(relationship.isFrozen).to.be.false;
            });
        });

        describe("balance", function () {
            it("should default a null balance to zero", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ balance: null }),
                );

                expect(relationship.balance.toNumber()).to.equal(0);
            });

            it("should default a missing balance to zero", function () {
                const proto = protoWith();
                delete proto.balance;

                const relationship = TokenRelationship._fromProtobuf(proto);

                expect(relationship.balance.toNumber()).to.equal(0);
            });

            it("should pass an existing Long balance through untouched", function () {
                const balance = Long.fromNumber(1234);

                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ balance }),
                );

                expect(relationship.balance).to.equal(balance);
                expect(relationship.balance.toNumber()).to.equal(1234);
            });

            it("should convert a plain number balance to a Long", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ balance: 1234 }),
                );

                expect(relationship.balance instanceof Long).to.be.true;
                expect(relationship.balance.toNumber()).to.equal(1234);
            });

            it("should convert a string balance to a Long", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ balance: "1234" }),
                );

                expect(relationship.balance instanceof Long).to.be.true;
                expect(relationship.balance.toNumber()).to.equal(1234);
            });
        });

        describe("automaticAssociation", function () {
            it("should keep a true automaticAssociation", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ automaticAssociation: true }),
                );

                expect(relationship.automaticAssociation).to.be.true;
            });

            it("should keep a false automaticAssociation", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ automaticAssociation: false }),
                );

                expect(relationship.automaticAssociation).to.be.false;
            });

            it("should map a null automaticAssociation to null", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ automaticAssociation: null }),
                );

                expect(relationship.automaticAssociation).to.be.null;
            });

            it("should map a missing automaticAssociation to null", function () {
                const proto = protoWith();
                delete proto.automaticAssociation;

                const relationship = TokenRelationship._fromProtobuf(proto);

                expect(relationship.automaticAssociation).to.be.null;
            });
        });
    });

    describe("_toProtobuf", function () {
        /**
         * @param {object} [overrides]
         * @returns {TokenRelationship}
         */
        function relationshipWith(overrides = {}) {
            return new TokenRelationship({
                tokenId,
                symbol,
                balance: Long.fromNumber(10),
                isKycGranted: null,
                isFrozen: null,
                automaticAssociation: false,
                ...overrides,
            });
        }

        it("should produce the correct proto structure", function () {
            const balance = Long.fromNumber(10);

            const proto = relationshipWith({
                balance,
                isKycGranted: true,
                isFrozen: false,
                automaticAssociation: true,
            })._toProtobuf();

            expect(proto).to.deep.equal({
                tokenId: tokenId._toProtobuf(),
                symbol,
                balance,
                kycStatus: 1,
                freezeStatus: 2,
                automaticAssociation: true,
            });
        });

        it("should map a null isKycGranted to a kycStatus of 0", function () {
            expect(
                relationshipWith({ isKycGranted: null })._toProtobuf()
                    .kycStatus,
            ).to.equal(0);
        });

        it("should map a true isKycGranted to a kycStatus of 1", function () {
            expect(
                relationshipWith({ isKycGranted: true })._toProtobuf()
                    .kycStatus,
            ).to.equal(1);
        });

        it("should map a false isKycGranted to a kycStatus of 2", function () {
            expect(
                relationshipWith({ isKycGranted: false })._toProtobuf()
                    .kycStatus,
            ).to.equal(2);
        });

        it("should map a null isFrozen to a freezeStatus of 0", function () {
            expect(
                relationshipWith({ isFrozen: null })._toProtobuf().freezeStatus,
            ).to.equal(0);
        });

        it("should map a true isFrozen to a freezeStatus of 1", function () {
            expect(
                relationshipWith({ isFrozen: true })._toProtobuf().freezeStatus,
            ).to.equal(1);
        });

        it("should map a false isFrozen to a freezeStatus of 2", function () {
            expect(
                relationshipWith({ isFrozen: false })._toProtobuf()
                    .freezeStatus,
            ).to.equal(2);
        });
    });

    describe("round-trip", function () {
        const statuses = [
            { proto: 0, value: null },
            { proto: 1, value: true },
            { proto: 2, value: false },
        ];

        for (const kyc of statuses) {
            for (const freeze of statuses) {
                it(`should round-trip kycStatus ${kyc.proto} and freezeStatus ${freeze.proto}`, function () {
                    const proto = protoWith({
                        kycStatus: kyc.proto,
                        freezeStatus: freeze.proto,
                    });

                    const relationship = TokenRelationship._fromProtobuf(proto);

                    expect(relationship.isKycGranted).to.equal(kyc.value);
                    expect(relationship.isFrozen).to.equal(freeze.value);
                    expect(relationship._toProtobuf()).to.deep.equal(proto);

                    const roundTripped = TokenRelationship._fromProtobuf(
                        relationship._toProtobuf(),
                    );

                    expect(roundTripped.tokenId.toString()).to.equal(
                        relationship.tokenId.toString(),
                    );
                    expect(roundTripped.symbol).to.equal(relationship.symbol);
                    expect(roundTripped.balance.toNumber()).to.equal(
                        relationship.balance.toNumber(),
                    );
                    expect(roundTripped.isKycGranted).to.equal(
                        relationship.isKycGranted,
                    );
                    expect(roundTripped.isFrozen).to.equal(
                        relationship.isFrozen,
                    );
                    expect(roundTripped.automaticAssociation).to.equal(
                        relationship.automaticAssociation,
                    );
                });
            }
        }

        it("should normalize a null kycStatus and freezeStatus to 0 on the way back out", function () {
            const relationship = TokenRelationship._fromProtobuf(
                protoWith({ kycStatus: null, freezeStatus: null }),
            );

            const proto = relationship._toProtobuf();

            expect(proto.kycStatus).to.equal(0);
            expect(proto.freezeStatus).to.equal(0);
        });
    });
});
