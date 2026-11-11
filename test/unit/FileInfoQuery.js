import { vi } from "vitest";
import {
    AccountId,
    Client,
    FileId,
    FileInfo,
    FileInfoQuery,
    Hbar,
    LedgerId,
    PrivateKey,
    Query,
    Timestamp,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";

describe("FileInfoQuery", function () {
    let fileId;
    let nodeId;

    beforeEach(function () {
        fileId = new FileId(0, 0, 5005);
        nodeId = new AccountId(0, 0, 3);
    });

    describe("constructor", function () {
        it("should default fileId to null", function () {
            expect(new FileInfoQuery().fileId).to.be.null;
        });

        it("should set the fileId given in props", function () {
            const query = new FileInfoQuery({ fileId });

            expect(query.fileId.toString()).to.equal(fileId.toString());
        });

        it("should accept a string in props", function () {
            const query = new FileInfoQuery({ fileId: "0.0.5005" });

            expect(query.fileId.toString()).to.equal("0.0.5005");
        });
    });

    describe("setFileId", function () {
        it("should accept an instance", function () {
            const query = new FileInfoQuery().setFileId(fileId);

            expect(query.fileId.toString()).to.equal(fileId.toString());
        });

        it("should accept a string", function () {
            const query = new FileInfoQuery().setFileId("0.0.5005");

            expect(query.fileId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const query = new FileInfoQuery().setFileId(fileId);

            expect(query.fileId).to.not.equal(fileId);
        });

        it("should be chainable", function () {
            const query = new FileInfoQuery();

            expect(query.setFileId(fileId)).to.equal(query);
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode the fileId", function () {
            const query = FileInfoQuery._fromProtobuf({
                fileGetInfo: { fileID: fileId._toProtobuf() },
            });

            expect(query).to.be.instanceOf(FileInfoQuery);
            expect(query.fileId.toString()).to.equal(fileId.toString());
        });

        it("should leave a missing fileId null", function () {
            const query = FileInfoQuery._fromProtobuf({ fileGetInfo: {} });

            expect(query.fileId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the fileId", function () {
            const query = new FileInfoQuery().setFileId(fileId);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(FileInfoQuery);
            expect(decoded.fileId.toString()).to.equal(fileId.toString());
        });
    });

    describe("getCost", function () {
        it("should return the cost from Query.getCost()", async function () {
            const query = new FileInfoQuery().setFileId(fileId);
            const client = {};
            const getCost = vi
                .spyOn(Query.prototype, "getCost")
                .mockResolvedValue(Hbar.fromTinybars(100));

            try {
                const cost = await query.getCost(client);

                expect(getCost).toHaveBeenCalledTimes(1);
                expect(getCost).toHaveBeenCalledWith(client);
                expect(cost.toTinybars().toInt()).to.equal(100);
            } finally {
                getCost.mockRestore();
            }
        });
    });

    describe("_validateChecksums", function () {
        let mainnet, testnet;

        beforeEach(function () {
            mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
            testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
        });

        afterEach(function () {
            mainnet.close();
            testnet.close();
        });

        it("should check the file ID checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const query = new FileInfoQuery().setFileId(
                FileId.fromString("0.0.123-vfmkw"),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip an unset fileId", function () {
            expect(() =>
                new FileInfoQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call file.getFileInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                file: {
                    getFileInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new FileInfoQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the fileGetInfo header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new FileInfoQuery()._mapResponseHeader({
                    fileGetInfo: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the file info", async function () {
            const key = PrivateKey.generateED25519().publicKey;
            const query = new FileInfoQuery().setFileId(fileId);

            const result = await query._mapResponse(
                {
                    fileGetInfo: {
                        fileInfo: {
                            fileID: fileId._toProtobuf(),
                            size: Long.fromNumber(42),
                            expirationTime: new Timestamp(
                                1596210382,
                                0,
                            )._toProtobuf(),
                            deleted: false,
                            keys: { keys: [key._toProtobufKey()] },
                            memo: "memo",
                            ledgerId: LedgerId.TESTNET.toBytes(),
                        },
                    },
                },
                nodeId,
                {},
            );

            expect(result).to.be.instanceOf(FileInfo);
            expect(result.fileId.toString()).to.equal(fileId.toString());
            expect(result.size.toNumber()).to.equal(42);
            expect(result.expirationTime.seconds.toNumber()).to.equal(
                1596210382,
            );
            expect(result.isDeleted).to.be.false;
            expect(result.keys.toArray().map(String)).to.deep.equal([
                key.toString(),
            ]);
            expect(result.fileMemo).to.equal("memo");
            expect(result.ledgerId.isTestnet()).to.be.true;
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header and fileId", function () {
            const header = { payment: {} };
            const query = new FileInfoQuery().setFileId(fileId);

            expect(query._onMakeRequest(header)).to.deep.equal({
                fileGetInfo: {
                    header,
                    fileID: fileId._toProtobuf(),
                },
            });
        });

        it("should encode a missing fileId as null", function () {
            const header = { payment: {} };

            expect(new FileInfoQuery()._onMakeRequest(header)).to.deep.equal({
                fileGetInfo: {
                    header,
                    fileID: null,
                },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            expect(new FileInfoQuery()._getLogId()).to.match(
                /^FileInfoQuery:\d+$/,
            );
        });

        it("should use the payment transaction valid start", function () {
            const query = new FileInfoQuery();
            const validStart = { toString: () => "123.456" };
            query._paymentTransactionId = { validStart };

            expect(query._getLogId()).to.equal("FileInfoQuery:123.456");
        });
    });
});
