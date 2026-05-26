// SPDX-License-Identifier: Apache-2.0

import sinon from "sinon";
import ContractCreateFlow from "../../../src/contract/ContractCreateFlow.js";
import PrivateKey from "../../../src/PrivateKey.js";
import FileId from "../../../src/file/FileId.js";
import FileCreateTransaction from "../../../src/file/FileCreateTransaction.js";
import FileAppendTransaction from "../../../src/file/FileAppendTransaction.js";
import FileDeleteTransaction from "../../../src/file/FileDeleteTransaction.js";
import ContractCreateTransaction from "../../../src/contract/ContractCreateTransaction.js";


// Builds a minimal mock client for ContractCreateFlow.execute().
function makeMockClient({ withOperator = true } = {}) {
    const operatorKey = withOperator
        ? PrivateKey.generateECDSA().publicKey
        : null;
    return {
        operatorPublicKey: operatorKey,
        operatorAccountId: operatorKey ? { toString: () => "0.0.2" } : null,
    };
}

// Stubs all four transaction classes 
function stubTransactions() {
    const fileId = FileId.fromString("0.0.999");

    const receipt = { fileId };
    const response = { getReceipt: sinon.stub().resolves(receipt) };

    // FileCreateTransaction
    const fileCreateFreeze = sinon
        .stub(FileCreateTransaction.prototype, "freezeWith")
        .returnsThis();
    const fileCreateExecute = sinon
        .stub(FileCreateTransaction.prototype, "execute")
        .resolves(response);

    // FileAppendTransaction
    const fileAppendFreeze = sinon
        .stub(FileAppendTransaction.prototype, "freezeWith")
        .returnsThis();
    const fileAppendExecute = sinon
        .stub(FileAppendTransaction.prototype, "execute")
        .resolves(response);

    // ContractCreateTransaction
    const contractCreateFreeze = sinon
        .stub(ContractCreateTransaction.prototype, "freezeWith")
        .returnsThis();
    const contractCreateExecute = sinon
        .stub(ContractCreateTransaction.prototype, "execute")
        .resolves(response);

    // FileDeleteTransaction
    const fileDeleteFreeze = sinon
        .stub(FileDeleteTransaction.prototype, "freezeWith")
        .returnsThis();
    const fileDeleteExecute = sinon
        .stub(FileDeleteTransaction.prototype, "execute")
        .resolves(response);

    return {
        stubs: {
            fileCreateFreeze,
            fileCreateExecute,
            fileAppendFreeze,
            fileAppendExecute,
            contractCreateFreeze,
            contractCreateExecute,
            fileDeleteFreeze,
            fileDeleteExecute,
        },
    };
}

describe("ContractCreateFlow", function () {
    afterEach(function () {
        sinon.restore();
    });

    // setBytecode
    describe("setBytecode", function () {
        it("accepts hex string and Uint8Array — both store identical bytes", function () {
            const hexString = "6080604052";
            const bytesFromString = new TextEncoder().encode(hexString);

            const flowFromString = new ContractCreateFlow();
            const flowFromBytes = new ContractCreateFlow();

            flowFromString.setBytecode(hexString);
            flowFromBytes.setBytecode(bytesFromString);

            expect(flowFromString.bytecode).to.be.an.instanceOf(Uint8Array);
            expect(flowFromBytes.bytecode).to.be.an.instanceOf(Uint8Array);
            expect(flowFromString.bytecode).to.deep.equal(
                flowFromBytes.bytecode,
            );
        });
    });

    // signWith deduplication 
    describe("signWith", function () {
        it("with duplicate key does not add the signer twice", function () {
            const flow = new ContractCreateFlow();
            const key = PrivateKey.generateECDSA().publicKey;
            const signer = sinon.stub().resolves(new Uint8Array());

            flow.signWith(key, signer);
            flow.signWith(key, signer);

            // Only one entry should exist despite two calls
            expect(flow._publicKeys).to.have.lengthOf(1);
            expect(flow._transactionSigners).to.have.lengthOf(1);
        });
    });

    // execute without bytecode
    describe("execute", function () {
        it("throws when _bytecode is null", async function () {
            const flow = new ContractCreateFlow();
            const client = makeMockClient();

            let error;
            try {
                await flow.execute(client);
            } catch (e) {
                error = e;
            }

            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal(
                "cannot create contract with no bytecode",
            );
        });
    });

    // Chunking boundary
    describe("chunking", function () {
        it("bytecode <= 2048 bytes skips FileAppendTransaction", async function () {
            const { stubs } = stubTransactions();
            const client = makeMockClient();

            const flow = new ContractCreateFlow();
            flow.setBytecode(new Uint8Array(100).fill(0xab));

            await flow.execute(client);

            expect(stubs.fileCreateExecute.calledOnce).to.be.true;
            expect(stubs.fileAppendExecute.called).to.be.false;
            expect(stubs.contractCreateExecute.calledOnce).to.be.true;
        });

        it("bytecode exactly 2048 bytes skips FileAppendTransaction", async function () {
            const { stubs } = stubTransactions();
            const client = makeMockClient();

            const flow = new ContractCreateFlow();
            flow.setBytecode(new Uint8Array(2048).fill(0xab));

            await flow.execute(client);

            expect(stubs.fileCreateExecute.calledOnce).to.be.true;
            expect(stubs.fileAppendExecute.called).to.be.false;
            expect(stubs.contractCreateExecute.calledOnce).to.be.true;
        });

        it("bytecode > 2048 bytes calls FileAppendTransaction", async function () {
            const { stubs } = stubTransactions();
            const client = makeMockClient();

            const flow = new ContractCreateFlow();
            flow.setBytecode(new Uint8Array(4097).fill(0xab));

            await flow.execute(client);

            expect(stubs.fileCreateExecute.calledOnce).to.be.true;
            expect(stubs.fileAppendExecute.calledOnce).to.be.true;
            expect(stubs.contractCreateExecute.calledOnce).to.be.true;
        });
    });

    // FileDeleteTransaction guard 
    describe("FileDeleteTransaction guard", function () {
        it("calls FileDeleteTransaction when operator key is present", async function () {
            const { stubs } = stubTransactions();
            const client = makeMockClient({ withOperator: true });

            const flow = new ContractCreateFlow();
            flow.setBytecode(new Uint8Array(100).fill(0xab));

            await flow.execute(client);

            expect(stubs.fileDeleteExecute.calledOnce).to.be.true;
        });

        it("skips FileDeleteTransaction when no operator key is present", async function () {
            const { stubs } = stubTransactions();
            const client = makeMockClient({ withOperator: false });

            const flow = new ContractCreateFlow();
            flow.setBytecode(new Uint8Array(100).fill(0xab));

            await flow.execute(client);

            expect(stubs.fileDeleteExecute.called).to.be.false;
        });
    });
});
