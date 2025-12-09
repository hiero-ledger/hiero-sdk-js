import { ContractFunctionResult } from "@hiero-ledger/sdk";
import { ContractCallQueryResponse } from "../../response/contract";

/**
 * Safely gets a string value from a getter function, returning undefined on error.
 */
export const safeGetString = (getter: () => string): string | undefined => {
    try {
        return getter();
    } catch {
        return undefined;
    }
};

/**
 * Safely gets a boolean value from a getter function, returning undefined on error.
 */
export const safeGetBool = (getter: () => boolean): boolean | undefined => {
    try {
        return getter();
    } catch {
        return undefined;
    }
};

/**
 * Safely gets a number value from a getter function, converting it to a string.
 * Returns undefined on error.
 */
export const safeGetNumber = (getter: () => number): string | undefined => {
    try {
        return getter().toString();
    } catch {
        return undefined;
    }
};

/**
 * Safely gets a big number value from a getter function, converting it to a string.
 * Returns undefined on error.
 */
export const safeGetBigNumber = (getter: () => any): string | undefined => {
    try {
        const value = getter();
        return value.toString();
    } catch {
        return undefined;
    }
};

/**
 * Builds a ContractCallQueryResponse from a ContractFunctionResult.
 * Extracts all possible return value types from the result.
 */
export const buildContractCallQueryResponse = (
    result: ContractFunctionResult,
): ContractCallQueryResponse => {
    return {
        bytes: result.bytes
            ? "0x" + Buffer.from(result.bytes).toString("hex")
            : undefined,
        contractId: result.contractId?.toString(),
        gasUsed: result.gasUsed?.toString(),
        errorMessage: result.errorMessage || undefined,
        // Try to extract common return value types
        string: safeGetString(() => result.getString(0)),
        bool: safeGetBool(() => result.getBool(0)),
        address: safeGetString(() => {
            const addr = result.getAddress(0);
            return addr ? "0x" + addr : addr;
        }),
        bytes32:
            result.bytes.length >= 32
                ? "0x" + Buffer.from(result.getBytes32(0)).toString("hex")
                : undefined,
        // Integer types
        int8: safeGetNumber(() => result.getInt8(0)),
        uint8: safeGetNumber(() => result.getUint8(0)),
        int16: safeGetNumber(() => result.getInt16(0)),
        uint16: safeGetNumber(() => result.getUint16(0)),
        int24: safeGetBigNumber(() => result.getInt24(0)),
        uint24: safeGetBigNumber(() => result.getUint24(0)),
        int32: safeGetNumber(() => result.getInt32(0)),
        uint32: safeGetNumber(() => result.getUint32(0)),
        int40: safeGetBigNumber(() => result.getInt40(0)),
        uint40: safeGetBigNumber(() => result.getUint40(0)),
        int48: safeGetBigNumber(() => result.getInt48(0)),
        uint48: safeGetBigNumber(() => result.getUint48(0)),
        int56: safeGetBigNumber(() => result.getInt56(0)),
        uint56: safeGetBigNumber(() => result.getUint56(0)),
        int64: safeGetBigNumber(() => result.getInt64(0)),
        uint64: safeGetBigNumber(() => result.getUint64(0)),
        int256: safeGetBigNumber(() => result.getInt256(0)),
        uint256: safeGetBigNumber(() => result.getUint256(0)),
    };
};
