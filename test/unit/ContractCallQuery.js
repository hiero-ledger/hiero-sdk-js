import sinon from "sinon";
import { ContractCallQuery, ContractId } from "../../src/exports.js";
import MirrorNodeContractEstimateQuery from "../../src/query/MirrorNodeContractEstimateQuery.js";

describe("ContractCallQuery", function () {
    const CONTRACT_ID = new ContractId(0, 0, 5133653);
    // The stubbed MirrorNodeContractEstimateQuery.execute never touches it.
    const CLIENT = {};

    afterEach(function () {
        sinon.restore();
    });

    it("estimates gas via the mirror node when gas is not set", async function () {
        const executeStub = sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(25136);

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve");

        await query._estimateGasIfNotSet(CLIENT);

        expect(executeStub.calledOnce).to.be.true;
        // 25136 * 1.2 buffer, rounded up
        expect(query.gas.toNumber()).to.equal(Math.ceil(25136 * 1.2));
    });

    it("does not call the mirror node when gas is already set", async function () {
        const executeStub = sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(25136);

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve")
            .setGas(23474);

        await query._estimateGasIfNotSet(CLIENT);

        expect(executeStub.called).to.be.false;
        expect(query.gas.toNumber()).to.equal(23474);
    });

    it("does not call the mirror node when contract ID is not set", async function () {
        const executeStub = sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(25136);

        const query = new ContractCallQuery().setFunction("retrieve");

        await query._estimateGasIfNotSet(CLIENT);

        expect(executeStub.called).to.be.false;
        expect(query.gas).to.be.null;
    });

    it("forwards contract ID, call data, and sender to the estimate query", async function () {
        let captured;
        sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .callsFake(function () {
                captured = this;
                return Promise.resolve(25136);
            });

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve")
            .setSenderAccountId("0.0.1545");

        await query._estimateGasIfNotSet(CLIENT);

        expect(captured.contractId.toString()).to.equal(CONTRACT_ID.toString());
        expect(captured.callData).to.deep.equal(query.functionParameters);
        expect(captured.sender.toString()).to.equal("0.0.1545");
    });

    it("throws a clear error when mirror node estimation fails", async function () {
        sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .rejects(new Error("HTTP error! status: 404"));

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve");

        let message = "";
        try {
            await query._estimateGasIfNotSet(CLIENT);
        } catch (e) {
            message = e.message;
        }
        expect(message).to.include("setGas()");
        expect(message).to.include("HTTP error! status: 404");
        expect(query.gas).to.be.null;
    });

    it("throws a clear error when the mirror node returns an invalid estimate", async function () {
        sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(NaN);

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve");

        let message = "";
        try {
            await query._estimateGasIfNotSet(CLIENT);
        } catch (e) {
            message = e.message;
        }
        expect(message).to.include("setGas()");
        expect(query.gas).to.be.null;
    });
});
