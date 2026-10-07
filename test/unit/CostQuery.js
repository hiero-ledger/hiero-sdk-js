import { AccountId, AccountInfoQuery } from "../../src/index.js";
import CostQuery from "../../src/query/CostQuery.js";

const CLIENT_SETTINGS = {
    _logger: null,
    requestTimeout: 15000,
    grpcDeadline: 5000,
    maxBackoff: 8000,
    minBackoff: 250,
    maxAttempts: 10,
};

function stubLogger() {
    return { trace() {}, debug() {}, info() {}, warn() {}, error() {} };
}

describe("CostQuery", function () {
    it("copies the parent query's execution settings", function () {
        const logger = stubLogger();
        const query = new AccountInfoQuery()
            .setAccountId("0.0.3")
            .setNodeAccountIds([new AccountId(4)])
            .setMaxAttempts(2)
            .setMinBackoff(100)
            .setMaxBackoff(500)
            .setGrpcDeadline(3000)
            .setLogger(logger);
        query._requestTimeout = 9000;

        const costQuery = new CostQuery(query);

        expect(costQuery.maxAttempts).to.equal(2);
        expect(costQuery.minBackoff).to.equal(100);
        expect(costQuery.maxBackoff).to.equal(500);
        expect(costQuery.logger).to.equal(logger);
        expect(costQuery.grpcDeadline).to.equal(3000);
        expect(costQuery._requestTimeout).to.equal(9000);
        expect(
            costQuery.nodeAccountIds.map((id) => id.toString()),
        ).to.deep.equal(["0.0.4"]);
    });

    it("leaves a setting null when the parent query did not set it", function () {
        const costQuery = new CostQuery(
            new AccountInfoQuery().setAccountId("0.0.3"),
        );

        expect(costQuery.maxAttempts).to.be.null;
        expect(costQuery.minBackoff).to.be.null;
        expect(costQuery.maxBackoff).to.be.null;
        expect(costQuery.logger).to.be.null;
    });

    it("falls through to the client's values when the parent query set none", async function () {
        const logger = stubLogger();
        const costQuery = new CostQuery(
            new AccountInfoQuery().setAccountId("0.0.3"),
        );
        costQuery._beforeExecute = async () => {};

        await costQuery._setupExecution({
            ...CLIENT_SETTINGS,
            _logger: logger,
        });

        expect(costQuery.maxAttempts).to.equal(10);
        expect(costQuery.minBackoff).to.equal(250);
        expect(costQuery.maxBackoff).to.equal(8000);
        expect(costQuery.logger).to.equal(logger);
    });

    it("keeps the parent query's values over the client's", async function () {
        const logger = stubLogger();
        const query = new AccountInfoQuery()
            .setAccountId("0.0.3")
            .setMaxAttempts(2)
            .setMinBackoff(100)
            .setMaxBackoff(500)
            .setLogger(logger);
        const costQuery = new CostQuery(query);
        costQuery._beforeExecute = async () => {};

        await costQuery._setupExecution({
            ...CLIENT_SETTINGS,
            _logger: stubLogger(),
        });

        expect(costQuery.maxAttempts).to.equal(2);
        expect(costQuery.minBackoff).to.equal(100);
        expect(costQuery.maxBackoff).to.equal(500);
        expect(costQuery.logger).to.equal(logger);
    });
});
