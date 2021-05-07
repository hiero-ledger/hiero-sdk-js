import FileCreateTransaction from "../src/file/FileCreateTransaction.js";
import FileDeleteTransaction from "../src/file/FileDeleteTransaction.js";
import FileContentsQuery from "../src/file/FileContentsQuery.js";
import Hbar from "../src/Hbar.js";
import Status from "../src/Status.js";
import newClient from "./client/index.js";
import * as utf8 from "../src/encoding/utf8.js";

describe("FileContents", function () {
    it("should be executable", async function () {
        this.timeout(15000);

        const env = await newClient.new();
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setNodeAccountIds(env.nodeAccountIds)
            .setContents("[e2e::FileCreateTransaction]")
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        const contents = await new FileContentsQuery()
            .setFileId(file)
            .setNodeAccountIds([response.nodeId])
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(utf8.decode(contents)).to.be.equal(
            "[e2e::FileCreateTransaction]"
        );

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .setNodeAccountIds([response.nodeId])
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should be executable with empty contents", async function () {
        this.timeout(15000);

        const env = await newClient.new();
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setNodeAccountIds(env.nodeAccountIds)
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        const contents = await new FileContentsQuery()
            .setFileId(file)
            .setNodeAccountIds([response.nodeId])
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(utf8.decode(contents)).to.be.equal("");

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .setNodeAccountIds([response.nodeId])
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error when file ID is not set", async function () {
        this.timeout(15000);

        const env = await newClient.new();

        let err = false;

        try {
            await new FileContentsQuery()
                .setQueryPayment(new Hbar(1))
                .setNodeAccountIds(env.nodeAccountIds)
                .execute(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidFileId);
        }

        if (!err) {
            throw new Error("file contents query did not error");
        }
    });
});
