import Long from "long";
import * as HieroProto from "@hiero-ledger/proto";
import TokenRelationship from "../../src/account/TokenRelationship.js";
import TokenId from "../../src/token/TokenId.js";

describe("TokenRelationship", function () {
    const tokenId = new TokenId(1, 2, 3);
    const symbol = "TEST";

    /**
     * Builds a protobuf token relationship, overriding only the fields a test
     * cares about so each case stays focused on a single branch.
     *
     * `decimals` (field 6 of the proto message) is deliberately absent: the
     * class does not carry it, so including it here would silently break the
     * round-trip assertions. See the "should drop decimals" test below, which
     * pins that omission as current behavior rather than accident.
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

            expect(relationship.tokenId).to.equal(tokenId);
            expect(relationship.symbol).to.equal(symbol);
            expect(relationship.balance).to.equal(balance);
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
        describe("tokenId", function () {
            it("should map the token id", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith(),
                );

                expect(relationship.tokenId).to.be.instanceOf(TokenId);
                expect(relationship.tokenId.toString()).to.equal("1.2.3");
            });

            // `tokenId` is optional in `ITokenRelationship`, but the source
            // passes it to `TokenId._fromProtobuf` unguarded. These pin the
            // current throwing behavior; guarding it would be a source change.
            it("should throw when tokenId is missing", function () {
                expect(() =>
                    TokenRelationship._fromProtobuf({ symbol }),
                ).to.throw(TypeError);
            });

            it("should throw when tokenId is null", function () {
                expect(() =>
                    TokenRelationship._fromProtobuf({ tokenId: null, symbol }),
                ).to.throw(TypeError);
            });
        });

        describe("symbol", function () {
            it("should map the symbol", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith(),
                );

                expect(relationship.symbol).to.equal(symbol);
            });

            // `symbol` is `string|null` in the proto interface but is cast
            // without a guard, so absence surfaces as `undefined` on a
            // property documented as `string`.
            it("should leave a missing symbol undefined", function () {
                const proto = protoWith();
                delete proto.symbol;

                const relationship = TokenRelationship._fromProtobuf(proto);

                expect(relationship.symbol).to.be.undefined;
            });

            it("should leave a null symbol as null", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ symbol: null }),
                );

                expect(relationship.symbol).to.be.null;
            });
        });

        describe("status mapping", function () {
            const statuses = [
                { proto: undefined, value: null, label: "missing" },
                { proto: null, value: null, label: "null" },
                { proto: 0, value: null, label: "0 (NotApplicable)" },
                { proto: 1, value: true, label: "1 (Granted/Frozen)" },
                { proto: 2, value: false, label: "2 (Revoked/Unfrozen)" },
            ];

            for (const status of statuses) {
                it(`should map a ${status.label} kycStatus to ${String(
                    status.value,
                )}`, function () {
                    const proto = protoWith();
                    if (status.proto === undefined) {
                        delete proto.kycStatus;
                    } else {
                        proto.kycStatus = status.proto;
                    }

                    const relationship = TokenRelationship._fromProtobuf(proto);

                    expect(relationship.isKycGranted).to.equal(status.value);
                });

                it(`should map a ${status.label} freezeStatus to ${String(
                    status.value,
                )}`, function () {
                    const proto = protoWith();
                    if (status.proto === undefined) {
                        delete proto.freezeStatus;
                    } else {
                        proto.freezeStatus = status.proto;
                    }

                    const relationship = TokenRelationship._fromProtobuf(proto);

                    expect(relationship.isFrozen).to.equal(status.value);
                });
            }
        });

        describe("balance", function () {
            it("should default a null balance to zero", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ balance: null }),
                );

                expect(relationship.balance).to.be.instanceOf(Long);
                expect(relationship.balance.toString()).to.equal("0");
            });

            it("should default a missing balance to zero", function () {
                const proto = protoWith();
                delete proto.balance;

                const relationship = TokenRelationship._fromProtobuf(proto);

                expect(relationship.balance).to.be.instanceOf(Long);
                expect(relationship.balance.toString()).to.equal("0");
            });

            it("should keep the value of an existing Long balance", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ balance: Long.fromNumber(1234) }),
                );

                expect(relationship.balance).to.be.instanceOf(Long);
                expect(relationship.balance.toString()).to.equal("1234");
            });

            // `balance` is `uint64`, and a real decode hands back protobufjs's
            // own copy of the Long class, so the `instanceof` passthrough in
            // the source is false here and `Long.fromValue` runs instead. The
            // value must survive that conversion intact, including above
            // 2^63 where `toNumber()` would be lossy.
            it("should preserve a large uint64 balance from a real decode", function () {
                const balance = "18446744073709551000";

                const decoded = HieroProto.proto.TokenRelationship.decode(
                    HieroProto.proto.TokenRelationship.encode({
                        tokenId: tokenId._toProtobuf(),
                        symbol,
                        balance: Long.fromString(balance, true),
                        kycStatus: 1,
                        freezeStatus: 2,
                        automaticAssociation: true,
                    }).finish(),
                );

                const relationship = TokenRelationship._fromProtobuf(decoded);

                expect(relationship.balance.toString()).to.equal(balance);
                expect(relationship.isKycGranted).to.be.true;
                expect(relationship.isFrozen).to.be.false;
                expect(relationship.automaticAssociation).to.be.true;
            });

            // Outside the declared `Long|null` type of `ITokenRelationship`,
            // but the source's `Long.fromValue` fallback accepts it and the
            // issue calls for this case explicitly.
            it("should convert a plain number balance to a Long", function () {
                const relationship = TokenRelationship._fromProtobuf(
                    protoWith({ balance: 1234 }),
                );

                expect(relationship.balance).to.be.instanceOf(Long);
                expect(relationship.balance.toString()).to.equal("1234");
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

        it("should drop decimals", function () {
            const relationship = TokenRelationship._fromProtobuf(
                protoWith({ decimals: 8 }),
            );

            expect(relationship).to.not.have.property("decimals");
            expect(relationship._toProtobuf()).to.not.have.property("decimals");
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
                tokenId: {
                    shardNum: Long.fromNumber(1),
                    realmNum: Long.fromNumber(2),
                    tokenNum: Long.fromNumber(3),
                },
                symbol,
                balance,
                kycStatus: 1,
                freezeStatus: 2,
                automaticAssociation: true,
            });
        });

        it("should handle status codes correctly", function () {
            const combinations = [
                { isKycGranted: null, isFrozen: null, expected: [0, 0] },
                { isKycGranted: true, isFrozen: true, expected: [1, 1] },
                { isKycGranted: false, isFrozen: false, expected: [2, 2] },
                { isKycGranted: true, isFrozen: false, expected: [1, 2] },
                { isKycGranted: false, isFrozen: null, expected: [2, 0] },
            ];

            for (const combo of combinations) {
                const proto = relationshipWith({
                    isKycGranted: combo.isKycGranted,
                    isFrozen: combo.isFrozen,
                })._toProtobuf();

                expect(proto.kycStatus).to.equal(
                    combo.expected[0],
                    `isKycGranted=${String(
                        combo.isKycGranted,
                    )} should convert to ${combo.expected[0]}`,
                );
                expect(proto.freezeStatus).to.equal(
                    combo.expected[1],
                    `isFrozen=${String(combo.isFrozen)} should convert to ${
                        combo.expected[1]
                    }`,
                );
            }
        });

        it("should pass a null automaticAssociation straight through", function () {
            expect(
                relationshipWith({ automaticAssociation: null })._toProtobuf()
                    .automaticAssociation,
            ).to.be.null;
        });
    });

    describe("round-trip", function () {
        const statuses = [
            { proto: 0, value: null },
            { proto: 1, value: true },
            { proto: 2, value: false },
        ];

        // `kycStatus` and `freezeStatus` are independent ternaries in the
        // source, so the diagonal covers every branch the full grid would.
        for (const status of statuses) {
            it(`should round-trip status ${status.proto} unchanged`, function () {
                const proto = protoWith({
                    kycStatus: status.proto,
                    freezeStatus: status.proto,
                });

                const relationship = TokenRelationship._fromProtobuf(proto);

                expect(relationship.isKycGranted).to.equal(status.value);
                expect(relationship.isFrozen).to.equal(status.value);
                expect(relationship._toProtobuf()).to.deep.equal(proto);
            });
        }
    });
});
