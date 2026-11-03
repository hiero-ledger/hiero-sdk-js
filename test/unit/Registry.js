// Imports only src/exports.js, like the integration tests and every entry
// point do: the registry has to be loaded from there, or key parsing and
// fromBytes() fail with "Cache.… was used before it was set" (#4560).
import {
    AccountId,
    Key,
    PrivateKey,
    Query,
    AccountInfoQuery,
    Transaction,
    TransactionId,
    TransferTransaction,
} from "../../src/exports.js";
import CACHE from "../../src/Cache.js";

describe("Registry", function () {
    it("parses every key type once src/exports.js is loaded", function () {
        for (const key of [
            PrivateKey.generateED25519().publicKey,
            PrivateKey.generateECDSA().publicKey,
        ]) {
            expect(
                Key._fromProtobufKey(key._toProtobufKey()).toString(),
            ).to.equal(key.toString());
        }
    });

    it("finds transactions and queries by their protobuf case", function () {
        const transaction = new TransferTransaction()
            .addHbarTransfer("0.0.2", -1)
            .addHbarTransfer("0.0.3", 1)
            .setNodeAccountIds([new AccountId(3)])
            .setTransactionId(TransactionId.generate("0.0.2"))
            .freeze();
        expect(Transaction.fromBytes(transaction.toBytes())).to.be.instanceOf(
            TransferTransaction,
        );

        const query = new AccountInfoQuery().setAccountId("0.0.2");
        expect(Query.fromBytes(query.toBytes())).to.be.instanceOf(
            AccountInfoQuery,
        );
    });

    it("fills the receipt and record query constructors", function () {
        expect(CACHE.transactionReceiptQueryConstructor()).to.not.be.null;
        expect(CACHE.transactionRecordQueryConstructor()).to.not.be.null;
    });
});
