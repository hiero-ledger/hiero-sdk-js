import { JSONRPCErrorCode } from "json-rpc-2.0";

import { CustomError } from "./custom-error";

export const invalidParamError = <T>(message: string): T => {
    throw new CustomError(
        `invalid parameters: ${message}`,
        JSONRPCErrorCode.InvalidParams,
    );
};
