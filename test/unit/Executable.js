/* global globalThis */

import { vi } from "vitest";
import Executable, { RST_STREAM } from "../../src/Executable.js";
import AccountId from "../../src/account/AccountId.js";
import GrpcServiceError from "../../src/grpc/GrpcServiceError.js";
import GrpcStatus from "../../src/grpc/GrpcStatus.js";

describe("Executable", function () {
    it("RST_STREAM regex matches actual response returned", function () {
        expect(
            RST_STREAM.test(
                "Error: 13 INTERNAL: Received RST_STREAM with code 0",
            ),
        ).to.be.true;
    });

    it("_validateTransactionNodeIds throws when transaction nodes are not in the client node list", function () {
        const executable = new Executable();

        executable._nodeAccountIds.setList([
            new AccountId(3),
            new AccountId(4),
        ]);
        executable.transactionNodeIds = ["0.0.111"];

        expect(() => executable._validateTransactionNodeIds()).to.throw(
            "Attempting to execute a transaction against nodes 0.0.3, 0.0.4, which are not included in the Client's node list. Please review your Client configuration.",
        );
    });

    it("_setupExecution initializes execution settings from the client", async function () {
        const executable = new Executable();
        const logger = { trace() {}, debug() {}, warn() {} };
        let beforeExecuteCalled = false;

        executable._beforeExecute = async () => {
            beforeExecuteCalled = true;
        };

        await executable._setupExecution(
            {
                _logger: logger,
                requestTimeout: 15000,
                grpcDeadline: 5000,
                maxBackoff: 8000,
                minBackoff: 250,
                maxAttempts: 10,
            },
            12000,
        );

        expect(executable.logger).to.equal(logger);
        expect(executable._requestTimeout).to.equal(12000);
        expect(executable.grpcDeadline).to.equal(5000);
        expect(executable.maxBackoff).to.equal(8000);
        expect(executable.minBackoff).to.equal(250);
        expect(executable.maxAttempts).to.equal(10);
        expect(beforeExecuteCalled).to.be.true;
    });

    it("execute throws timeout exceeded with the current node account ID", async function () {
        const executable = new Executable();
        let nowCallCount = 0;
        const dateNowSpy = vi
            .spyOn(Date, "now")
            .mockImplementation(() => (nowCallCount++ === 0 ? 1000 : 1002));

        executable._requestTimeout = 1;
        executable._nodeAccountIds.setList([new AccountId(3)]);
        executable._beforeExecute = async () => {};

        try {
            await executable.execute({
                _logger: null,
                requestTimeout: 15000,
                grpcDeadline: 5000,
                maxBackoff: 8000,
                minBackoff: 250,
                maxAttempts: 10,
                isLocalNetwork: false,
            });
            expect.fail("Expected timeout error");
        } catch (error) {
            expect(error.message).to.equal("timeout exceeded");
            expect(error.nodeAccountId).to.equal("0.0.3");
        } finally {
            dateNowSpy.mockRestore();
        }
    });

    it("_getExecutionNode returns the network node and seeds nodeAccountIds when empty", function () {
        const executable = new Executable();
        const currentNode = { accountId: new AccountId(3) };

        const result = executable._getExecutionNode({
            _network: {
                getNode() {
                    return currentNode;
                },
            },
        });

        expect(result).to.equal(currentNode);
        expect(executable._nodeAccountIds.current.toString()).to.equal("0.0.3");
    });

    it("_getExecutionNode returns the resolved network node when nodeAccountIds are already set", function () {
        const executable = new Executable();
        const currentNode = { accountId: new AccountId(3) };

        executable._nodeAccountIds.setList([new AccountId(111)]);

        const result = executable._getExecutionNode({
            _network: {
                getNode() {
                    return currentNode;
                },
            },
        });

        expect(result).to.equal(currentNode);
        expect(executable._nodeAccountIds.current.toString()).to.equal(
            "0.0.111",
        );
    });

    it("_shouldSkipAttemptForNodeAccountId returns true when the node is not in transactionNodeIds", function () {
        const executable = new Executable();

        executable._nodeAccountIds.setList([
            new AccountId(3),
            new AccountId(4),
        ]);
        executable.transactionNodeIds = ["0.0.111"];

        const originalError = console.error;
        console.error = () => {};

        try {
            const shouldSkip = executable._shouldSkipAttemptForNodeAccountId(
                new AccountId(3),
            );

            expect(shouldSkip).to.be.true;
            expect(executable._nodeAccountIds.current.toString()).to.equal(
                "0.0.3",
            );
        } finally {
            console.error = originalError;
        }
    });

    it("_handleUnhealthyNode advances to the next node when failover is possible", async function () {
        const executable = new Executable();
        const debug = vi.fn();

        executable._nodeAccountIds.setList([
            new AccountId(3),
            new AccountId(4),
        ]);
        executable._logger = { debug };
        executable._getLogId = () => "debug.log";

        await executable._handleUnhealthyNode(
            { isHealthy: () => false },
            {},
            1,
            false,
        );

        expect(executable._nodeAccountIds.current.toString()).to.equal("0.0.4");
        expect(debug).toHaveBeenCalledWith(
            "[debug.log] Node is not healthy, trying the next node.",
        );
    });

    it("_handleInvalidNodeAccountId marks the node unusable and warns when no mirror network is configured", async function () {
        const executable = new Executable();
        const debug = vi.fn();
        const increaseBackoff = vi.fn();
        const warn = vi.fn();
        const trace = vi.fn();
        const updateNetwork = vi.fn();
        const currentNode = {
            address: { toString: () => "127.0.0.1:50211" },
        };

        executable._logger = { debug, warn, trace };
        executable._getLogId = () => "logger.id";

        await executable._handleInvalidNodeAccountId(
            {
                _network: { increaseBackoff },
                mirrorNetwork: [],
                updateNetwork,
            },
            currentNode,
            new AccountId(3),
        );

        expect(increaseBackoff).toHaveBeenCalledWith(currentNode);
        expect(updateNetwork).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(
            "[logger.id] Cannot update address book: no mirror network configured. Retrying with existing network configuration.",
        );
    });

    it("_shouldRetryRequestError is driven by retryable error type and attempt count", function () {
        const executable = new Executable();
        const error = new GrpcServiceError(GrpcStatus.Unavailable);

        executable._maxAttempts = 3;

        expect(executable._shouldRetryRequestError(error, 1)).to.be.true;
        expect(executable._shouldRetryRequestError(error, 4)).to.be.false;
        expect(executable._shouldRetryRequestError(new Error("nope"), 1)).to.be
            .false;
    });

    it("_executeRequestWithGrpcDeadline returns the execution response and clears the deadline timer", async function () {
        const executable = new Executable();
        const trace = vi.fn();
        const response = { ok: true };
        const deadlineTimer = { id: "deadline" };
        const setTimeoutSpy = vi
            .spyOn(globalThis, "setTimeout")
            .mockImplementation(() => deadlineTimer);
        const clearTimeoutSpy = vi
            .spyOn(globalThis, "clearTimeout")
            .mockImplementation(() => {});

        executable._logger = {
            trace,
            debug() {},
            info() {},
            warn() {},
            error() {},
            fatal() {},
        };
        executable._grpcDeadline = 1000;
        executable._getLogId = () => "trace.log";
        executable._requestToBytes = () => new Uint8Array([1, 2, 3]);
        executable._execute = vi.fn().mockResolvedValue(response);

        try {
            const result = await executable._executeRequestWithGrpcDeadline(
                {},
                { request: true },
            );

            expect(result).to.equal(response);
            expect(trace).toHaveBeenCalledWith(
                "[trace.log] sending protobuf 010203",
            );
            expect(setTimeoutSpy).toHaveBeenCalledOnce();
            expect(clearTimeoutSpy).toHaveBeenCalledWith(deadlineTimer);
        } finally {
            setTimeoutSpy.mockRestore();
            clearTimeoutSpy.mockRestore();
        }
    });
});
