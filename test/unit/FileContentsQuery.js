import {
    AccountId,
    Client,
    FileContentsQuery,
    FileId,
    Query,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("FileContentsQuery", function () {
    let fileId;
    let nodeId;

    beforeEach(function () {
        fileId = new FileId(0, 0, 5005);
        nodeId = new AccountId(0, 0, 3);
    });

    describe("constructor", function () {
        it("should default fileId to null", function () {
            expect(new FileContentsQuery().fileId).to.be.null;
        });

        it("should set the fileId given in props", function () {
            const query = new FileContentsQuery({ fileId });

            expect(query.fileId.toString()).to.equal(fileId.toString());
        });

        it("should accept a string in props", function () {
            const query = new FileContentsQuery({ fileId: "0.0.5005" });

            expect(query.fileId.toString()).to.equal("0.0.5005");
        });
    });

    describe("setFileId", function () {
        it("should accept an instance", function () {
            const query = new FileContentsQuery().setFileId(fileId);

            expect(query.fileId.toString()).to.equal(fileId.toString());
        });

        it("should accept a string", function () {
            const query = new FileContentsQuery().setFileId("0.0.5005");

            expect(query.fileId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const query = new FileContentsQuery().setFileId(fileId);

            expect(query.fileId).to.not.equal(fileId);
        });

        it("should be chainable", function () {
            const query = new FileContentsQuery();

            expect(query.setFileId(fileId)).to.equal(query);
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode the fileId", function () {
            const query = FileContentsQuery._fromProtobuf({
                fileGetContents: { fileID: fileId._toProtobuf() },
            });

            expect(query).to.be.instanceOf(FileContentsQuery);
            expect(query.fileId.toString()).to.equal(fileId.toString());
        });

        it("should leave a missing fileId null", function () {
            const query = FileContentsQuery._fromProtobuf({
                fileGetContents: {},
            });

            expect(query.fileId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the fileId", function () {
            const query = new FileContentsQuery().setFileId(fileId);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(FileContentsQuery);
            expect(decoded.fileId.toString()).to.equal(fileId.toString());
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
            const query = new FileContentsQuery().setFileId(
                FileId.fromString("0.0.123-vfmkw"),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip an unset fileId", function () {
            expect(() =>
                new FileContentsQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call file.getFileContent() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                file: {
                    getFileContent: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new FileContentsQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the fileGetContents header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new FileContentsQuery()._mapResponseHeader({
                    fileGetContents: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should return the file contents", async function () {
            const contents = new TextEncoder().encode("hello");
            const query = new FileContentsQuery().setFileId(fileId);

            const result = await query._mapResponse(
                {
                    fileGetContents: {
                        fileContents: {
                            fileID: fileId._toProtobuf(),
                            contents,
                        },
                    },
                },
                nodeId,
                {},
            );

            expect(result).to.equal(contents);
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header and fileId", function () {
            const header = { payment: {} };
            const query = new FileContentsQuery().setFileId(fileId);

            expect(query._onMakeRequest(header)).to.deep.equal({
                fileGetContents: {
                    header,
                    fileID: fileId._toProtobuf(),
                },
            });
        });

        it("should encode a missing fileId as null", function () {
            const header = { payment: {} };

            expect(
                new FileContentsQuery()._onMakeRequest(header),
            ).to.deep.equal({
                fileGetContents: {
                    header,
                    fileID: null,
                },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            expect(new FileContentsQuery()._getLogId()).to.match(
                /^FileContentsQuery:\d+$/,
            );
        });

        it("should use the payment transaction valid start", function () {
            const query = new FileContentsQuery();
            const validStart = { toString: () => "123.456" };
            query._paymentTransactionId = { validStart };

            expect(query._getLogId()).to.equal("FileContentsQuery:123.456");
        });
    });
});
