import {
    AccountId,
    Hbar,
    PrivateKey,
    ScheduleCreateTransaction,
    Timestamp,
    Transaction,
    TransactionId,
    TransferTransaction,
} from "../../src/index.js";

describe("ScheduleCreateTransaction", function () {
    let transactionId;

    beforeEach(function () {
        transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );
    });

    it("should convert from and to bytes", function () {
        const adminKey = PrivateKey.generateED25519().publicKey;
        const scheduled = new TransferTransaction()
            .addHbarTransfer("0.0.5007", new Hbar(-1))
            .addHbarTransfer("0.0.5008", new Hbar(1));

        const tx = new ScheduleCreateTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setScheduledTransaction(scheduled)
            .setAdminKey(adminKey)
            .setPayerAccountId(AccountId.fromString("0.0.5006"))
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(ScheduleCreateTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.adminKey.toString()).to.equal(adminKey.toString());
        expect(tx2.payerAccountId.toString()).to.equal("0.0.5006");

        // There is no public getter for the scheduled transaction.
        const scheduled2 = tx2._scheduledTransaction;
        expect(scheduled2).to.be.instanceOf(TransferTransaction);
        expect(scheduled2.hbarTransfers.size).to.equal(2);
        expect(
            scheduled2.hbarTransfers.get("0.0.5007").toTinybars().toString(),
        ).to.equal("-100000000");
        expect(
            scheduled2.hbarTransfers.get("0.0.5008").toTinybars().toString(),
        ).to.equal("100000000");
    });

    // TODO(#4681): the getScheduleMemo, expirationTime and waitForExpiry
    // getters throw on a frozen transaction, and every transaction
    // fromBytes() returns is frozen.
    it.skip("should read the memo, expiration time and wait for expiry after fromBytes()", function () {
        const expirationTime = new Timestamp(1700000000, 0);
        const tx = new ScheduleCreateTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setScheduledTransaction(
                new TransferTransaction()
                    .addHbarTransfer("0.0.5007", new Hbar(-1))
                    .addHbarTransfer("0.0.5008", new Hbar(1)),
            )
            .setScheduleMemo("memo")
            .setExpirationTime(expirationTime)
            .setWaitForExpiry(true)
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2.getScheduleMemo).to.equal("memo");
        expect(tx2.expirationTime.toString()).to.equal(
            expirationTime.toString(),
        );
        expect(tx2.waitForExpiry).to.equal(true);
    });
});
