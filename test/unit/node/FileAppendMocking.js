import { FileAppendTransaction } from "../../../src/index.js";
import Mocker, {
    UNAVAILABLE,
    TRANSACTION_RECEIPT_SUCCESS_RESPONSE,
    TRANSACTION_RECEIPT_FAILED_RESPONSE,
} from "../Mocker.js";
import { bigContents } from "../../integration/contents.js";
import { proto } from "@hiero-ledger/proto";

describe("FileAppendMocking", function () {
    it("works", async function () {
        const { client, servers } = await Mocker.withResponses([
            [
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
            ],
        ]);

        const transaction = new FileAppendTransaction()
            // Default changed to 4096
            .setChunkSize(2048)
            .setFileId("0.0.3")
            .setContents(bigContents)
            .freezeWith(client);

        const responses = await transaction.executeAll(client);

        expect(responses[0].transactionId.toString()).to.be.equal(
            transaction._transactionIds.list[0].toString(),
        );
        expect(responses[1].transactionId.toString()).to.be.equal(
            transaction._transactionIds.list[1].toString(),
        );
        expect(responses[2].transactionId.toString()).to.be.equal(
            transaction._transactionIds.list[2].toString(),
        );
        expect(responses[3].transactionId.toString()).to.be.equal(
            transaction._transactionIds.list[3].toString(),
        );
        expect(responses[4].transactionId.toString()).to.be.equal(
            transaction._transactionIds.list[4].toString(),
        );
        expect(responses[5].transactionId.toString()).to.be.equal(
            transaction._transactionIds.list[5].toString(),
        );
        expect(responses[6].transactionId.toString()).to.be.equal(
            transaction._transactionIds.list[6].toString(),
        );

        servers.close();
    });

    it("fails if any inner transaction fails", async function () {
        const { client, servers } = await Mocker.withResponses([
            [
                {
                    response: {
                        nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
                    },
                },
                { response: TRANSACTION_RECEIPT_FAILED_RESPONSE },
            ],
        ]);

        let err = false;

        try {
            await new FileAppendTransaction()
                // Default changed to 4096
                .setChunkSize(2048)
                .setFileId("0.0.3")
                .setContents(bigContents)
                .execute(client);
        } catch (error) {
            err = error.toString().includes("INVALID_FILE_ID");
        }

        if (!err) {
            throw new Error("did not error");
        }

        servers.close();
    });

    it("errors with max retries in case of BUSY precheck", async function () {
        const { client, servers } = await Mocker.withResponses([
            [
                {
                    response: {
                        nodeTransactionPrecheckCode:
                            proto.ResponseCodeEnum.BUSY,
                    },
                },
            ],
        ]);

        try {
            await new FileAppendTransaction()
                // Default changed to 4096
                .setChunkSize(2048)
                .setContents("a")
                .setMaxAttempts(1)
                .execute(client);
        } catch (error) {
            if (
                error.message !==
                "max attempts of 1 was reached for request with last error being: BUSY"
            ) {
                throw error;
            }
        }

        servers.close();
    });

    it("errors with max retries in case of UNAVAILABLE grpc status", async function () {
        const { client, servers } = await Mocker.withResponses([
            [{ error: UNAVAILABLE }],
        ]);

        try {
            await new FileAppendTransaction()
                // Default changed to 4096
                .setChunkSize(2048)
                .setContents("a")
                .setMaxAttempts(1)
                .execute(client);
        } catch (error) {
            if (
                error.message !==
                "max attempts of 1 was reached for request with last error being: GrpcServiceError: gRPC service failed with: Status: UNAVAILABLE, Code: 14: node is UNAVAILABLE"
            ) {
                throw error;
            }
        }

        servers.close();
    });
});
