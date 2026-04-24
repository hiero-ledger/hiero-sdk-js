import * as Minimal from "@hiero-ledger/proto/minimal";
import {
    KeyList,
    AccountID,
    FileAppendTransactionBody,
    ResponseCodeEnum,
    FileAppendTransaction,
    BasicTypes,
} from "@hiero-ledger/proto/minimal";
import { proto } from "@hiero-ledger/proto";

describe("@hiero-ledger/proto/minimal", function () {
    describe("flat named imports", function () {
        it.only("exposes enum types as plain objects with named members", function () {
            expect(ResponseCodeEnum).to.be.an("object");
            expect(ResponseCodeEnum.OK).to.equal(0);
            expect(ResponseCodeEnum.INVALID_TRANSACTION).to.equal(1);
            console.log(FileAppendTransactionBody);
        });
    });

    describe("namespace imports", function () {
        it("exposes each proto file as a namespace with its declared messages", function () {
            expect(typeof FileAppendTransaction).to.equal("object");
            expect(FileAppendTransaction).to.not.equal(null);
            expect(
                typeof FileAppendTransaction.TransactionBody.encode,
            ).to.equal("function");
            expect(typeof FileAppendTransaction.Transaction.decode).to.equal(
                "function",
            );
        });

        it("flat export and namespace export point to the same runtime value", function () {
            expect(BasicTypes.KeyList).to.equal(KeyList);
            expect(BasicTypes.AccountID).to.equal(AccountID);
        });
    });

    describe("colliding symbols stay namespace-only", function () {
        const COLLISIONS = [
            "Transaction",
            "TransactionBody",
            "TransactionList",
            "protobufPackage",
            "DeepPartial",
            "Exact",
            "MessageFns",
        ];

        it("does not expose ambiguous names on the barrel", function () {
            for (const name of COLLISIONS) {
                expect(
                    Minimal[name],
                    `${name} must be namespace-only to avoid ambiguity`,
                ).to.equal(undefined);
            }
        });

        it("reaches colliding names through the per-file namespace", function () {
            expect(
                typeof FileAppendTransaction.TransactionBody.encode,
            ).to.equal("function");
            expect(FileAppendTransaction.protobufPackage).to.equal("proto");
        });
    });

    describe("per-file subpath imports", function () {
        it("resolves @hiero-ledger/proto/minimal/<file> to the same module as the barrel", async function () {
            const basicTypes = await import(
                "@hiero-ledger/proto/minimal/basic_types"
            );
            expect(basicTypes.KeyList).to.equal(KeyList);
            expect(basicTypes.AccountID).to.equal(AccountID);
        });
    });

    describe("encode / decode round-trip", function () {
        it("KeyList round-trips through binary wire format", function () {
            const original = KeyList.fromPartial({
                keys: [
                    {
                        key: {
                            $case: "ed25519",
                            ed25519: new Uint8Array([1, 2, 3]),
                        },
                    },
                    {
                        key: {
                            $case: "ed25519",
                            ed25519: new Uint8Array([4, 5, 6]),
                        },
                    },
                ],
            });

            const bytes = KeyList.encode(original).finish();
            expect(bytes).to.be.instanceOf(Uint8Array);
            expect(bytes.length).to.be.greaterThan(0);

            const decoded = KeyList.decode(bytes);
            expect(decoded.keys).to.have.length(2);
            expect(decoded.keys[0].key.$case).to.equal("ed25519");
            expect(Array.from(decoded.keys[0].key.ed25519)).to.deep.equal([
                1, 2, 3,
            ]);
            expect(Array.from(decoded.keys[1].key.ed25519)).to.deep.equal([
                4, 5, 6,
            ]);
        });

        it("FileAppendTransactionBody preserves fields across encode/decode", function () {
            const original = FileAppendTransactionBody.fromPartial({
                fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
                contents: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
            });

            const bytes = FileAppendTransactionBody.encode(original).finish();
            const decoded = FileAppendTransactionBody.decode(bytes);

            expect(decoded.fileID.fileNum).to.equal(42n);
            expect(Array.from(decoded.contents)).to.deep.equal([
                0xde, 0xad, 0xbe, 0xef,
            ]);
        });
    });

    describe("wire compatibility with @hiero-ledger/proto (full)", function () {
        const FILE_APPEND_FIELDS = {
            shardNum: 0,
            realmNum: 0,
            fileNum: 42,
        };
        const CONTENTS = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

        it("minimal decodes bytes encoded by the full (pbjs) package", function () {
            const fullBytes = proto.FileAppendTransactionBody.encode(
                proto.FileAppendTransactionBody.create({
                    fileID: FILE_APPEND_FIELDS,
                    contents: CONTENTS,
                }),
            ).finish();

            const decoded = FileAppendTransactionBody.decode(fullBytes);
            expect(decoded.fileID.shardNum).to.equal(0n);
            expect(decoded.fileID.realmNum).to.equal(0n);
            expect(decoded.fileID.fileNum).to.equal(42n);
            expect(Array.from(decoded.contents)).to.deep.equal(
                Array.from(CONTENTS),
            );
        });

        it("full (pbjs) decodes bytes encoded by minimal", function () {
            const minimalBytes = FileAppendTransactionBody.encode(
                FileAppendTransactionBody.fromPartial({
                    fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
                    contents: CONTENTS,
                }),
            ).finish();

            const decoded =
                proto.FileAppendTransactionBody.decode(minimalBytes);
            // pbjs returns Long for int64 fields — compare via toString() to stay
            // independent of the Long representation.
            expect(decoded.fileID.shardNum.toString()).to.equal("0");
            expect(decoded.fileID.realmNum.toString()).to.equal("0");
            expect(decoded.fileID.fileNum.toString()).to.equal("42");
            expect(Array.from(decoded.contents)).to.deep.equal(
                Array.from(CONTENTS),
            );
        });

        // Note: pbjs in this SDK emits zero-valued int64 scalars when they are
        // populated via .create({ shardNum: 0, ... }); ts-proto (and the real
        // Hedera Java node) strip them per the proto3 spec. So bytes are NOT
        // byte-identical for shard=0/realm=0 payloads — but both sides decode
        // either dialect back to the same logical message, which is the only
        // guarantee mirror-node decoders need.
        it("round-trips correctly even though pbjs emits extra default-valued fields", function () {
            const minimalBytes = FileAppendTransactionBody.encode(
                FileAppendTransactionBody.fromPartial({
                    fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
                    contents: CONTENTS,
                }),
            ).finish();
            const fullBytes = proto.FileAppendTransactionBody.encode(
                proto.FileAppendTransactionBody.create({
                    fileID: { shardNum: 0, realmNum: 0, fileNum: 42 },
                    contents: CONTENTS,
                }),
            ).finish();

            expect(fullBytes.length).to.be.greaterThan(minimalBytes.length);

            const fromFull = FileAppendTransactionBody.decode(fullBytes);
            const fromMinimal =
                proto.FileAppendTransactionBody.decode(minimalBytes);
            expect(fromFull.fileID.fileNum).to.equal(42n);
            expect(fromMinimal.fileID.fileNum.toString()).to.equal("42");
        });

        it("KeyList with ed25519 oneof round-trips full → minimal", function () {
            const ed = new Uint8Array([1, 2, 3, 4]);
            const fullBytes = proto.KeyList.encode(
                proto.KeyList.create({ keys: [{ ed25519: ed }] }),
            ).finish();

            const decoded = KeyList.decode(fullBytes);
            expect(decoded.keys).to.have.length(1);
            expect(decoded.keys[0].key.$case).to.equal("ed25519");
            expect(Array.from(decoded.keys[0].key.ed25519)).to.deep.equal(
                Array.from(ed),
            );
        });

        it("KeyList with ed25519 oneof round-trips minimal → full", function () {
            const ed = new Uint8Array([5, 6, 7, 8]);
            const minimalBytes = KeyList.encode(
                KeyList.fromPartial({
                    keys: [{ key: { $case: "ed25519", ed25519: ed } }],
                }),
            ).finish();

            const decoded = proto.KeyList.decode(minimalBytes);
            expect(decoded.keys).to.have.length(1);
            expect(Array.from(decoded.keys[0].ed25519)).to.deep.equal(
                Array.from(ed),
            );
        });
    });
});
