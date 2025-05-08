import {
    FileCreateTransaction,
    FileDeleteTransaction,
    FileUpdateTransaction,
    FileInfoQuery,
    Hbar,
    Status,
    AccountId,
    PrivateKey,
} from "../../src/exports.js";
import IntegrationTestEnv, { Client } from "./client/NodeIntegrationTestEnv.js";

describe("FileUpdate", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents("[e2e::FileCreateTransaction]")
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        let info = await new FileInfoQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(22))
            .execute(env.client);

        expect(info.fileId.toString()).to.be.equal(file.toString());
        expect(info.size.toInt()).to.be.equal(28);
        expect(info.isDeleted).to.be.false;

        // There should only be one key
        for (const key of info.keys) {
            expect(key.toString()).to.be.equal(operatorKey.toString());
        }

        await (
            await new FileUpdateTransaction()
                .setFileId(file)
                .setContents("[e2e::FileUpdateTransaction]")
                .execute(env.client)
        ).getReceipt(env.client);

        info = await new FileInfoQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(22))
            .execute(env.client);

        expect(info.fileId.toString()).to.be.equal(file.toString());
        expect(info.size.toInt()).to.be.equal(28);
        expect(info.isDeleted).to.be.false;

        // There should only be one key
        for (const key of info.keys) {
            expect(key.toString()).to.be.equal(operatorKey.toString());
        }

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error when file ID is not set", async function () {
        let err = false;

        try {
            await (
                await new FileUpdateTransaction()
                    .setContents("[e2e::FileUpdateTransaction]")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidFileId);
        }

        if (!err) {
            throw new Error("file update did not error");
        }
    });

    it("should not error when FEE_SCHEDULE_FILE_PART_UPLOADED response", async function () {
        const OPERATOR_ID = AccountId.fromString("0.0.2");
        const OPERATOR_KEY = PrivateKey.fromStringED25519(
            "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137",
        );
        const FEES_FILE_ID = "0.0.111";
        const DUMMY_TEXT = "Hello, Hedera!";

        const client = Client.forLocalNode().setOperator(
            OPERATOR_ID,
            OPERATOR_KEY,
        );

        await (
            await new FileUpdateTransaction()
                .setFileId(FEES_FILE_ID)
                .setContents(DUMMY_TEXT)
                .execute(client)
        ).getReceipt(client);
    });

    afterAll(async function () {
        await env.close();
    });
});
