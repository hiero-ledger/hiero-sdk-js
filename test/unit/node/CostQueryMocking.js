import { AccountInfoQuery } from "../../../src/index.js";
import Mocker, { UNAVAILABLE } from "../Mocker.js";
import Long from "long";
import { proto } from "@hiero-ledger/proto";

const COST_RESPONSE = {
    cryptoGetInfo: {
        header: {
            nodeTransactionPrecheckCode: 0,
            responseType: proto.ResponseType.COST_ANSWER,
            cost: Long.fromNumber(25),
        },
    },
};

describe("CostQueryMocking", function () {
    let client;
    let servers;

    afterEach(function () {
        client.close();
        servers.close();
    });

    it("stops the cost lookup after the parent query's maxAttempts", async function () {
        let requests = 0;
        const unavailable = () => ({
            call: () => {
                requests += 1;
                return null;
            },
            error: UNAVAILABLE,
        });

        // More failures than the client's default of 10 attempts would consume.
        ({ client, servers } = await Mocker.withResponses([
            Array.from({ length: 12 }, unavailable),
        ]));

        let error = null;
        try {
            await new AccountInfoQuery()
                .setAccountId("0.0.3")
                .setMaxAttempts(2)
                .setMinBackoff(1)
                .setMaxBackoff(10)
                .execute(client);
        } catch (err) {
            error = err;
        }

        expect(error).to.not.be.null;
        expect(error.message).to.include("max attempts of 2 was reached");
        expect(requests).to.equal(2);
    });

    it("logs the cost lookup through the parent query's logger", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [{ response: COST_RESPONSE }],
        ]));

        const messages = [];
        const logger = {
            trace() {},
            debug(message) {
                messages.push(message);
            },
            info() {},
            warn() {},
            error() {},
        };

        const cost = await new AccountInfoQuery()
            .setAccountId("0.0.3")
            .setLogger(logger)
            .getCost(client);

        expect(cost.toTinybars().toInt()).to.equal(28);
        expect(messages.some((message) => message.startsWith("[CostQuery:"))).to
            .be.true;
    });
});
