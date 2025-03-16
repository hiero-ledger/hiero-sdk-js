import { Logger, LogLevel, Transaction } from "../../src/exports.js";
import { Client } from "../../src/index.js";
import { tmpdir } from "node:os";
import fs from "fs";
import { spy } from "sinon";

describe("Logger", function () {
    it("set and get log level correctly inside the `Client` object", async function () {
        const client = Client.forPreviewnet({
            scheduleNetworkUpdate: false,
        });

        //during initialization of the `Client`, there is no logger set
        expect(client.logger).to.be.null;

        //set logger with info level of logging to the `Client`
        let infoLogger = new Logger(LogLevel.Info);
        client.setLogger(infoLogger);

        //check if the log level is in fact `info`
        expect(client.logger.level).to.be.equal(LogLevel.Info);

        //change the level of the logger to `warn` and check
        //if it is the same when extracted from the `Client`
        infoLogger.setLevel(LogLevel.Warn);
        expect(client.logger.level).to.be.equal(LogLevel.Warn);

        //silence the logger and check if it changed inside the `Client`
        infoLogger.setSilent(true);
        expect(client.logger.level).to.be.equal(LogLevel.Silent);
    });

    it("set and get log level correctly inside the `Transaction` object", async function () {
        const transaction = new Transaction();

        //during initialization of the `Transaction`, there is no logger set
        expect(transaction.logger).to.be.null;

        //set logger with info level of logging to the `Transaction`
        let infoLogger = new Logger(LogLevel.Info);
        transaction.setLogger(infoLogger);

        //check if the log level is in fact `info`
        expect(transaction.logger.level).to.be.equal(LogLevel.Info);

        //change the level of the logger to `warn` and check
        //if it is the same when extracted from the `Transaction`
        infoLogger.setLevel(LogLevel.Warn);
        expect(transaction.logger.level).to.be.equal(LogLevel.Warn);

        //silence the logger and check if it changed inside the `Transaction`
        infoLogger.setSilent(true);
        expect(transaction.logger.level).to.be.equal(LogLevel.Silent);
    });

    it("check the possible log levels on the logger", async function () {
        const transaction = new Transaction();
        //during initialization of the `Transaction`, there is no logger set
        expect(transaction.logger).to.be.null;

        //set logger with info level of logging to the `Transaction`
        const infoLogger = new Logger(LogLevel.Info);
        const levels = Object.values(infoLogger.levels);

        expect(levels).to.include("trace");
        expect(levels).to.include("debug");
        expect(levels).to.include("info");
        expect(levels).to.include("warn");
        expect(levels).to.include("error");
        expect(levels).to.include("fatal");
    });

    it("check that it can write to a log file", function () {
        const logFile = `${tmpdir()}/test.log`;
        fs.rmSync(logFile, { force: true });
        const logger = new Logger(LogLevel.Trace, logFile);
        let assertionCount = 0;
        for (const level of Object.values(LogLevel)) {
            if (level === LogLevel.Silent) continue;
            logger[level](`This is a test ${level} message`);

            const logContent = fs.readFileSync(logFile, "utf8");
            expect(logContent).to.contain(`This is a test ${level} message`);
            expect(logContent).to.contain(
                level.toString().toUpperCase(),
                `should contain ${level.toString().toUpperCase()}`,
            );
            assertionCount += 2;
        }
        expect(assertionCount).to.be.equal(
            12,
            "should have made 12 assertions",
        );
    });

    it("check that it can write to stdout", function () {
        let assertionCount = 0;
        const logger = new Logger(LogLevel.Trace);
        for (const level of Object.values(LogLevel)) {
            if (level === LogLevel.Silent) continue;
            const loggerLogSpy = spy(logger._logger, level);
            logger[level](`This is a test ${level} message`);
            expect(loggerLogSpy.calledWith(`This is a test ${level} message`))
                .to.be.true;
            assertionCount++;
        }
        expect(assertionCount).to.be.equal(6, "should have made 6 assertions");
    });

    it("check that silent blocks output", function () {
        const logFile = `${tmpdir()}/test2.log`;
        fs.rmSync(logFile, { force: true });
        const logger = new Logger(LogLevel.Trace, logFile);
        expect(logger.silent).to.be.equal(false);
        logger.warn("This is a test warn message");
        logger.setSilent(true);
        expect(logger.silent).to.be.equal(true);
        logger.fatal("This is a test fatal message");
        logger.setSilent(false);
        logger.error("This is a test error message");
        const logContent = fs.readFileSync(logFile, "utf8");
        expect(logger.silent).to.be.equal(false);
        expect(logContent).to.contain("This is a test warn message");
        expect(logContent).to.contain("This is a test error message");
        expect(logContent).to.not.contain("This is a test fatal message");
    });
});
