// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from "vitest";
import Wallet from "../../src/Wallet.js";
import PrivateKey from "../../src/PrivateKey.js";
import AccountId from "../../src/account/AccountId.js";
import TransferTransaction from "../../src/account/TransferTransaction.js";
import TransactionId from "../../src/transaction/TransactionId.js";
import LedgerId from "../../src/LedgerId.js";
/**
 * Minimal mock provider for unit testing — no network calls.
 */
function makeMockProvider(overrides = {}) {
    return {
        getLedgerId: () => LedgerId.MAINNET,
        getNetwork: () => ({
            "0.testnet.hedera.com:50211": new AccountId(3),
            "1.testnet.hedera.com:50211": new AccountId(4),
        }),
        getMirrorNetwork: () => ["hcs.mainnet.mirrornode.hedera.com:5600"],
        call: vi.fn().mockResolvedValue("mock-response"),
        ...overrides,
    };
}

describe("Wallet", function () {
    // ─── Constructor ───────────────────────────────────────────────────────────

    describe("constructor", function () {
        it("should construct with AccountId object and PrivateKey object", function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const wallet = new Wallet(accountId, key);

            expect(wallet.getAccountId().toString()).to.equal(
                accountId.toString(),
            );
            expect(wallet.getAccountKey().toString()).to.equal(
                key.publicKey.toString(),
            );
        });

        it("should construct with string accountId and PrivateKey object", function () {
            const key = PrivateKey.generateED25519();
            const wallet = new Wallet("0.0.3", key);

            expect(wallet.getAccountId().toString()).to.equal("0.0.3");
        });

        it("should construct with DER-encoded private key string", function () {
            const key = PrivateKey.generateED25519();
            const derString = key.toStringDer();
            const wallet = new Wallet(new AccountId(3), derString);

            expect(wallet.getAccountKey().toString()).to.equal(
                key.publicKey.toString(),
            );
        });

        it("should construct with non-DER private key string (legacy path)", function () {
            const key = PrivateKey.generateED25519();
            const rawHex = key.toStringRaw();
            const wallet = new Wallet(new AccountId(3), rawHex);

            expect(wallet.getAccountKey()).to.not.equal(null);
        });

        it("should set provider to undefined when not supplied", function () {
            const key = PrivateKey.generateED25519();
            const wallet = new Wallet(new AccountId(3), key);

            expect(wallet.getProvider()).to.equal(undefined);
        });

        it("should store provider when supplied", function () {
            const key = PrivateKey.generateED25519();
            const provider = makeMockProvider();
            const wallet = new Wallet(new AccountId(3), key, provider);

            expect(wallet.getProvider()).to.equal(provider);
        });
    });

    // ─── Static Factories ──────────────────────────────────────────────────────

    describe("createRandomED25519", function () {
        it("should return a Wallet instance", async function () {
            const wallet = await Wallet.createRandomED25519();
            expect(wallet).to.be.instanceOf(Wallet);
        });

        it("should have a non-null account key", async function () {
            const wallet = await Wallet.createRandomED25519();
            expect(wallet.getAccountKey()).to.not.equal(null);
        });

        it("should have a non-null account id", async function () {
            const wallet = await Wallet.createRandomED25519();
            expect(wallet.getAccountId()).to.not.equal(null);
        });

        it("should produce different keys on each call", async function () {
            const w1 = await Wallet.createRandomED25519();
            const w2 = await Wallet.createRandomED25519();
            expect(w1.getAccountKey().toString()).to.not.equal(
                w2.getAccountKey().toString(),
            );
        });
    });

    describe("createRandomECDSA", function () {
        it("should return a Wallet instance", async function () {
            const wallet = await Wallet.createRandomECDSA();
            expect(wallet).to.be.instanceOf(Wallet);
        });

        it("should have a non-null account key", async function () {
            const wallet = await Wallet.createRandomECDSA();
            expect(wallet.getAccountKey()).to.not.equal(null);
        });

        it("should have a non-null account id", async function () {
            const wallet = await Wallet.createRandomECDSA();
            expect(wallet.getAccountId()).to.not.equal(null);
        });

        it("should produce different keys on each call", async function () {
            const w1 = await Wallet.createRandomECDSA();
            const w2 = await Wallet.createRandomECDSA();
            expect(w1.getAccountKey().toString()).to.not.equal(
                w2.getAccountKey().toString(),
            );
        });
    });

    // ─── Provider-delegating Getters ───────────────────────────────────────────

    describe("getLedgerId", function () {
        it("should return null when no provider is set", function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
            );
            expect(wallet.getLedgerId()).to.equal(null);
        });

        it("should return provider ledger id when provider is set", function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
                makeMockProvider(),
            );
            expect(wallet.getLedgerId()).toEqual(LedgerId.MAINNET);
        });
    });

    describe("getNetwork", function () {
        it("should return empty object when no provider is set", function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
            );
            expect(wallet.getNetwork()).to.deep.equal({});
        });

        it("should return provider network when provider is set", function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
                makeMockProvider(),
            );
            const network = wallet.getNetwork();
            expect(Object.keys(network).length).to.be.greaterThan(0);
        });
    });

    describe("getMirrorNetwork", function () {
        it("should return empty array when no provider is set", function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
            );
            expect(wallet.getMirrorNetwork()).to.deep.equal([]);
        });

        it("should return provider mirror network when provider is set", function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
                makeMockProvider(),
            );
            expect(wallet.getMirrorNetwork().length).to.be.greaterThan(0);
        });
    });

    // ─── sign ──────────────────────────────────────────────────────────────────

    describe("sign", function () {
        it("should return one SignerSignature per message", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const wallet = new Wallet(accountId, key);

            const messages = [
                new Uint8Array([1, 2, 3]),
                new Uint8Array([4, 5, 6]),
            ];
            const signatures = await wallet.sign(messages);

            expect(signatures.length).to.equal(2);
        });

        it("should embed correct publicKey in each SignerSignature", async function () {
            const key = PrivateKey.generateED25519();
            const wallet = new Wallet(new AccountId(3), key);

            const [sig] = await wallet.sign([new Uint8Array([1, 2, 3])]);
            expect(sig.publicKey.toString()).to.equal(key.publicKey.toString());
        });

        it("should embed correct accountId in each SignerSignature", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(42);
            const wallet = new Wallet(accountId, key);

            const [sig] = await wallet.sign([new Uint8Array([7, 8, 9])]);
            expect(sig.accountId.toString()).to.equal(accountId.toString());
        });

        it("should return an empty array when given no messages", async function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
            );
            const signatures = await wallet.sign([]);
            expect(signatures).to.deep.equal([]);
        });

        it("should produce a valid signature that verifies", async function () {
            const key = PrivateKey.generateED25519();
            const wallet = new Wallet(new AccountId(3), key);
            const message = new Uint8Array([10, 20, 30]);

            const [sig] = await wallet.sign([message]);
            const valid = key.publicKey.verify(message, sig.signature);
            expect(valid).to.equal(true);
        });
    });

    // ─── signTransaction ───────────────────────────────────────────────────────

    describe("signTransaction", function () {
        it("should sign the transaction and return it", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const wallet = new Wallet(accountId, key);

            const tx = new TransferTransaction()
                .addHbarTransfer(accountId, -1)
                .addHbarTransfer(new AccountId(4), 1)
                .setTransactionId(TransactionId.generate(accountId))
                .setNodeAccountIds([new AccountId(3)]);

            await tx.freeze();
            const signed = await wallet.signTransaction(tx);
            expect(signed).to.equal(tx);
        });
    });

    // ─── checkTransaction ──────────────────────────────────────────────────────

    describe("checkTransaction", function () {
        it("should resolve when transactionId accountId matches wallet accountId", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const wallet = new Wallet(accountId, key);

            const tx = new TransferTransaction()
                .setTransactionId(TransactionId.generate(accountId))
                .setNodeAccountIds([new AccountId(3)]);

            await expect(wallet.checkTransaction(tx)).resolves.to.equal(tx);
        });

        it("should throw when transactionId was built with a different accountId", function () {
            const key = PrivateKey.generateED25519();
            const wallet = new Wallet(new AccountId(3), key);

            const tx = new TransferTransaction()
                .setTransactionId(TransactionId.generate(new AccountId(99)))
                .setNodeAccountIds([new AccountId(3)]);

            expect(() => wallet.checkTransaction(tx)).toThrow(
                "transaction's ID constructed with a different account ID",
            );
        });

        it("should resolve when no transactionId is set", async function () {
            const key = PrivateKey.generateED25519();
            const wallet = new Wallet(new AccountId(3), key);

            const tx = new TransferTransaction().setNodeAccountIds([
                new AccountId(3),
            ]);

            await expect(wallet.checkTransaction(tx)).resolves.to.equal(tx);
        });

        it("should resolve when no provider and node ids are empty", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const wallet = new Wallet(accountId, key);

            const tx = new TransferTransaction().setTransactionId(
                TransactionId.generate(accountId),
            );

            await expect(wallet.checkTransaction(tx)).resolves.to.equal(tx);
        });

        it("should throw when node ids are not in provider network", function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const provider = makeMockProvider({
                getNetwork: () => ({
                    "0.testnet.hedera.com:50211": new AccountId(3),
                }),
            });
            const wallet = new Wallet(accountId, key, provider);

            const tx = new TransferTransaction()
                .setTransactionId(TransactionId.generate(accountId))
                .setNodeAccountIds([new AccountId(999)]);

            expect(() => wallet.checkTransaction(tx)).toThrow(
                "Transaction already set node account IDs to values not within the current network",
            );
        });
    });

    // ─── populateTransaction ───────────────────────────────────────────────────

    describe("populateTransaction", function () {
        it("should set a transactionId when none is present", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const wallet = new Wallet(accountId, key);

            const tx = new TransferTransaction();
            await wallet.populateTransaction(tx);

            expect(tx.transactionId).to.not.equal(null);
            expect(tx.transactionId.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should not overwrite an existing transactionId", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const wallet = new Wallet(accountId, key);

            const existingId = TransactionId.generate(accountId);
            const tx = new TransferTransaction().setTransactionId(existingId);
            await wallet.populateTransaction(tx);

            expect(tx.transactionId.toString()).to.equal(existingId.toString());
        });

        it("should return the transaction", async function () {
            const key = PrivateKey.generateED25519();
            const wallet = new Wallet(new AccountId(3), key);
            const tx = new TransferTransaction();

            const result = await wallet.populateTransaction(tx);
            expect(result).to.equal(tx);
        });

        it("should set node account ids from provider network", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const provider = makeMockProvider();
            const wallet = new Wallet(accountId, key, provider);

            const tx = new TransferTransaction().addHbarTransfer(
                accountId,
                -1,
            );
            await wallet.populateTransaction(tx);

            expect(tx.nodeAccountIds).to.not.equal(null);
            expect(tx.nodeAccountIds.length).to.be.greaterThan(0);
        });
    });

    // ─── call ──────────────────────────────────────────────────────────────────

    describe("call", function () {
        it("should throw when provider is not set", function () {
            const wallet = new Wallet(
                new AccountId(3),
                PrivateKey.generateED25519(),
            );

            expect(() =>
                wallet.call({
                    _setOperatorWith: () => ({}),
                }),
            ).to.throw(
                "cannot send request with an wallet that doesn't contain a provider",
            );
        });

        it("should delegate to provider.call when provider is set", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const provider = makeMockProvider();
            const wallet = new Wallet(accountId, key, provider);

            const mockRequest = {
                _setOperatorWith: vi.fn().mockReturnThis(),
            };

            const result = await wallet.call(mockRequest);
            expect(provider.call).toHaveBeenCalledOnce();
            expect(result).to.equal("mock-response");
        });

        it("should pass accountId, publicKey, and signer to _setOperatorWith", async function () {
            const key = PrivateKey.generateED25519();
            const accountId = new AccountId(3);
            const provider = makeMockProvider();
            const wallet = new Wallet(accountId, key, provider);

            let capturedArgs;
            const mockRequest = {
                _setOperatorWith: vi.fn((...args) => {
                    capturedArgs = args;
                    return mockRequest;
                }),
            };

            await wallet.call(mockRequest);

            expect(capturedArgs[0].toString()).to.equal(accountId.toString());
            expect(capturedArgs[1].toString()).to.equal(
                key.publicKey.toString(),
            );
            expect(typeof capturedArgs[2]).to.equal("function");
        });
    });
});