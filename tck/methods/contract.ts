import {
    ContractCreateTransaction,
    ContractDeleteTransaction,
    ContractExecuteTransaction,
    ContractUpdateTransaction,
    ContractCallQuery,
    Hbar,
    Timestamp,
} from "@hiero-ledger/sdk";

import {
    CreateContractParams,
    DeleteContractParams,
    ExecuteContractParams,
    UpdateContractParams,
    ContractCallQueryParams,
} from "../params/contract";
import {
    ContractResponse,
    ContractCallQueryResponse,
} from "../response/contract";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import { sdk } from "../sdk_data";
import { getKeyFromString } from "../utils/key";
import Long from "long";
import { decode } from "../utils/hex";

export const createContract = async ({
    adminKey,
    autoRenewPeriod,
    autoRenewAccountId,
    initialBalance,
    bytecodeFileId,
    initcode,
    stakedAccountId,
    stakedNodeId,
    gas,
    declineStakingReward,
    memo,
    maxAutomaticTokenAssociations,
    constructorParameters,
    commonTransactionParams,
    sessionId,
}: CreateContractParams): Promise<ContractResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new ContractCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (gas != null) {
        transaction.setGas(Long.fromString(gas));
    }

    if (autoRenewAccountId != null) {
        transaction.setAutoRenewAccountId(autoRenewAccountId);
    }

    if (initialBalance != null) {
        transaction.setInitialBalance(Hbar.fromTinybars(initialBalance));
    }

    if (initcode != null) {
        const initCodeBuffer = decode(initcode);
        transaction.setBytecode(initCodeBuffer);
    }

    if (bytecodeFileId != null) {
        transaction.setBytecodeFileId(bytecodeFileId);
    }

    if (stakedAccountId != null) {
        transaction.setStakedAccountId(stakedAccountId);
    }

    if (stakedNodeId != null) {
        transaction.setStakedNodeId(Long.fromString(stakedNodeId));
    }

    if (declineStakingReward != null) {
        transaction.setDeclineStakingReward(declineStakingReward);
    }

    if (memo != null) {
        transaction.setContractMemo(memo);
    }

    if (maxAutomaticTokenAssociations != null) {
        transaction.setMaxAutomaticTokenAssociations(
            maxAutomaticTokenAssociations,
        );
    }

    if (constructorParameters != null) {
        const constructorParams = decode(constructorParameters);
        transaction.setConstructorParameters(constructorParams);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        contractId: receipt.contractId?.toString(),
        status: receipt.status.toString(),
    };
};

export const updateContract = async ({
    contractId,
    adminKey,
    autoRenewPeriod,
    autoRenewAccountId,
    stakedAccountId,
    stakedNodeId,
    declineStakingReward,
    memo,
    maxAutomaticTokenAssociations,
    expirationTime,
    commonTransactionParams,
    sessionId,
}: UpdateContractParams): Promise<ContractResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new ContractUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (contractId != null) {
        transaction.setContractId(contractId);
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (autoRenewAccountId != null) {
        transaction.setAutoRenewAccountId(autoRenewAccountId);
    }

    if (stakedAccountId != null) {
        transaction.setStakedAccountId(stakedAccountId);
    }

    if (stakedNodeId != null) {
        transaction.setStakedNodeId(Long.fromString(stakedNodeId));
    }

    if (declineStakingReward != null) {
        transaction.setDeclineStakingReward(declineStakingReward);
    }

    if (memo != null) {
        transaction.setContractMemo(memo);
    }

    if (maxAutomaticTokenAssociations != null) {
        transaction.setMaxAutomaticTokenAssociations(
            maxAutomaticTokenAssociations,
        );
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(
            new Timestamp(Long.fromString(expirationTime), 0),
        );
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const deleteContract = async ({
    contractId,
    transferAccountId,
    transferContractId,
    permanentRemoval,
    commonTransactionParams,
    sessionId,
}: DeleteContractParams): Promise<ContractResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new ContractDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (contractId != null) {
        transaction.setContractId(contractId);
    }

    //depend on how I order transferContractId and transferAccountId the last will stay if both are called
    if (transferContractId != null) {
        transaction.setTransferContractId(transferContractId);
    }

    if (transferAccountId != null) {
        transaction.setTransferAccountId(transferAccountId);
    }

    if (permanentRemoval != null) {
        transaction.setPermanentRemoval(permanentRemoval);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const executeContract = async ({
    contractId,
    gas,
    amount,
    functionParameters,
    commonTransactionParams,
    sessionId,
}: ExecuteContractParams): Promise<ContractResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new ContractExecuteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (contractId != null) {
        transaction.setContractId(contractId);
    }

    if (gas != null) {
        transaction.setGas(Long.fromString(gas));
    }

    if (amount != null) {
        transaction.setPayableAmount(Hbar.fromTinybars(amount));
    }

    if (functionParameters != null) {
        const functionParams = decode(functionParameters);
        transaction.setFunctionParameters(functionParams);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const contractCallQuery = async ({
    contractId,
    gas,
    functionName,
    functionParameters,
    maxQueryPayment,
    senderAccountId,
    sessionId,
}: ContractCallQueryParams): Promise<ContractCallQueryResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new ContractCallQuery().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (contractId != null) {
        query.setContractId(contractId);
    }

    if (gas != null) {
        query.setGas(Long.fromString(gas));
    }

    if (functionParameters != null) {
        const functionParams = decode(functionParameters);
        query.setFunctionParameters(functionParams);
    } else if (functionName != null) {
        query.setFunction(functionName);
    }

    if (maxQueryPayment != null) {
        query.setMaxQueryPayment(Hbar.fromTinybars(maxQueryPayment));
    }

    if (senderAccountId != null) {
        query.setSenderAccountId(senderAccountId);
    }

    const result = await query.execute(client);

    // Helper function to safely get values from result
    const safeGetString = (getter: () => string) => {
        try {
            return getter();
        } catch {
            return undefined;
        }
    };

    const safeGetBool = (getter: () => boolean) => {
        try {
            return getter();
        } catch {
            return undefined;
        }
    };

    const safeGetNumber = (getter: () => number) => {
        try {
            return getter().toString();
        } catch {
            return undefined;
        }
    };

    const safeGetBigNumber = (getter: () => any) => {
        try {
            const value = getter();
            return value.toString();
        } catch {
            return undefined;
        }
    };

    // Build response with all possible return types
    const response: ContractCallQueryResponse = {
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

    return response;
};
