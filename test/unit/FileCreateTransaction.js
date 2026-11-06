import {
    AccountId,
    FileCreateTransaction,
    PrivateKey,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";

describe("FileCreateTransaction", function () {
    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );
        const keys = [
            PrivateKey.generateED25519().publicKey,
            PrivateKey.generateECDSA().publicKey,
        ];
        const contents = Uint8Array.of(1, 2, 3);
        const expirationTime = new Timestamp(1700000000, 0);

        const tx = new FileCreateTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setKeys(keys)
            .setContents(contents)
            .setExpirationTime(expirationTime)
            .setFileMemo("memo")
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(FileCreateTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.keys.map((key) => key.toString())).to.deep.equal(
            keys.map((key) => key.toString()),
        );
        expect(tx2.contents).to.deep.equal(contents);
        expect(tx2.expirationTime.toString()).to.equal(
            expirationTime.toString(),
        );
        expect(tx2.fileMemo).to.equal("memo");
    });
});
