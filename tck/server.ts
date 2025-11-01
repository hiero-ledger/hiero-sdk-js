import express from "express";
import bodyParser from "body-parser";
import {
    JSONRPCParams,
    JSONRPCRequest,
    JSONRPCServer,
    SimpleJSONRPCMethod,
    createJSONRPCErrorResponse,
} from "json-rpc-2.0";

import * as methods from "./methods";
import mapping from "./mapping";
import { RpcMethodParams } from "./params/sdk";
import { JSONRPCErrorCodeCustom } from "./response/json-rpc-error";

const server = new JSONRPCServer();

// Helper function to register methods
const registerMethods = (
    methodsObject: Record<string, string>,
    prefix = "",
) => {
    Object.entries(methodsObject).forEach(([methodName, method]) => {
        if (methodName === "default" && typeof method === "object") {
            // Recursively register methods inside the `default` property
            registerMethods(method, prefix);
        } else {
            // Register the method with the correct prefix
            const fullMethodName = prefix
                ? `${prefix}.${methodName}`
                : methodName;

            server.addMethod(
                fullMethodName,
                method as unknown as SimpleJSONRPCMethod<void>,
            );
        }
    });
};

// Register all methods, handling possible nested default export
if ("default" in methods) {
    registerMethods(methods.default);
} else {
    registerMethods(methods);
}

// Create mapping server method
server.addMethod(
    "mapping",
    async (
        ...args: [
            params: RpcMethodParams & { sessionId?: string },
            serverParams?: void,
        ]
    ) => {
        // Basic mapping for unimplemented functions
        return await mapping(args[0]);
    },
);

/**
 * Middleware to handle exceptions and customize error responses
 */
const exceptionMiddleware = async (
    next: SimpleJSONRPCMethod,
    request: JSONRPCRequest,
    serverParams: JSONRPCParams,
) => {
    try {
        return await next(request, serverParams);
    } catch (error) {
        const requestMethod = JSON.stringify(request.method);
        const errorMessage = error.message || error;

        if (error.status && error.status._code) {
            console.error(
                `Hedera error occurred processing JSON-RPC request: ${requestMethod}, Error: ${errorMessage}`,
            );

            return createJSONRPCErrorResponse(
                request.id,
                JSONRPCErrorCodeCustom.HederaError,
                "Hedera Error",
                {
                    status: error.status.toString(),
                    message: errorMessage,
                },
            );
        }

        if (error.code === JSONRPCErrorCodeCustom.HederaError) {
            console.error(
                `Params error occurred processing JSON-RPC request: ${requestMethod} \nError: ${errorMessage}`,
            );

            return createJSONRPCErrorResponse(
                request.id,
                JSONRPCErrorCodeCustom.InvalidParams,
                "Invalid params error",
                {
                    message: errorMessage,
                },
            );
        }

        console.error(
            `Internal error occurred processing JSON-RPC request: ${requestMethod} \nError: ${errorMessage}`,
        );

        return createJSONRPCErrorResponse(
            request.id,
            JSONRPCErrorCodeCustom.InternalError,
            "Internal error",
            {
                message: errorMessage,
            },
        );
    }
};

// Apply middleware to handle exceptions
server.applyMiddleware(exceptionMiddleware);

// Set up the Express server
const app = express();
app.use(bodyParser.json());

app.post("/", (req, res) => {
    const jsonRPCRequest = req.body;
    server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
        if (jsonRPCResponse) {
            res.json(jsonRPCResponse);
        } else {
            res.sendStatus(204);
        }
    });
});

let port = 8544; // Default port
const args = process.argv.slice(2);
if (args.length > 0) {
    try {
        port = parseInt(args[0]);
    } catch (err) {
        console.warn("Port args error! Defaulting to port 8544");
    }
}

app.listen(port, () => {
    console.log(`-- JSON-RPC JS server running on localhost port ${port}`);

    // Print statistics every 30 seconds for debugging
    // Only for testing purposes
    setInterval(() => {
        const { sdk } = require("./sdk_data");
        if (sdk.getActiveSessionCount() > 0) {
            sdk.printStatistics();
        }
    }, 30000);
});
