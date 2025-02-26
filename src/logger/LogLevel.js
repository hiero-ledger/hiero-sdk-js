// SPDX-License-Identifier: Apache-2.0

export default class LogLevel {
    /**
     * @hideconstructor
     * @internal
     * @param {string} name
     */
    constructor(name) {
        /** @readonly */
        this._name = name;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case LogLevel.Silent:
                return "silent";
            case LogLevel.Trace:
                return "trace";
            case LogLevel.Debug:
                return "debug";
            case LogLevel.Info:
                return "info";
            case LogLevel.Warn:
                return "warn";
            case LogLevel.Error:
                return "error";
            case LogLevel.Fatal:
                return "fatal";
            default:
                return `Unknown log level (${this._name})`;
        }
    }

    /**
     * @param {string} level
     * @returns {LogLevel}
     */
    static _fromString(level) {
        switch (level) {
            case "silent":
                return LogLevel.Silent;
            case "trace":
                return LogLevel.Trace;
            case "debug":
                return LogLevel.Debug;
            case "info":
                return LogLevel.Info;
            case "warn":
                return LogLevel.Warn;
            case "error":
                return LogLevel.Error;
            case "fatal":
                return LogLevel.Fatal;
            default:
                throw new Error(`Unknown log level: ${level}`);
        }
    }
}

LogLevel.Silent = new LogLevel("silent");
LogLevel.Trace = new LogLevel("trace");
LogLevel.Debug = new LogLevel("debug");
LogLevel.Info = new LogLevel("info");
LogLevel.Warn = new LogLevel("warn");
LogLevel.Error = new LogLevel("error");
LogLevel.Fatal = new LogLevel("fatal");
