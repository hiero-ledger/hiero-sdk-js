import { TokenUpdateNftsTransaction } from "../../src/index.js";
import TransactionId from "../../src/transaction/TransactionId.js";
import AccountId from "../../src/account/AccountId.js";

describe("TokenUpdateNftsTransaction", function () {
    it("should create from a protobuf", function () {
        const tokenId = "0.0.123";
        const serials = [1, 2, 3];
        const metadata = new Uint8Array([1, 2, 3]);

        /**
         * @type {HieroProto.proto.ITokenUpdateNftsTransactionBody}
         */
        const body = {
            tokenUpdateNfts: {
                token: { shardNum: 0, realmNum: 0, tokenNum: 123 },
                serialNumbers: serials,
                metadata: { value: metadata },
            },
        };

        const transactions = [{ body }];
        const signedTransactions = [{}];
        const transactionIds = [TransactionId.generate(new AccountId(1))];
        const nodeIds = [new AccountId(3)];
        const bodies = [body];

        const transaction = TokenUpdateNftsTransaction._fromProtobuf(
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );

        expect(transaction._tokenId.toString()).to.eql(tokenId);
        expect(transaction._serialNumbers).to.eql(serials);
        expect(transaction._metadata).to.eql(metadata);
    });

    it("should _metadata equal to null", async function () {
        const tx = new TokenUpdateNftsTransaction();
        const tx2 = TokenUpdateNftsTransaction.fromBytes(tx.toBytes());

        expect(tx._metadata).to.be.null;
        expect(tx2._metadata).to.be.null;
    });
});
