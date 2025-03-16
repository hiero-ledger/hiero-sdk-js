import {
    FileContentsQuery,
    FileCreateTransaction,
    FileDeleteTransaction,
    Hbar,
    Status,
} from "../../src/exports.js";
import * as utf8 from "../../src/encoding/utf8.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("FileContents", function () {
    let env;

    before(async function () {
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

        const contents = await new FileContentsQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(utf8.decode(contents)).to.be.equal(
            "[e2e::FileCreateTransaction]",
        );

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should be executable with empty contents", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        const contents = await new FileContentsQuery()
            .setFileId(file)
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(utf8.decode(contents)).to.be.equal("");

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error when file ID is not set", async function () {
        let err = false;

        try {
            await new FileContentsQuery().execute(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidFileId);
        }

        if (!err) {
            throw new Error("file contents query did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
