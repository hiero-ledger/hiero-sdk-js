// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import Duration from "../../src/Duration.js";
import {
    AccountId,
    CustomFixedFee,
    PrivateKey,
    Timestamp,
    TopicId,
    TopicUpdateTransaction,
    Transaction,
    TransactionId,
} from "../../src/index.js";

const keys = [1, 2, 3].map(
    (value) =>
        PrivateKey.fromBytesED25519(new Uint8Array(32).fill(value)).publicKey,
);

function makeTransaction() {
    return new TopicUpdateTransaction({
        topicId: new TopicId(0, 0, 42),
        topicMemo: "updated topic",
        adminKey: keys[0],
        submitKey: keys[1],
        feeScheduleKey: keys[2],
        feeExemptKeys: [keys[0], keys[1]],
        customFees: [
            new CustomFixedFee()
                .setAmount(25)
                .setDenominatingTokenId("0.0.7")
                .setFeeCollectorAccountId("0.0.9"),
        ],
        expirationTime: new Timestamp(1700000000, 123456789),
        autoRenewAccountId: new AccountId(0, 0, 8),
        autoRenewPeriod: new Duration(7776000),
    });
}

describe("TopicUpdateTransaction bytes round trip", function () {
    it("preserves every supplied optional field in a frozen transaction", function () {
        const transaction = makeTransaction()
            .setNodeAccountIds([new AccountId(3)])
            .setTransactionId(TransactionId.fromString("0.0.2@123.000000456"))
            .freeze();

        const decoded = Transaction.fromBytes(transaction.toBytes());

        expect(decoded).to.be.instanceOf(TopicUpdateTransaction);
        expect(decoded.isFrozen()).to.be.true;
        expect(decoded.topicId.toString()).to.equal("0.0.42");
        expect(decoded.topicMemo).to.equal("updated topic");
        expect(decoded.adminKey.toString()).to.equal(keys[0].toString());
        expect(decoded.submitKey.toString()).to.equal(keys[1].toString());
        expect(decoded.getFeeScheduleKey().toString()).to.equal(
            keys[2].toString(),
        );
        expect(
            decoded.getFeeExemptKeys().map((key) => key.toString()),
        ).to.deep.equal([keys[0].toString(), keys[1].toString()]);
        expect(decoded.getCustomFees()).to.have.lengthOf(1);
        const [fee] = decoded.getCustomFees();
        expect(fee.amount.toString()).to.equal("25");
        expect(fee.denominatingTokenId.toString()).to.equal("0.0.7");
        expect(fee.feeCollectorAccountId.toString()).to.equal("0.0.9");
        expect(decoded.expirationTime.toString()).to.equal(
            "1700000000.123456789",
        );
        expect(decoded.autoRenewAccountId.toString()).to.equal("0.0.8");
        expect(decoded.autoRenewPeriod.seconds.toString()).to.equal("7776000");
        expect(decoded.transactionId.toString()).to.equal(
            "0.0.2@123.000000456",
        );
        expect(decoded.toBytes()).to.deep.equal(transaction.toBytes());
    });

    for (const [name, period] of [
        ["number", 7776000],
        ["Long", Long.fromNumber(7776000)],
        ["Duration", new Duration(7776000)],
    ]) {
        it(`preserves a ${name} renewal period and string entity IDs`, function () {
            const transaction = new TopicUpdateTransaction({
                topicId: "0.0.42",
                autoRenewAccountId: "0.0.8",
                autoRenewPeriod: period,
            });
            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded.topicId.toString()).to.equal("0.0.42");
            expect(decoded.autoRenewAccountId.toString()).to.equal("0.0.8");
            expect(decoded.autoRenewPeriod.seconds.toString()).to.equal(
                "7776000",
            );
        });
    }

    it("converts a Date expiration to the same instant on the wire", function () {
        const transaction = new TopicUpdateTransaction({
            expirationTime: new Date("2026-11-09T12:34:56.789Z"),
        });
        const decoded = Transaction.fromBytes(transaction.toBytes());

        expect(decoded.expirationTime.toDate().toISOString()).to.equal(
            "2026-11-09T12:34:56.789Z",
        );
        expect(decoded.expirationTime.nanos.toNumber()).to.equal(789000000);
    });

    it("preserves explicit fee-list clearing separately from omitted lists", function () {
        const transaction = makeTransaction();
        expect(transaction.clearFeeExemptKeys()).to.equal(transaction);
        expect(transaction.clearCustomFees()).to.equal(transaction);

        const cleared = Transaction.fromBytes(transaction.toBytes());
        const omitted = Transaction.fromBytes(
            new TopicUpdateTransaction().toBytes(),
        );

        expect(cleared.getFeeExemptKeys()).to.deep.equal([]);
        expect(cleared.getCustomFees()).to.deep.equal([]);
        expect(omitted.getFeeExemptKeys()).to.be.null;
        expect(omitted.getCustomFees()).to.be.null;
    });

    for (const [method, args] of [
        ["setTopicId", ["0.0.43"]],
        ["clearTopicId", []],
        ["setTopicMemo", ["changed"]],
        ["clearTopicMemo", []],
        ["setAdminKey", [keys[1]]],
        ["clearAdminKey", []],
        ["setSubmitKey", [keys[0]]],
        ["clearSubmitKey", []],
        ["setFeeScheduleKey", [keys[0]]],
        ["clearFeeScheduleKey", []],
        ["setFeeExemptKeys", [[keys[2]]]],
        ["addFeeExemptKey", [keys[2]]],
        ["clearFeeExemptKeys", []],
        ["setAutoRenewAccountId", ["0.0.9"]],
        ["clearAutoRenewAccountId", []],
        ["setAutoRenewPeriod", [3600]],
        ["setCustomFees", [[]]],
        ["addCustomFee", [new CustomFixedFee().setAmount(1)]],
        ["clearCustomFees", []],
        ["setExpirationTime", [new Timestamp(1700000001, 0)]],
    ]) {
        it(`rejects ${method} after freeze without changing the frozen body`, function () {
            const transaction = makeTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(
                    TransactionId.fromString("0.0.2@123.000000456"),
                )
                .freeze();
            const bytes = transaction.toBytes();

            expect(() => transaction[method](...args)).to.throw(
                "transaction is immutable",
            );
            expect(transaction.toBytes()).to.deep.equal(bytes);
        });
    }
});
