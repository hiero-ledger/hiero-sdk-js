import {
    AccountId,
    TokenId,
    TransactionId,
    Timestamp,
} from "../../src/index.js";
import TokenCancelAirdropTransaction from "../../src/token/TokenCancelAirdropTransaction.js";
import PendingAirdropId from "../../src/token/PendingAirdropId.js";

describe("TokenAirdropCancelTransaction", function () {
    it("from | to bytes", async function () {
        const pendingAirdropId = new PendingAirdropId({
            tokenId: new TokenId(0, 0, 123),
            serial: 456,
            senderId: new AccountId(0, 0, 789),
            receiverId: new AccountId(0, 0, 987),
        });

        const tx = new TokenCancelAirdropTransaction({
            pendingAirdropIds: [pendingAirdropId],
        });

        const tx2 = TokenCancelAirdropTransaction.fromBytes(tx.toBytes());

        expect(tx2.pendingAirdropIds[0]).to.deep.equal(pendingAirdropId);
    });

    it("should add a pending airdrop ID", function () {
        const pendingAirdropId = new PendingAirdropId({
            tokenId: new TokenId(0, 0, 123),
            senderId: new AccountId(0, 0, 789),
            receiverId: new AccountId(0, 0, 987),
        });
        const tx = new TokenCancelAirdropTransaction();

        expect(tx.addPendingAirdropId(pendingAirdropId)).to.equal(tx);
        expect(tx.pendingAirdropIds).to.deep.equal([pendingAirdropId]);
    });

    it("should set the pending airdrop IDs", function () {
        const pendingAirdropIds = [
            new PendingAirdropId({
                tokenId: new TokenId(0, 0, 123),
                senderId: new AccountId(0, 0, 789),
                receiverId: new AccountId(0, 0, 987),
            }),
        ];
        const tx = new TokenCancelAirdropTransaction();

        expect(tx.setPendingAirdropIds(pendingAirdropIds)).to.equal(tx);
        expect(tx.pendingAirdropIds).to.deep.equal(pendingAirdropIds);
    });

    it("should not add a pending airdrop ID once frozen", function () {
        const tx = new TokenCancelAirdropTransaction()
            .setNodeAccountIds([new AccountId(0, 0, 3)])
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    new Timestamp(1596210382, 0),
                ),
            )
            .freeze();

        expect(() =>
            tx.addPendingAirdropId(
                new PendingAirdropId({
                    tokenId: new TokenId(0, 0, 123),
                    senderId: new AccountId(0, 0, 789),
                    receiverId: new AccountId(0, 0, 987),
                }),
            ),
        ).to.throw("transaction is immutable");
    });

    it("should call token.cancelAirdrop() with the request", async function () {
        const request = {};
        const response = {};
        const calls = [];
        const channel = {
            token: {
                cancelAirdrop: (arg) => {
                    calls.push(arg);
                    return Promise.resolve(response);
                },
            },
        };

        expect(
            await new TokenCancelAirdropTransaction()._execute(
                channel,
                request,
            ),
        ).to.equal(response);
        expect(calls).to.deep.equal([request]);
        expect(calls[0]).to.equal(request);
    });

    it("should include the class name and valid start in the log ID", function () {
        const validStart = new Timestamp(1596210382, 0);
        const tx = new TokenCancelAirdropTransaction()
            .setNodeAccountIds([new AccountId(0, 0, 3)])
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    validStart,
                ),
            )
            .freeze();

        expect(tx._getLogId()).to.equal(
            `TokenCancelAirdrop:${validStart.toString()}`,
        );
    });
});
