// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    PrecheckStatusError,
    Status,
    TransactionId,
} from "../../src/exports.js";

describe("PrecheckStatusError", function () {
    it("should name the transaction and node when both are present", function () {
        const error = new PrecheckStatusError({
            status: Status.TransactionExpired,
            transactionId: TransactionId.fromString(
                "0.0.1854@1651168054.029348185",
            ),
            nodeId: new AccountId(3),
            contractFunctionResult: null,
        });

        expect(error.message).to.equal(
            "transaction 0.0.1854@1651168054.029348185 failed precheck with status TRANSACTION_EXPIRED against node account id 0.0.3",
        );
        expect(error.toJSON()).to.deep.include({
            transactionId: "0.0.1854@1651168054.029348185",
            nodeId: "0.0.3",
        });
    });

    it("should omit both when the failure reached no consensus node", function () {
        const error = new PrecheckStatusError({
            status: Status.InvalidAccountId,
            transactionId: null,
            nodeId: null,
            contractFunctionResult: null,
        });

        expect(error.message).to.equal(
            "query failed with status INVALID_ACCOUNT_ID",
        );
        expect(error.toJSON()).to.deep.include({
            status: "INVALID_ACCOUNT_ID",
            transactionId: null,
            nodeId: null,
        });
        expect(() => error.toString()).to.not.throw();
    });
});
