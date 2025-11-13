import {
    AccountId,
    Client,
    CustomFee,
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
    FeeAssessmentMethod,
    Transaction,
} from "@hiero-ledger/sdk";
import Long from "long";

import { DEFAULT_GRPC_DEADLINE } from "../../utils/constants/config";

import { applyCommonTransactionParams } from "../../params/common-tx-params";

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
