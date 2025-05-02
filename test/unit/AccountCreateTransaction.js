import { expect } from "chai";

import Long from "long";

import {
    PrivateKey,
    AccountCreateTransaction,
    AccountId,
    Timestamp,
    Transaction,
    TransactionId,
    EvmAddress,
} from "../../src/index.js";

describe("AccountCreateTransaction", function () {
    describe("setECDSAKeyWithAlias", function () {
        /** @type {PrivateKey} */
        let privateEcdsaAccountKey;
        /** @type {PublicKey} */
        let publicEcdsaAccountKey;

        beforeEach(function () {
            privateEcdsaAccountKey = PrivateKey.generateECDSA();
            publicEcdsaAccountKey = privateEcdsaAccountKey.publicKey;
        });

        it("should throw when transaction is frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(3)));

            transaction.freeze();

            expect(() => {
                transaction.setECDSAKeyWithAlias(privateEcdsaAccountKey);
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA private key is provided", function () {
            const privateEd25519AccountKey = PrivateKey.generateED25519();

            expect(() => {
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    privateEd25519AccountKey,
                );
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA public key is provided", function () {
            const publicEd25519AccountKey =
                PrivateKey.generateED25519().publicKey;

            expect(() => {
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    publicEd25519AccountKey,
                );
            }).to.throw(Error);
        });

        it("should set correct account key and derived alias when using private ECDSA key", function () {
            const transaction =
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    privateEcdsaAccountKey,
                );

            expect(transaction.key.toString()).to.equal(
                privateEcdsaAccountKey.toString(),
            );

            expect(transaction.alias.toString()).to.equal(
                privateEcdsaAccountKey.publicKey.toEvmAddress(),
            );
        });

        it("should set correct account key and derived alias when using public ECDSA key", function () {
            const transaction =
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    publicEcdsaAccountKey,
                );

            expect(transaction.key.toString()).to.equal(
                publicEcdsaAccountKey.toString(),
            );

            expect(transaction.alias.toString()).to.equal(
                publicEcdsaAccountKey.toEvmAddress(),
            );
        });
    });

    describe("setKeyWithAlias", function () {
        /** @type {Key} */
        let accountKey;

        /** @type {PrivateKey} */
        let privateEcdsaAliasKey;

        /** @type {PublicKey} */
        let publicEcdsaAliasKey;

        beforeEach(function () {
            accountKey = PrivateKey.generateECDSA().publicKey;
            privateEcdsaAliasKey = PrivateKey.generateECDSA();
            publicEcdsaAliasKey = privateEcdsaAliasKey.publicKey;
        });

        it("should throw when transaction is frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(3)));

            transaction.freeze();

            expect(() => {
                transaction.setKeyWithAlias(accountKey, privateEcdsaAliasKey);
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA private alias key is provided", function () {
            const nonEcdsaAliasKey = PrivateKey.generateED25519();

            expect(() => {
                new AccountCreateTransaction().setKeyWithAlias(
                    accountKey,
                    nonEcdsaAliasKey,
                );
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA public alias key is provided", function () {
            const nonEcdsaPublicAliasKey =
                PrivateKey.generateED25519().publicKey;

            expect(() => {
                new AccountCreateTransaction().setKeyWithAlias(
                    accountKey,
                    nonEcdsaPublicAliasKey,
                );
            }).to.throw(Error);
        });

        it("should set correct account key and alias derived from private ECDSA alias key", function () {
            const transaction = new AccountCreateTransaction().setKeyWithAlias(
                accountKey,
                privateEcdsaAliasKey,
            );

            expect(transaction.key.toString()).to.equal(accountKey.toString());

            expect(transaction.alias.toString()).to.equal(
                privateEcdsaAliasKey.publicKey.toEvmAddress(),
            );
        });

        it("should set correct account key and alias derived from public ECDSA alias key", function () {
            const transaction = new AccountCreateTransaction().setKeyWithAlias(
                accountKey,
                publicEcdsaAliasKey,
            );

            expect(transaction.key.toString()).to.equal(accountKey.toString());

            expect(transaction.alias.toString()).to.equal(
                publicEcdsaAliasKey.toEvmAddress(),
            );
        });
    });

    describe("setKeyWithoutAlias", function () {
        it("should throw when transaction is frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(3)));

            transaction.freeze();

            const accountKey = PrivateKey.generateECDSA();
            expect(() => {
                transaction.setKeyWithoutAlias(accountKey);
            }).to.throw(Error);
        });

        it("should set correct account key without modifying the alias when key is provided", function () {
            const accountKey = PrivateKey.generateECDSA();
            const aliasKey = PrivateKey.generateECDSA();

            const transaction = new AccountCreateTransaction().setAlias(
                aliasKey.publicKey.toEvmAddress(),
            );

            transaction.setKeyWithoutAlias(accountKey);

            expect(transaction.key.toString()).to.equal(accountKey.toString());

            expect(transaction.alias.toString()).to.equal(
                aliasKey.publicKey.toEvmAddress(),
            );
        });
    });

    it("should round trip from bytes and maintain order", function () {
        const key1 = PrivateKey.generateECDSA();
        const spenderAccountId1 = new AccountId(7);
        const nodeAccountId = new AccountId(10, 11, 12);
        const timestamp1 = new Timestamp(14, 15);
        const evmAddress = key1.publicKey.toEvmAddress();

        let transaction = new AccountCreateTransaction()
            .setTransactionId(
                TransactionId.withValidStart(spenderAccountId1, timestamp1),
            )
            .setAlias(evmAddress)
            .setNodeAccountIds([nodeAccountId])
            .freeze();

        transaction = Transaction.fromBytes(transaction.toBytes());

        const data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            alias: EvmAddress.fromString(evmAddress).toBytes(),
            autoRenewPeriod: {
                seconds: Long.fromValue(7776000),
            },
            declineReward: false,
            initialBalance: Long.ZERO,
            key: null,
            maxAutomaticTokenAssociations: 0,
            memo: "",
            proxyAccountID: null,
            receiveRecordThreshold: Long.fromString("9223372036854775807"),
            receiverSigRequired: false,
            sendRecordThreshold: Long.fromString("9223372036854775807"),
            stakedAccountId: null,
            stakedNodeId: null,
        });
    });
});
