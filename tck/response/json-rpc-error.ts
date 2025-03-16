import { JSONRPCErrorCode } from "json-rpc-2.0";

export const JSONRPCErrorCodeCustom = {
    ...JSONRPCErrorCode,
    HederaError: -32001,
};

export type JSONRPCErrorCodeCustom = typeof JSONRPCErrorCodeCustom;
