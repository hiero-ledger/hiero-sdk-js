import { AccountId } from "../../../src/index.js";
import Mocker, { UNAVAILABLE } from "../Mocker.js";
import Long from "long";
import { proto } from "@hiero-ledger/proto";

const PING_COST_RESPONSE = {
    cryptoGetInfo: {
        header: {
            nodeTransactionPrecheckCode: 0,
            responseType: proto.ResponseType.COST_ANSWER,
            cost: Long.fromNumber(25),
        },
    },
};

describe("ClientPingMocking", function () {
    let client;
    let servers;

    afterEach(function () {
        client.close();
        servers.close();
    });

    it("ping sends getAccountInfo for account 0.0.2 with COST_ANSWER", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        expect(request.cryptogetAccountBalance == null).to.be
                            .true;

                        const query = request.cryptoGetInfo;
                        expect(query.header.responseType).to.equal(
                            proto.ResponseType.COST_ANSWER,
                        );
                        expect(
                            AccountId._fromProtobuf(query.accountID).toString(),
                        ).to.equal("0.0.2");

                        return PING_COST_RESPONSE;
                    },
                },
            ],
        ]));

        await client.ping("0.0.3");
    });

    it("pingAll probes every node with the COST_ANSWER query", async function () {
        const probed = [];
        const makeResponse = () => ({
            call: (request) => {
                expect(request.cryptogetAccountBalance == null).to.be.true;
                probed.push(request.cryptoGetInfo.header.responseType);
                return PING_COST_RESPONSE;
            },
        });

        ({ client, servers } = await Mocker.withResponses([
            [makeResponse()],
            [makeResponse()],
        ]));

        await client.pingAll();

        expect(probed).to.deep.equal([
            proto.ResponseType.COST_ANSWER,
            proto.ResponseType.COST_ANSWER,
        ]);
    });

    it("ping succeeds without an operator, attaching an unsigned payment", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        const header = request.cryptoGetInfo.header;
                        expect(header.responseType).to.equal(
                            proto.ResponseType.COST_ANSWER,
                        );

                        expect(header.payment).to.not.be.null;
                        const signedTransaction =
                            proto.SignedTransaction.decode(
                                header.payment.signedTransactionBytes,
                            );
                        expect(signedTransaction.bodyBytes.length).to.be.gt(0);
                        expect(
                            signedTransaction.sigMap == null ||
                                (signedTransaction.sigMap.sigPair ?? [])
                                    .length === 0,
                        ).to.be.true;

                        return PING_COST_RESPONSE;
                    },
                },
            ],
        ]));

        client._operator = null;

        await client.ping(new AccountId(3));
    });

    it("ping rejects when the node fails at the gRPC layer", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [{ error: UNAVAILABLE }],
        ]));

        client.setMaxAttempts(1);

        let error = null;
        try {
            await client.ping("0.0.3");
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");
        expect(error.message).to.include("max attempts of 1 was reached");
    });
});
