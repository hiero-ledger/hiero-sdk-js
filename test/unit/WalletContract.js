// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    AccountInfoQuery,
    AccountRecordsQuery,
    Client,
    LedgerId,
    LocalProvider,
    PrivateKey,
    TransactionId,
    TransferTransaction,
    Wallet,
} from "../../src/index.js";

describe("Wallet contract", function () {
    const key = PrivateKey.fromStringED25519("11".repeat(32));
    let client;

    afterEach(function () {
        vi.restoreAllMocks();
        client?.close();
    });

    it("accepts DER and legacy raw keys and produces verifiable ordered signatures", async function () {
        const messages = [Uint8Array.of(1, 2), Uint8Array.of(3, 4)];
        for (const encoded of [key.toStringDer(), key.toStringRaw()]) {
            const wallet = new Wallet("0.0.100", encoded);
            const signatures = await wallet.sign(messages);
            expect(signatures).to.have.length(2);
            for (let i = 0; i < signatures.length; i++) {
                expect(signatures[i].accountId.toString()).to.equal("0.0.100");
                expect(
                    key.publicKey.verify(messages[i], signatures[i].signature),
                ).to.be.true;
            }
            expect(await wallet.sign([])).to.deep.equal([]);
        }
    });

    it("has no implicit network and rejects requests without a provider", function () {
        const wallet = new Wallet(new AccountId(100), key);
        expect(wallet.getProvider()).to.be.undefined;
        expect(wallet.getLedgerId()).to.be.null;
        expect(wallet.getNetwork()).to.deep.equal({});
        expect(wallet.getMirrorNetwork()).to.deep.equal([]);
        expect(() => wallet.getAccountBalance()).to.throw(
            "wallet does not contain a provider",
        );
        expect(() => wallet.getAccountInfo()).to.throw(
            "doesn't contain a provider",
        );
        expect(() => wallet.getAccountRecords()).to.throw(
            "doesn't contain a provider",
        );
    });

    it("rejects a different payer before accepting an otherwise valid transaction", async function () {
        const wallet = new Wallet("0.0.100", key);
        const transaction = new TransferTransaction();
        expect(await wallet.checkTransaction(transaction)).to.equal(
            transaction,
        );
        transaction.setTransactionId(
            TransactionId.generate(new AccountId(101)),
        );
        expect(() => wallet.checkTransaction(transaction)).to.throw(
            "different account ID",
        );
    });

    it("accepts only node IDs from the provider's network", async function () {
        client = Client.forNetwork({ "127.0.0.1:50211": "0.0.3" });
        client
            .setLedgerId(LedgerId.TESTNET)
            .setMirrorNetwork(["mirror.example:443"]);
        const provider = LocalProvider.fromClient(client);
        const wallet = new Wallet("0.0.100", key, provider);
        expect(wallet.getProvider()).to.equal(provider);
        expect(wallet.getLedgerId()).to.equal(LedgerId.TESTNET);
        expect(wallet.getNetwork()).to.deep.equal(client.network);
        expect(wallet.getMirrorNetwork()).to.deep.equal(["mirror.example:443"]);

        const transaction = new TransferTransaction()
            .setTransactionId(TransactionId.generate(new AccountId(100)))
            .setNodeAccountIds([new AccountId(3)]);
        expect(await wallet.checkTransaction(transaction)).to.equal(
            transaction,
        );
        const invalid = new TransferTransaction().setNodeAccountIds([
            new AccountId(4),
        ]);
        expect(() => wallet.checkTransaction(invalid)).to.throw(
            "not within the current network",
        );
    });

    it("keeps offline transactions editable until node IDs are supplied", async function () {
        const wallet = new Wallet("0.0.100", key);
        const transaction = await wallet.populateTransaction(
            new TransferTransaction(),
        );
        expect(transaction.transactionId.accountId.toString()).to.equal(
            "0.0.100",
        );
        expect(transaction.isFrozen()).to.be.false;
        transaction.setNodeAccountIds([new AccountId(3)]);
        expect(await wallet.populateTransaction(transaction)).to.equal(
            transaction,
        );
        expect(transaction.isFrozen()).to.be.true;
        await wallet.signTransaction(transaction);
        expect(key.publicKey.verifyTransaction(transaction)).to.be.true;
    });

    it("populates configured node IDs and injects the wallet operator into queries", async function () {
        client = Client.forNetwork({ "127.0.0.1:50211": "0.0.3" });
        const provider = LocalProvider.fromClient(client);
        const wallet = new Wallet("0.0.100", key, provider);
        const transaction = await wallet.populateTransaction(
            new TransferTransaction(),
        );
        expect(transaction.isFrozen()).to.be.true;
        expect(transaction.nodeAccountIds.map(String)).to.deep.equal(["0.0.3"]);
        const call = vi.spyOn(provider, "call").mockResolvedValue(undefined);
        await wallet.getAccountInfo();
        await wallet.getAccountRecords();
        const requests = call.mock.calls.map(([request]) => request);
        expect(requests[0]).to.be.instanceOf(AccountInfoQuery);
        expect(requests[1]).to.be.instanceOf(AccountRecordsQuery);
        for (const request of requests) {
            expect(request.accountId.toString()).to.equal("0.0.100");
            expect(request._operator.accountId.toString()).to.equal("0.0.100");
            expect(request._operator.publicKey.toString()).to.equal(
                key.publicKey.toString(),
            );
        }
    });
});
