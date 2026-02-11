import {
    AccountId,
    Client,
    CustomFee,
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
    FeeAssessmentMethod,
    Transaction,
    TokenInfo,
    TokenNftInfo,
} from "@hiero-ledger/sdk";
import Long from "long";

import { DEFAULT_GRPC_DEADLINE } from "../../utils/constants/config";

import { applyCommonTransactionParams } from "../../params/common-tx-params";
import {
    TokenInfoQueryResponse,
    TokenNftInfoQueryResponse,
} from "../../response/token";

export const executeTokenManagementTransaction = async (
    transaction: Transaction,
    client: Client,
) => {
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return { status: receipt.status.toString() };
};

export const configureTokenManagementTransaction = (
    transaction: any,
    params: any,
    client: Client,
) => {
    if (params.tokenId != null) {
        transaction.setTokenId(params.tokenId);
    }

    if (params.accountId != null && transaction.setAccountId) {
        transaction.setAccountId(AccountId.fromString(params.accountId));
    }

    if (params.tokenIds != null) {
        transaction.setTokenIds(params.tokenIds);
    }

    if (params.amount != null) {
        transaction.setAmount(Long.fromString(params.amount));
    }

    if (params.metadata != null) {
        const allMetadata = params.metadata.map((metadataValue: string) =>
            Buffer.from(metadataValue, "hex"),
        );
        transaction.setMetadata(allMetadata);
    }

    if (params.serialNumbers != null) {
        const allSerialNumbers = params.serialNumbers.map(
            (serialNumber: string) => Long.fromString(serialNumber),
        );
        transaction.setSerials(allSerialNumbers);
    }

    if (params.commonTransactionParams != null) {
        applyCommonTransactionParams(
            params.commonTransactionParams,
            transaction,
            client,
        );
    }

    transaction.setGrpcDeadline(DEFAULT_GRPC_DEADLINE);
};

// Helper function to handle custom fees
export const createCustomFees = (customFees: Array<Record<string, any>>) => {
    let customFeeList: Array<CustomFee> = [];

    customFees.forEach((customFee) => {
        // Set fixed fees
        if (customFee.fixedFee) {
            let fixedFee = new CustomFixedFee()
                .setAmount(Long.fromString(customFee.fixedFee.amount))
                .setFeeCollectorAccountId(
                    AccountId.fromString(customFee.feeCollectorAccountId),
                )
                .setAllCollectorsAreExempt(customFee.feeCollectorsExempt)
                .setDenominatingTokenId(customFee.fixedFee.denominatingTokenId);

            customFeeList.push(fixedFee);
        }

        // Set fractional fees
        if (customFee.fractionalFee) {
            let fractionalFee = new CustomFractionalFee()
                .setNumerator(
                    Long.fromString(customFee.fractionalFee.numerator),
                )
                .setDenominator(
                    Long.fromString(customFee.fractionalFee.denominator),
                )
                .setMin(Long.fromString(customFee.fractionalFee.minimumAmount))
                .setMax(Long.fromString(customFee.fractionalFee.maximumAmount))
                .setFeeCollectorAccountId(
                    AccountId.fromString(customFee.feeCollectorAccountId),
                )
                .setAllCollectorsAreExempt(customFee.feeCollectorsExempt)
                .setAssessmentMethod(
                    customFee.fractionalFee.assessmentMethod === "inclusive"
                        ? FeeAssessmentMethod.Inclusive
                        : FeeAssessmentMethod.Exclusive,
                );

            customFeeList.push(fractionalFee);
        }

        // Set royalty fees
        if (customFee.royaltyFee) {
            let royaltyFee = new CustomRoyaltyFee()
                .setNumerator(Long.fromString(customFee.royaltyFee.numerator))
                .setDenominator(
                    Long.fromString(customFee.royaltyFee.denominator),
                )
                .setFeeCollectorAccountId(
                    AccountId.fromString(customFee.feeCollectorAccountId),
                )
                .setAllCollectorsAreExempt(customFee.feeCollectorsExempt);

            if (customFee.royaltyFee.fallbackFee) {
                let fallbackFee = new CustomFixedFee()
                    .setAmount(
                        Long.fromString(
                            customFee.royaltyFee.fallbackFee.amount,
                        ),
                    )
                    .setDenominatingTokenId(
                        customFee.royaltyFee.fallbackFee.denominatingTokenId,
                    );

                royaltyFee.setFallbackFee(fallbackFee);
            }

            customFeeList.push(royaltyFee);
        }
    });

    return customFeeList;
};

// Helper function to map TokenInfo to TokenInfoQueryResponse
export const mapTokenInfoResponse = (
    info: TokenInfo,
): TokenInfoQueryResponse => {
    // Helper function to convert pause status
    const getPauseStatusString = (pauseStatus: boolean | null): string => {
        if (pauseStatus === null) {
            return null;
        }
        return pauseStatus ? "true" : "false";
    };
    // Helper to format AccountId as { realm, shard, num }
    const formatAccountId = (
        accountId: AccountId | null | undefined,
    ): { realm: string; shard: string; num: string } | null => {
        if (!accountId) {
            return null;
        }
        return {
            realm: accountId.realm.toString(),
            shard: accountId.shard.toString(),
            num: accountId.num.toString(),
        };
    };

    // Helper function to serialize custom fees
    const serializeCustomFees = (customFees: CustomFee[]): any[] => {
        return customFees.map((fee) => {
            if (fee instanceof CustomFixedFee) {
                return {
                    feeCollectorAccountId:
                        formatAccountId(fee.feeCollectorAccountId),
                    allCollectorsAreExempt: fee.allCollectorsAreExempt,
                    fixedFee: {
                        amount: fee.amount?.toString(),
                        denominatingTokenId:
                            fee.denominatingTokenId?.toString() || null,
                    },
                };
            } else if (fee instanceof CustomFractionalFee) {
                return {
                    feeCollectorAccountId:
                        formatAccountId(fee.feeCollectorAccountId),
                    allCollectorsAreExempt: fee.allCollectorsAreExempt,
                    fractionalFee: {
                        numerator: fee.numerator.toString(),
                        denominator: fee.denominator.toString(),
                        minimumAmount: fee.min?.toString() || "0",
                        maximumAmount: fee.max?.toString() || "0",
                        assessmentMethod:
                            fee.assessmentMethod?.toString().toLowerCase() ||
                            "inclusive",
                    },
                };
            } else if (fee instanceof CustomRoyaltyFee) {
                const result: any = {
                    feeCollectorAccountId:
                        formatAccountId(fee.feeCollectorAccountId),
                    allCollectorsAreExempt: fee.allCollectorsAreExempt,
                    royaltyFee: {
                        numerator: fee.numerator.toString(),
                        denominator: fee.denominator.toString(),
                        fallbackFee: fee.fallbackFee
                            ? {
                                amount: fee.fallbackFee.amount?.toString(),
                                denominatingTokenId:
                                    fee.fallbackFee.denominatingTokenId?.toString() ||
                                    null,
                            }
                            : null,
                    },
                };
                return result;
            }
            return fee;
        });
    };

    return {
        tokenId: info.tokenId?.toString(),
        name: info.name,
        symbol: info.symbol,
        decimals: info.decimals,
        totalSupply: info.totalSupply?.toString(),
        treasuryAccountId: info.treasuryAccountId?.toString(),
        adminKey: info.adminKey?.toString() ?? "",
        kycKey: info.kycKey?.toString() ?? "",
        freezeKey: info.freezeKey?.toString() ?? "",
        pauseKey: info.pauseKey?.toString() ?? "",
        wipeKey: info.wipeKey?.toString() ?? "",
        supplyKey: info.supplyKey?.toString() ?? "",
        feeScheduleKey: info.feeScheduleKey?.toString() ?? "",
        metadataKey: info.metadataKey?.toString() ?? "",
        defaultFreezeStatus: info.defaultFreezeStatus,
        defaultKycStatus: info.defaultKycStatus,
        pauseStatus: getPauseStatusString(info.pauseStatus),
        isDeleted: info.isDeleted,
        autoRenewAccountId: info.autoRenewAccountId?.toString(),
        autoRenewPeriod: info.autoRenewPeriod?.seconds.toString(),
        expirationTime: info.expirationTime?.seconds.toString(),
        tokenMemo: info.tokenMemo,
        customFees: serializeCustomFees(info.customFees),
        tokenType: info.tokenType?.toString(),
        supplyType: info.supplyType?.toString(),
        maxSupply: info.maxSupply?.toString(),
        metadata:
            info.metadata && info.metadata.length > 0
                ? Buffer.from(info.metadata).toString("hex")
                : "",
        ledgerId: info.ledgerId?.toString(),
    };
};

// Helper function to map TokenNftInfo to TokenNftInfoQueryResponse
export const mapTokenNftInfoResponse = (
    info: TokenNftInfo,
): TokenNftInfoQueryResponse => {
    return {
        nftId: info.nftId?.toString(),
        accountId: info.accountId?.toString(),
        creationTime: info.creationTime?.seconds.toString(),
        metadata:
            info.metadata && info.metadata.length > 0
                ? Buffer.from(info.metadata).toString("hex")
                : "",
        ledgerId: info.ledgerId?.toString(),
        spenderId: info.spenderId?.toString() || null,
    };
};
