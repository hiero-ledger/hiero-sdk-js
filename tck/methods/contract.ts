import { ContractCreateTransaction, FileId } from "@hashgraph/sdk";

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
    bytecode,
    stakedId,
    gas,
    declineReward,
    memo,
    commonTransactionParams,
}: CreateContractParams): Promise<ContractResponse> => {
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
        transaction.setInitialBalance(Long.fromString(initialBalance));
    }

    if (bytecode != null) {
        const bytecodeBuffer = decode(bytecode);
        transaction.setBytecode(bytecodeBuffer);
    }

    if (stakedId != null) {
        transaction.setStakedAccountId(stakedId);
    }

    if (declineReward != null) {
        transaction.setDeclineStakingReward(declineReward);
    }

    if (memo != null) {
        transaction.setContractMemo(memo);
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
