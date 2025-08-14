import { ContractCreateTransaction, FileId, Hbar } from "@hashgraph/sdk";

import { CreateContractParams } from "../params/contract";
import { ContractResponse } from "../response/contract";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import { sdk } from "../sdk_data";
import { getKeyFromString } from "../utils/key";
import Long from "long";
import { decode } from "../../src/encoding/hex.js";

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
}: CreateContractParams): Promise<ContractResponse> => {
    const transaction = new ContractCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (adminKey != null) {
        console.log("adminKey", adminKey);
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
            sdk.getClient(),
        );
    }

    const response = await transaction.execute(sdk.getClient());
    const receipt = await response.getReceipt(sdk.getClient());

    return {
        contractId: receipt.contractId?.toString(),
        status: receipt.status.toString(),
    };
};
