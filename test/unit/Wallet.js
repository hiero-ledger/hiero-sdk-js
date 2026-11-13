import { vi } from "vitest";
import Wallet from "../../src/Wallet.js";
import PrivateKey from "../../src/PrivateKey.js";
import PublicKey from "../../src/PublicKey.js";
import AccountId from "../../src/account/AccountId.js";
import SignerSignature from "../../src/SignerSignature.js";
import TransactionId from "../../src/transaction/TransactionId.js";
import TransferTransaction from "../../src/account/TransferTransaction.js";
import Timestamp from "../../src/Timestamp.js";
import AccountBalance from "../../src/account/AccountBalance.js";
import AccountInfoQuery from "../../src/account/AccountInfoQuery.js";
import AccountRecordsQuery from "../../src/account/AccountRecordsQuery.js";
import LedgerId from "../../src/LedgerId.js";
import Hbar from "../../src/Hbar.js";

const ACCOUNT_ID = new AccountId(1);
const OTHER_ACCOUNT_ID = new AccountId(99);
const NODE_ACCOUNT_ID = new AccountId(3);
const NETWORK = {
    "127.0.0.1:50211": new AccountId(3),
    "127.0.0.1:50212": new AccountId(4),
    "127.0.0.1:50213": new AccountId(5),
    "127.0.0.1:50214": new AccountId(6),
};
const MIRROR_NETWORK = ["127.0.0.1:5600"];
const ACCOUNT_BALANCE = new AccountBalance({ hbars: new Hbar(10) });
const ED25519_PRIVATE_KEY = PrivateKey.generateED25519();
const ECDSA_PRIVATE_KEY = PrivateKey.generateECDSA();
const MESSAGES = [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
];
const MISMATCHED_ACCOUNT_ERROR_MESSAGE =
    "transaction's ID constructed with a different account ID";
const NODE_NOT_IN_NETWORK_ERROR_MESSAGE =
    "Transaction already set node account IDs to values not within the current network";
const NO_WALLET_PROVIDER_ERROR_MESSAGE = "wallet does not contain a provider";
const NO_PROVIDER_ERROR_MESSAGE =
    "cannot send request with an wallet that doesn't contain a provider";

const walletBuilder = ({
    accountId = ACCOUNT_ID,
    privateKey = ED25519_PRIVATE_KEY,
    provider = undefined,
} = {}) => new Wallet(accountId, privateKey, provider);

const providerStubBuilder = ({
    call = vi.fn(),
    ledgerId = LedgerId.TESTNET,
    network = NETWORK,
    mirrorNetwork = MIRROR_NETWORK,
    accountBalance = ACCOUNT_BALANCE,
} = {}) => ({
    call,
    getLedgerId: vi.fn(() => ledgerId),
    getNetwork: vi.fn(() => network),
    getMirrorNetwork: vi.fn(() => mirrorNetwork),
    getAccountBalance: vi.fn().mockResolvedValue(accountBalance),
});

const networkAccountIds = (network = NETWORK) =>
    Object.values(network).map((id) => id.toString());

const transferTransactionBuilder = ({
    accountId = ACCOUNT_ID,
    nodeAccountIds = [NODE_ACCOUNT_ID],
} = {}) =>
    new TransferTransaction()
        .setNodeAccountIds(nodeAccountIds)
        .setTransactionId(new TransactionId(accountId, new Timestamp(0, 0)))
        .freeze();

describe("Wallet", function () {
    describe("constructor", function () {
        it("should accept an ED25519 PrivateKey instance", function () {
            const wallet = walletBuilder();
            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.publicKey).toBeInstanceOf(PublicKey);
            expect(wallet.publicKey.toStringRaw()).toBe(
                ED25519_PRIVATE_KEY.publicKey.toStringRaw(),
            );
        });
        it("should accept an ECDSA PrivateKey instance", function () {
            const wallet = walletBuilder({ privateKey: ECDSA_PRIVATE_KEY });
            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.publicKey).toBeInstanceOf(PublicKey);
            expect(wallet.publicKey.toStringRaw()).toBe(
                ECDSA_PRIVATE_KEY.publicKey.toStringRaw(),
            );
        });
        it("should accept an ED25519 DER-encoded private key string", function () {
            const wallet = walletBuilder({
                privateKey: ED25519_PRIVATE_KEY.toStringDer(),
            });
            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.publicKey).toBeInstanceOf(PublicKey);
            expect(wallet.publicKey.toStringRaw()).toBe(
                ED25519_PRIVATE_KEY.publicKey.toStringRaw(),
            );
        });
        it("should accept an ECDSA DER-encoded private key string", function () {
            const wallet = walletBuilder({
                privateKey: ECDSA_PRIVATE_KEY.toStringDer(),
            });
            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.publicKey).toBeInstanceOf(PublicKey);
            expect(wallet.publicKey.toStringRaw()).toBe(
                ECDSA_PRIVATE_KEY.publicKey.toStringRaw(),
            );
        });
        it("should accept an ED25519 raw private key string", function () {
            // Will log a warn message, as it treat any raw string as ED25519 and should be avoided
            const wallet = walletBuilder({
                privateKey: ED25519_PRIVATE_KEY.toStringRaw(),
            });
            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.publicKey).toBeInstanceOf(PublicKey);
            expect(wallet.publicKey.toStringRaw()).toBe(
                ED25519_PRIVATE_KEY.publicKey.toStringRaw(),
            );
        });
        it("should parse the account ID from a string", function () {
            const wallet = walletBuilder({ accountId: ACCOUNT_ID.toString() });
            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.accountId).toBeInstanceOf(AccountId);
            expect(wallet.accountId.toString()).toBe(ACCOUNT_ID.toString());
        });
        it("should throw an error if no private key is provided", function () {
            // Without private key, no funcionalities are provided at all
            expect(() =>
                walletBuilder({ accountId: ACCOUNT_ID, privateKey: null }),
            ).toThrow(TypeError);
        });
        it("should create a wallet without giving an account id", function () {
            // wallet without account can be used for signature purpose
            const wallet = walletBuilder({ accountId: null });
            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.accountId).toBeNull();
        });
    });

    describe("getters", function () {
        it("should return the account ID", function () {
            const wallet = walletBuilder();
            expect(wallet.getAccountId()).toBe(ACCOUNT_ID);
        });
        it("should return null account id when no account id is set", function () {
            const wallet = walletBuilder({ accountId: null });
            expect(wallet.getAccountId()).toBeNull();
        });
        it("should return the public key as the account key", function () {
            const wallet = walletBuilder();
            expect(wallet.getAccountKey()).toBe(wallet.publicKey);
        });
        it("should return undefined provider when none is set", function () {
            const wallet = walletBuilder();
            expect(wallet.getProvider()).toBeUndefined();
        });
        it("should return null ledger ID when no provider is set", function () {
            const wallet = walletBuilder();
            expect(wallet.getLedgerId()).toBeNull();
        });
        it("should return an empty network when no provider is set", function () {
            const wallet = walletBuilder();
            expect(wallet.getNetwork()).toEqual({});
        });
        it("should return an empty mirror network when no provider is set", function () {
            const wallet = walletBuilder();
            expect(wallet.getMirrorNetwork()).toEqual([]);
        });
        it("should return the provider when set", function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            expect(wallet.getProvider()).toBe(provider);
        });
        it("should return the provider ledger ID", function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            expect(wallet.getLedgerId()).toBe(LedgerId.TESTNET);
            expect(provider.getLedgerId).toHaveBeenCalledTimes(1);
        });
        it("should return the provider network", function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            expect(wallet.getNetwork()).toBe(NETWORK);
            expect(provider.getNetwork).toHaveBeenCalledTimes(1);
        });
        it("should return the provider mirror network", function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            expect(wallet.getMirrorNetwork()).toBe(MIRROR_NETWORK);
            expect(provider.getMirrorNetwork).toHaveBeenCalledTimes(1);
        });
    });

    describe("sign", function () {
        it("should return one SignerSignature per message", async function () {
            const wallet = walletBuilder();
            const signatures = await wallet.sign(MESSAGES);
            expect(signatures).toHaveLength(MESSAGES.length);
            for (const signature of signatures) {
                expect(signature).toBeInstanceOf(SignerSignature);
            }
        });
        it("should set the wallet public key and account ID on each signature", async function () {
            const wallet = walletBuilder();
            const signatures = await wallet.sign(MESSAGES);
            for (const signature of signatures) {
                expect(signature.publicKey).toBe(wallet.publicKey);
                expect(signature.accountId).toBe(ACCOUNT_ID);
            }
        });
        it("should produce signatures verifiable with the wallet public key", async function () {
            const wallet = walletBuilder();
            const signatures = await wallet.sign(MESSAGES);
            signatures.forEach((signature, index) => {
                expect(
                    wallet.publicKey.verify(
                        MESSAGES[index],
                        signature.signature,
                    ),
                ).toBe(true);
            });
        });
        it("should return an empty array when there are no messages", async function () {
            const wallet = walletBuilder();
            const signatures = await wallet.sign([]);
            expect(signatures).toEqual([]);
        });
        it("should sign without account id set", async function () {
            const wallet = walletBuilder({ accountId: null });
            const signatures = await wallet.sign(MESSAGES);
            signatures.forEach((signature, index) => {
                expect(
                    wallet.publicKey.verify(
                        MESSAGES[index],
                        signature.signature,
                    ),
                ).toBe(true);
            });
        });
    });

    describe("checkTransaction", function () {
        it("should throw when the transaction ID has a different account ID", function () {
            const wallet = walletBuilder();
            const transaction = transferTransactionBuilder({
                accountId: OTHER_ACCOUNT_ID,
            });
            expect(() => wallet.checkTransaction(transaction)).toThrow(
                MISMATCHED_ACCOUNT_ERROR_MESSAGE,
            );
        });
        it("should resolve to the transaction when the account ID matches", async function () {
            const wallet = walletBuilder();
            const transaction = transferTransactionBuilder();
            await expect(wallet.checkTransaction(transaction)).resolves.toBe(
                transaction,
            );
        });
        it("should resolve when the transaction node account IDs are within the provider network", async function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            const transaction = transferTransactionBuilder({
                nodeAccountIds: [new AccountId(3), new AccountId(5)],
            });
            await expect(wallet.checkTransaction(transaction)).resolves.toBe(
                transaction,
            );
        });
        it("should throw when a transaction node account ID is not within the provider network", function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            const transaction = transferTransactionBuilder({
                nodeAccountIds: [new AccountId(3), new AccountId(42)],
            });
            expect(() => wallet.checkTransaction(transaction)).toThrow(
                NODE_NOT_IN_NETWORK_ERROR_MESSAGE,
            );
        });
        it("should accept a provider network with string account IDs", async function () {
            const provider = providerStubBuilder({
                network: { "127.0.0.1:50211": "0.0.3" },
            });
            const wallet = walletBuilder({ provider });
            const transaction = transferTransactionBuilder();
            await expect(wallet.checkTransaction(transaction)).resolves.toBe(
                transaction,
            );
        });
        it("should thrown an error when checking transaction with a wallet instance without an accountId", async function () {
            const wallet = walletBuilder({ accountId: null });
            const transaction = transferTransactionBuilder();
            expect(() => wallet.checkTransaction(transaction)).toThrow(
                TypeError,
            );
        });
    });

    describe("call", function () {
        it("should throw when no provider is set", function () {
            const wallet = walletBuilder();
            expect(() => wallet.call({})).toThrow(NO_PROVIDER_ERROR_MESSAGE);
        });

        it("should delegate the request to the provider", async function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            const query = new AccountInfoQuery().setAccountId(ACCOUNT_ID);

            await wallet.call(query);

            expect(provider.call).toHaveBeenCalledTimes(1);
            expect(provider.call).toHaveBeenCalledWith(query);
        });
        it("should call the provider and give the result", async function () {
            const result = { value: 10 };
            const provider = providerStubBuilder({
                call: vi.fn().mockResolvedValue(result),
            });
            const wallet = walletBuilder({ provider });
            const query = new AccountInfoQuery().setAccountId(ACCOUNT_ID);
            const callResult = await wallet.call(query);
            expect(provider.call).toHaveBeenCalledTimes(1);
            expect(provider.call).toHaveBeenCalledWith(query);
            expect(callResult).toBe(result);
        });
        it("should propagate provider errors", async function () {
            const error = new Error("provider failure");
            const provider = providerStubBuilder({
                call: vi.fn().mockRejectedValue(error),
            });
            const wallet = walletBuilder({ provider });
            const query = new AccountInfoQuery().setAccountId(ACCOUNT_ID);

            await expect(wallet.call(query)).rejects.toBe(error);
        });
    });

    describe("populateTransaction", function () {
        it("should set a transaction ID generated from the wallet account ID when missing", async function () {
            const wallet = walletBuilder();
            const transaction = new TransferTransaction();
            await wallet.populateTransaction(transaction);
            expect(transaction.transactionId).toBeInstanceOf(TransactionId);
            expect(transaction.transactionId.accountId.toString()).toBe(
                ACCOUNT_ID.toString(),
            );
        });
        it("should keep an already set transaction ID", async function () {
            const wallet = walletBuilder();
            const transactionId = new TransactionId(
                ACCOUNT_ID,
                new Timestamp(0, 0),
            );
            const transaction = new TransferTransaction().setTransactionId(
                transactionId,
            );
            await wallet.populateTransaction(transaction);
            expect(transaction.transactionId).toBe(transactionId);
        });
        it("should return the transaction not frozen when no provider is set and no node account IDs are set", async function () {
            const wallet = walletBuilder();
            const transaction = new TransferTransaction();
            await expect(wallet.populateTransaction(transaction)).resolves.toBe(
                transaction,
            );
            expect(transaction.isFrozen()).toBe(false);
        });
        it("should freeze and keep already set node account IDs without querying the provider", async function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            const transaction = new TransferTransaction().setNodeAccountIds([
                NODE_ACCOUNT_ID,
            ]);
            await wallet.populateTransaction(transaction);
            expect(transaction.isFrozen()).toBe(true);
            expect(
                transaction.nodeAccountIds.map((id) => id.toString()),
            ).toEqual([NODE_ACCOUNT_ID.toString()]);
            expect(provider.getNetwork).not.toHaveBeenCalled();
        });
        it("should select node account IDs from the provider network and freeze", async function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            const transaction = new TransferTransaction();
            await wallet.populateTransaction(transaction);

            const network = networkAccountIds();
            const selected = transaction.nodeAccountIds.map((id) =>
                id.toString(),
            );
            expect(transaction.isFrozen()).toBe(true);
            // a third of the network, rounded up: 4 nodes -> 2
            expect(selected).toHaveLength(2);
            for (const nodeAccountId of selected) {
                expect(network).toContain(nodeAccountId);
            }
        });
        it("should convert string account IDs from the provider network", async function () {
            const provider = providerStubBuilder({
                network: { "127.0.0.1:50211": "0.0.3" },
            });
            const wallet = walletBuilder({ provider });
            const transaction = new TransferTransaction();
            await wallet.populateTransaction(transaction);
            expect(transaction.nodeAccountIds).toHaveLength(1);
            expect(transaction.nodeAccountIds[0]).toBeInstanceOf(AccountId);
            expect(transaction.nodeAccountIds[0].toString()).toBe("0.0.3");
        });
    });

    describe("getAccountBalance", function () {
        it("should throw when no provider is set", function () {
            const wallet = walletBuilder();
            expect(() => wallet.getAccountBalance()).toThrow(
                NO_WALLET_PROVIDER_ERROR_MESSAGE,
            );
        });
        it("should request the wallet account balance from the provider", async function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            await expect(wallet.getAccountBalance()).resolves.toBe(
                ACCOUNT_BALANCE,
            );
            expect(provider.getAccountBalance).toHaveBeenCalledWith(ACCOUNT_ID);
        });
    });

    describe("getAccountInfo", function () {
        it("should throw when no provider is set", function () {
            const wallet = walletBuilder();
            expect(() => wallet.getAccountInfo()).toThrow(
                NO_PROVIDER_ERROR_MESSAGE,
            );
        });
        it("should call the provider with an AccountInfoQuery for the wallet account", async function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            await wallet.getAccountInfo();

            expect(provider.call).toHaveBeenCalledTimes(1);
            const [query] = provider.call.mock.calls[0];
            expect(query).toBeInstanceOf(AccountInfoQuery);
            expect(query.accountId.toString()).toBe(ACCOUNT_ID.toString());
        });
    });

    describe("getAccountRecords", function () {
        it("should throw when no provider is set", function () {
            const wallet = walletBuilder();
            expect(() => wallet.getAccountRecords()).toThrow(
                NO_PROVIDER_ERROR_MESSAGE,
            );
        });
        it("should call the provider with an AccountRecordsQuery for the wallet account", async function () {
            const provider = providerStubBuilder();
            const wallet = walletBuilder({ provider });
            await wallet.getAccountRecords();

            expect(provider.call).toHaveBeenCalledTimes(1);
            const [query] = provider.call.mock.calls[0];
            expect(query).toBeInstanceOf(AccountRecordsQuery);
            expect(query.accountId.toString()).toBe(ACCOUNT_ID.toString());
        });
    });
});
