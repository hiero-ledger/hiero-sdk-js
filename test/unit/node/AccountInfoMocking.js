import {
    Hbar,
    MaxQueryPaymentExceeded,
    AccountInfoQuery,
    AccountId,
    FileCreateTransaction,
    TransactionId,
    TransferTransaction,
    Status,
} from "../../../src/index";
import Mocker, { UNAVAILABLE, INTERNAL, PRIVATE_KEY } from "../Mocker.js";
import Long from "long";
import { proto } from "@hiero-ledger/proto";
import * as hex from "../../../src/encoding/hex.js";

const ACCOUNT_INFO_QUERY_COST_RESPONSE = {
    cryptoGetInfo: {
        header: {
            nodeTransactionPrecheckCode: 0,
            responseType: 2,
            cost: Long.fromNumber(25),
        },
    },
};

const ACCOUNT_INFO_QUERY_RESPONSE = {
    cryptoGetInfo: {
        header: { nodeTransactionPrecheckCode: 0 },
        accountInfo: {
            accountID: {
                shardNum: Long.ZERO,
                realmNum: Long.ZERO,
                accountNum: Long.fromNumber(3),
            },
            key: {
                ed25519: PRIVATE_KEY.publicKey.toBytesRaw(),
            },
            expirationTime: {
                seconds: Long.fromNumber(10),
                nanos: 9,
            },
            alias: null,
        },
    },
};

describe("AccountInfoMocking", function () {
    let client;
    let servers;

    afterEach(function () {
        client.close();
        servers.close();
    });

    it("payment transaction is correctly constructed", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: () => {
                        return ACCOUNT_INFO_QUERY_COST_RESPONSE;
                    },
                },
                {
                    call: (request) => {
                        const transaction = TransferTransaction.fromBytes(
                            proto.Transaction.encode(
                                request.cryptoGetInfo.header.payment,
                            ).finish(),
                        );
                        const hbarTransfers = transaction.hbarTransfers;
                        expect(hbarTransfers.size).to.be.equal(2);
                        expect(
                            hbarTransfers
                                .get(client.operatorAccountId)
                                .toTinybars()
                                .toInt(),
                        ).to.be.lt(0);
                        expect(
                            hbarTransfers
                                .get(Object.values(client.network)[0])
                                .toTinybars()
                                .toInt(),
                        ).to.be.gt(0);
                        return ACCOUNT_INFO_QUERY_RESPONSE;
                    },
                },
            ],
        ]));

        const info = await new AccountInfoQuery()
            .setAccountId("0.0.3")
            .execute(client);

        expect(info.accountId.toString()).to.be.equal("0.0.3");
    });

    it("should retry on UNAVAILABLE", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { error: UNAVAILABLE },
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ],
        ]));

        const info = await new AccountInfoQuery()
            .setAccountId("0.0.3")
            .execute(client);

        expect(info.accountId.toString()).to.be.equal("0.0.3");
    });

    it("should error when cost is greater than max cost set on client", async function () {
        let errorName;

        ({ client, servers } = await Mocker.withResponses([
            [
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ],
        ]));

        client.setDefaultMaxQueryPayment(Hbar.fromTinybars(10));

        try {
            await new AccountInfoQuery().setAccountId("0.0.3").execute(client);
        } catch (error) {
            errorName = error.name;
        }

        expect(errorName).to.be.eql("MaxQueryPaymentExceededError");
    });

    it("setQueryPayemnt() avoids querying actual cost", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [{ response: ACCOUNT_INFO_QUERY_RESPONSE }],
        ]));

        const query = new AccountInfoQuery()
            .setAccountId("0.0.3")
            .setQueryPayment(Hbar.fromTinybars(10));

        await query.execute(client);

        expect(query._queryPayment.toTinybars().toInt()).to.be.equal(10);
    }, 15000);

    it("setQueryPayemnt() + setMaxQueryPayment() avoids querying actual cost", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [{ response: ACCOUNT_INFO_QUERY_RESPONSE }],
        ]));

        const query = new AccountInfoQuery()
            .setAccountId("0.0.3")
            .setMaxQueryPayment(Hbar.fromTinybars(1))
            .setQueryPayment(Hbar.fromTinybars(10));

        await query.execute(client);

        expect(query._queryPayment.toTinybars().toInt()).to.be.equal(10);
    });

    it("actual cost is compared to Client.maxQueryPayment if Query.setMaxQueryPayment is not used", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ],
        ]));

        client.setDefaultMaxQueryPayment(Hbar.fromTinybars(24));

        let err = false;

        const query = new AccountInfoQuery().setAccountId("0.0.3");

        try {
            await query.execute(client);
        } catch (error) {
            err = error instanceof MaxQueryPaymentExceeded;
        }

        expect(err).to.be.true;
    });

    it("actual cost is compared to Query.setMaxQueryPayment when set", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ],
        ]));

        let err = false;

        const query = new AccountInfoQuery()
            .setMaxQueryPayment(Hbar.fromTinybars(24))
            .setAccountId("0.0.3");

        try {
            await query.execute(client);
        } catch (error) {
            err = error instanceof MaxQueryPaymentExceeded;
        }

        expect(err).to.be.true;
    });

    it("should not error when cost is less than max cost set on request", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ],
        ]));

        let err = false;

        try {
            await new AccountInfoQuery()
                .setAccountId("0.0.3")
                .setMaxQueryPayment(Hbar.fromTinybars(28))
                .execute(client);
        } catch (error) {
            err = error instanceof MaxQueryPaymentExceeded;
        }

        expect(err).to.be.false;
    });

    it("should retry on `INTERNAL` and retry multiple nodes", async function () {
        const responses1 = [
            { error: INTERNAL },
            { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
            { error: INTERNAL },
            { error: INTERNAL },
        ];

        const responses2 = [
            { error: INTERNAL },
            { error: INTERNAL },
            { response: ACCOUNT_INFO_QUERY_RESPONSE },
        ];

        ({ client, servers } = await Mocker.withResponses([
            responses1,
            responses2,
        ]));

        const info = await new AccountInfoQuery()
            .setNodeAccountIds([new AccountId(3), new AccountId(4)])
            .setAccountId("0.0.3")
            .execute(client);

        expect(info.accountId.toString()).to.be.equal("0.0.3");
    });

    it("should be able to execute after getting transaction hashes", async function () {
        const responses1 = [{ response: { nodeTransactionPrecheckCode: 0 } }];

        ({ client, servers } = await Mocker.withResponses([responses1]));

        client.setSignOnDemand(true);

        const transaction = await new FileCreateTransaction()
            .setContents("hello 1")
            .freezeWith(client)
            .signWithOperator(client);

        const hash = await transaction.getTransactionHash();
        const response = await transaction.execute(client);

        expect(hash.length).to.be.equal(48);
        expect(hex.encode(hash)).to.be.equal(
            hex.encode(response.transactionHash),
        );
    });

    it("should be able to execute after getting transaction hashes with sign on demand disabled", async function () {
        const responses1 = [{ response: { nodeTransactionPrecheckCode: 0 } }];

        ({ client, servers } = await Mocker.withResponses([responses1]));

        const transaction = await new FileCreateTransaction()
            .setContents("hello 1")
            .freezeWith(client)
            .signWithOperator(client);

        const hash = await transaction.getTransactionHash();
        const response = await transaction.execute(client);

        expect(hash.length).to.be.equal(48);
        expect(hex.encode(hash)).to.be.equal(
            hex.encode(response.transactionHash),
        );
    });

    it("should generate new transaction ID when TRANSACTION_EXPIRED is return", async function () {
        const transactionIds = new Set();
        const callResponses = [
            {
                nodeTransactionPrecheckCode:
                    proto.ResponseCodeEnum.TRANSACTION_EXPIRED,
            },
            { nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK },
        ];

        /**
         * @type {(request: proto.ITransaction, index: number) => proto.ITransactionResponse}
         */
        const call = (request, index) => {
            expect(request.signedTransactionBytes).to.not.be.null;
            const signedTransaction = proto.SignedTransaction.decode(
                request.signedTransactionBytes,
            );

            expect(signedTransaction.bodyBytes).to.not.be.null;
            const transactionBody = proto.TransactionBody.decode(
                signedTransaction.bodyBytes,
            );

            expect(transactionBody.transactionId).to.not.be.null;
            const transactionId = TransactionId._fromProtobuf(
                transactionBody.transactionID,
            ).toString();
            expect(transactionId).to.not.be.equal("");

            expect(transactionIds.has(transactionId)).to.be.false;
            transactionIds.add(transactionId);

            // Verify signatures exist
            expect(Mocker.verifySignatures(signedTransaction)).to.be.true;

            return callResponses[index];
        };

        const responses1 = [{ call }, { call }, { call }];

        ({ client, servers } = await Mocker.withResponses([responses1]));

        client.setSignOnDemand(true);

        await new FileCreateTransaction()
            .setContents("hello 1")
            .execute(client);
    });

    it("should error `TRANSACTION_EXPIRED` is return and client disabled transaction regeneration", async function () {
        const responses1 = [
            {
                response: {
                    nodeTransactionPrecheckCode:
                        proto.ResponseCodeEnum.TRANSACTION_EXPIRED,
                },
            },
        ];

        ({ client, servers } = await Mocker.withResponses([responses1]));

        client.setSignOnDemand(true);

        try {
            await new FileCreateTransaction()
                .setTransactionId(
                    TransactionId.fromString("0.0.1854@1651168054.29348185"),
                )
                .setContents("hello 1")
                .setRegenerateTransactionId(false)
                .execute(client);
        } catch (error) {
            if (
                error.message !==
                "transaction 0.0.1854@1651168054.029348185 failed precheck with status TRANSACTION_EXPIRED against node account id 0.0.3"
            ) {
                throw error;
            }
        }
    });

    it("should still regenerate transaction IDs on `TRANSACTION_EXPIRED` when client disabled it, but transaction re-enabled it", async function () {
        const transactionIds = new Set();
        const callResponses = [
            {
                nodeTransactionPrecheckCode:
                    proto.ResponseCodeEnum.TRANSACTION_EXPIRED,
            },
            { nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK },
        ];

        /**
         * @type {(request: proto.ITransaction, index: number) => proto.ITransactionResponse}
         */
        const call = (request, index) => {
            expect(request.signedTransactionBytes).to.not.be.null;
            const signedTransaction = proto.SignedTransaction.decode(
                request.signedTransactionBytes,
            );

            expect(signedTransaction.bodyBytes).to.not.be.null;
            const transactionBody = proto.TransactionBody.decode(
                signedTransaction.bodyBytes,
            );

            expect(transactionBody.transactionId).to.not.be.null;
            const transactionId = TransactionId._fromProtobuf(
                transactionBody.transactionID,
            ).toString();
            expect(transactionId).to.not.be.equal("");

            expect(transactionIds.has(transactionId)).to.be.false;
            transactionIds.add(transactionId);

            // Verify signatures exist
            expect(Mocker.verifySignatures(signedTransaction)).to.be.true;

            return callResponses[index];
        };

        const responses1 = [{ call }, { call }, { call }];

        ({ client, servers } = await Mocker.withResponses([responses1]));

        client.setSignOnDemand(true);
        client.setDefaultRegenerateTransactionId(false);

        await new FileCreateTransaction()
            .setRegenerateTransactionId(true)
            .setContents("hello 1")
            .execute(client);
    });

    it("should timeout if Client.setRequestTimeout is set", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
            ],
        ]));

        client.setRequestTimeout(1);

        let err = false;

        try {
            await new AccountInfoQuery().setAccountId("0.0.3").execute(client);
        } catch (error) {
            err = error.message == "timeout exceeded";
        }

        if (!err) {
            throw new Error("request didn't timeout");
        }
    });

    it("should timeout if Executable.execute(client, requestTimeout) is set", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
            ],
        ]));

        let err = false;

        try {
            await new AccountInfoQuery()
                .setAccountId("0.0.3")
                .execute(client, 1);
        } catch (error) {
            err = error.message == "timeout exceeded";
        }

        if (!err) {
            throw new Error("request didn't timeout");
        }
    });

    it("should timeout if gRPC deadline is reached", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
            ],
        ]));

        let err = false;

        try {
            await new AccountInfoQuery()
                .setAccountId("0.0.3")
                .setGrpcDeadline(1)
                .execute(client);
        } catch (error) {
            err = error.message.includes("DEADLINE_EXCEEDED");
        }

        if (!err) {
            throw new Error("request didn't timeout");
        }
    });

    it("should timeout immediately", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
            ],
        ]));

        let err = false;

        try {
            await new AccountInfoQuery()
                .setAccountId("0.0.3")
                .execute(client, 1);
        } catch (error) {
            err = error.message === "timeout exceeded";
        }

        expect(err).to.be.true;
    });

    it("should doesn't timeout immediately", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
            ],
        ]));

        let err = false;

        try {
            await new AccountInfoQuery().setAccountId("0.0.3").execute(client);
        } catch (error) {
            err = error.message === "timeout exceeded";
        }

        expect(err).to.be.false;
    });

    it("should throw an error if trying to execute the transaction with node which is not within client`s node list", async function () {
        const responses1 = [{ response: { nodeTransactionPrecheckCode: 0 } }];

        ({ client, servers } = await Mocker.withResponses([responses1]));

        client.setSignOnDemand(true);

        const transaction = new FileCreateTransaction()
            .setContents("hello 1")
            .freezeWith(client);

        // Sets the nodeAccountIds to a different list, but doesn't lock the list
        // this simulates when `freezeWith()` sets the node account IDs to a list
        // without locking it, but this list overwritten when executing.
        transaction._nodeAccountIds.setList([new AccountId(4)]);
        await transaction.signWithOperator(client);

        try {
            await transaction.execute(client);
        } catch (error) {
            // Attempting to execute the transaction with a node that is not in the client's node list
            expect(error.message).to.be.equal(
                "Attempting to execute a transaction against node 0.0.4, which is not included in the Client's node list. Please review your Client configuration.",
            );
        }
    });

    it("should demonstrate UNAVAILABLE behavior with multiple nodes", async function () {
        ({ client, servers } = await Mocker.withResponses([
            // First node (0.0.3)
            [
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
                { error: UNAVAILABLE },
            ],
            // Second node (0.0.4)
            [
                { error: UNAVAILABLE },
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ],
        ]));

        const info = await new AccountInfoQuery()
            .setNodeAccountIds([new AccountId(3), new AccountId(4)])
            .setAccountId("0.0.3")
            .execute(client);

        expect(info.accountId.toString()).to.be.equal("0.0.3");
    });

    describe("Node health checks", function () {
        beforeEach(async function () {
            const responses1 = [
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ];

            const responses2 = [
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ];

            const responses3 = [
                { response: ACCOUNT_INFO_QUERY_COST_RESPONSE },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ];

            ({ client, servers } = await Mocker.withResponses([
                responses1,
                responses2,
                responses3,
            ]));
        });

        it("should throw error because every node is unhealthy", async function () {
            // Make node 3 unhealthy
            client._network._network.get("0.0.3")[0]._readmitTime =
                Date.now() + 100 * 10010;

            // Make node 4 unhealthy
            client._network._network.get("0.0.4")[0]._readmitTime =
                Date.now() + 100 * 10010;

            try {
                await new AccountInfoQuery()
                    .setNodeAccountIds([new AccountId(3), new AccountId(4)])
                    .setAccountId("0.0.3")
                    .execute(client);
                throw new Error("should have thrown");
            } catch (error) {
                expect(error.message).to.equal(
                    "Network connectivity issue: All nodes are unhealthy. Original node list: 0.0.3, 0.0.4",
                );
            }
        });

        it("should skip unhealthy node and execute with healthy node", async function () {
            // Make node 3 unhealthy
            client._network._network.get("0.0.3")[0]._readmitTime =
                Date.now() + 100 * 10010;

            const info = await new AccountInfoQuery()
                .setNodeAccountIds([new AccountId(3), new AccountId(4)])
                .setAccountId("0.0.3")
                .execute(client);

            expect(info.accountId.toString()).to.be.equal("0.0.3");
        });

        it("should execute with last healthy node when multiple nodes are unhealthy", async function () {
            // Make nodes 3 and 5 unhealthy
            client._network._network.get("0.0.3")[0]._readmitTime =
                Date.now() + 100 * 10010;
            client._network._network.get("0.0.5")[0]._readmitTime =
                Date.now() + 100 * 10010;

            const info = await new AccountInfoQuery()
                .setNodeAccountIds([
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                ])
                .execute(client);

            expect(info.accountId.toString()).to.be.equal("0.0.3");
        });
    });

    describe("Node health recovery", function () {
        beforeEach(async function () {
            const responses = [
                { response: { nodeTransactionPrecheckCode: 0 } },
                {
                    response: {
                        transactionGetReceipt: {
                            header: { nodeTransactionPrecheckCode: 0 },
                            receipt: { status: 22 },
                        },
                    },
                },
                { response: ACCOUNT_INFO_QUERY_RESPONSE },
            ];

            ({ client, servers } = await Mocker.withResponses([responses]));
        });

        it("should successfully execute receipt query after node becomes healthy with sufficient timeout", async function () {
            // Create and execute a transaction to get a response
            const transaction = await new FileCreateTransaction()
                .setContents("hello 1")
                .execute(client);

            // Make the node unhealthy
            client._network._network.get(
                transaction.nodeId.toString(),
            )[0]._readmitTime = Date.now() + 100 * 10010;

            // Set up a timeout that makes the node healthy again after a delay
            setTimeout(() => {
                client._network._network.get(
                    transaction.nodeId.toString(),
                )[0]._readmitTime = 0;
            }, 2000);

            // Get the receipt - this should retry and eventually succeed
            // Default timeout should be enough
            const receipt = await transaction.getReceipt(client);

            expect(receipt.status).to.equal(Status.Success);
        });

        it("should fail when node recovery takes longer than the custom retry timeout", async function () {
            // Create and execute a transaction to get a response
            const transaction = await new FileCreateTransaction()
                .setContents("hello 1")
                .execute(client);

            // Make the node unhealthy
            client._network._network.get(
                transaction.nodeId.toString(),
            )[0]._readmitTime = Date.now() + 100 * 10010;

            let error = null;
            try {
                // Set min backoff to 1 to force faster retries so that the test doesn't take too long
                client._minBackoff = 1;

                await transaction.getReceipt(client);
            } catch (err) {
                error = err;
            }

            expect(error).to.not.be.null;
            expect(error.message).to.equal(
                "max attempts of 10 was reached for request with last error being: ",
            );
        });

        it("should succeed when node recovers within the custom retry timeout period", async function () {
            // Create and execute a transaction to get a response
            const transaction = await new FileCreateTransaction()
                .setContents("hello 1")
                .execute(client);

            // Make the node unhealthy
            client._network._network.get(
                transaction.nodeId.toString(),
            )[0]._readmitTime = Date.now() + 100 * 10010;

            // Set up a timeout that makes the node healthy again after a delay
            const randomDelay = Math.floor(Math.random() * 2001) + 1000;
            setTimeout(() => {
                client._network._network.get(
                    transaction.nodeId.toString(),
                )[0]._readmitTime = 0;
            }, randomDelay);

            const receipt = await transaction.getReceipt(client);

            expect(receipt.status).to.equal(Status.Success);
        });
    });
});
