import {
    AccountCreateTransaction,
    TransferTransaction,
    AccountInfoQuery,
    Hbar,
    PrivateKey,
    Status,
    TransactionId,
    KeyList,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { deleteAccount } from "./utils/Fixtures.js";

describe("AccountCreate", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .setInitialBalance(new Hbar(2))
            .execute(env.client);

        const receipt = await response.getReceipt(env.client);

        expect(receipt.accountId).to.not.be.null;
        const account = receipt.accountId;

        const info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(account.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key.publicKey.toString());
        expect(info.balance.toTinybars().toNumber()).to.be.equal(
            new Hbar(2).toTinybars().toNumber(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toNumber()).to.be.equal(0);

        await deleteAccount(env.client, key, (transaction) => {
            transaction
                .setAccountId(account)
                .setTransferAccountId(operatorId)
                .setTransactionId(TransactionId.generate(account));
        });
    });

    it("should be able to create an account with an ECDSA private key", async function () {
        const key = PrivateKey.generateECDSA();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .setInitialBalance(new Hbar(2))
            .execute(env.client);

        const receipt = await response.getReceipt(env.client);

        expect(receipt.accountId).to.not.be.null;
        const account = receipt.accountId;

        const info = await new AccountInfoQuery()
            .setNodeAccountIds([response.nodeId])
            .setAccountId(account)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(account.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key.publicKey.toString());
        expect(info.balance.toTinybars().toNumber()).to.be.equal(
            new Hbar(2).toTinybars().toNumber(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toNumber()).to.be.equal(0);

        const transaction = new TransferTransaction()
            .setNodeAccountIds([response.nodeId])
            .setTransactionId(TransactionId.generate(account))
            .addHbarTransfer(account, Hbar.fromTinybars(10).negated())
            .addHbarTransfer(env.operatorId, Hbar.fromTinybars(10))
            .freezeWith(env.client);

        await transaction.sign(key);
        await transaction.execute(env.client);
    });

    it("should be executable with only key set", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const receipt = await response.getReceipt(env.client);

        expect(receipt.accountId).to.not.be.null;
        const account = receipt.accountId;

        const info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(account.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key.publicKey.toString());
        expect(info.balance.toTinybars().toNumber()).to.be.equal(0);
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toNumber()).to.be.equal(0);

        await deleteAccount(env.client, key, (transaction) => {
            transaction.setAccountId(account).setTransferAccountId(operatorId);
        });
    });

    it("should error when key is not set", async function () {
        let status;

        try {
            const response = await new AccountCreateTransaction()
                .setInitialBalance(new Hbar(2))
                .execute(env.client);

            await response.getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.KeyRequired);
    });

    it("should be able to sign transaction and verify transaction signtatures", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const receipt = await response.getReceipt(env.client);

        expect(receipt.accountId).to.not.be.null;
        const account = receipt.accountId;

        const info = await new AccountInfoQuery()
            .setNodeAccountIds([response.nodeId])
            .setAccountId(account)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(account.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key.publicKey.toString());
        expect(info.balance.toTinybars().toNumber()).to.be.equal(0);
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toNumber()).to.be.equal(0);

        await deleteAccount(env.client, key, (transaction) => {
            transaction
                .setNodeAccountIds([response.nodeId])
                .setAccountId(account)
                .setTransferAccountId(operatorId)
                .freezeWith(env.client);

            key.signTransaction(transaction);

            expect(key.publicKey.verifyTransaction(transaction)).to.be.true;
            expect(operatorKey.verifyTransaction(transaction)).to.be.false;
        });
    });

    it("should create account with a single key passed to `KeyList`", async function () {
        const publicKey = PrivateKey.generateED25519().publicKey;
        const thresholdKey = new KeyList(publicKey, 1);

        let transaction = new AccountCreateTransaction()
            .setKeyWithoutAlias(thresholdKey)
            .setInitialBalance(Hbar.fromTinybars(1))
            .freezeWith(env.client);

        const txAccountCreate = await transaction.execute(env.client);
        const txAccountCreateReceipt = await txAccountCreate.getReceipt(
            env.client,
        );
        const accountId = txAccountCreateReceipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setNodeAccountIds([txAccountCreate.nodeId])
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(accountId.toString());
        expect(info.key.toArray()[0].toString()).to.be.equal(
            publicKey.toString(),
        );
    });

    it("should create account with no alias", async function () {
        // Tests the third row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateECDSA();
        const accountKey = PrivateKey.generateECDSA();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .execute(env.client);

        let receipt = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(accountKey)
                .freezeWith(env.client)
                .execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(
            info.contractAccountId
                .toString()
                .startsWith("00000000000000000000"),
        ).to.be.true;
    });

    it("should create account with alias from admin key", async function () {
        // Tests the third row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateECDSA();
        const evmAddress = adminKey.publicKey.toEvmAddress();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .execute(env.client);

        let receipt = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(adminKey)
                .setAlias(evmAddress)
                .freezeWith(env.client)
                .execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should create account with alias derived from ECDSA private admin key", async function () {
        const adminKey = PrivateKey.generateECDSA();
        const evmAddress = adminKey.publicKey.toEvmAddress();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        // create an account with alias derived from admin key
        let receipt = await (
            await new AccountCreateTransaction()
                .setECDSAKeyWithAlias(adminKey)
                .freezeWith(env.client)
                .execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should create account with alias derived from ECDSA public key", async function () {
        const privateKey = PrivateKey.generateECDSA();
        const publicKey = privateKey.publicKey;
        const evmAddress = publicKey.toEvmAddress();

        let receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setECDSAKeyWithAlias(publicKey)
                    .freezeWith(env.client)
                    .sign(privateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(publicKey.toString());
    });

    it("should create account with account key and separate ECDSA public key for alias", async function () {
        const accountKey = PrivateKey.generateED25519();

        const aliasPrivateKey = PrivateKey.generateECDSA();
        const aliasPublicKey = aliasPrivateKey.publicKey;

        const evmAddress = aliasPublicKey.toEvmAddress();

        let receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithAlias(accountKey, aliasPublicKey)
                    .freezeWith(env.client)
                    .sign(aliasPrivateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(
            accountKey.publicKey.toString(),
        );
    });

    it("should create account with admin key and alias derived from different ECDSA private alias key", async function () {
        // Tests the fifth row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const aliasKey = PrivateKey.generateECDSA();
        const evmAddress = aliasKey.publicKey.toEvmAddress();

        // create an account with alias derived from ECDSA private alias key
        let receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithAlias(adminKey, aliasKey)
                    .freezeWith(env.client)
                    .sign(aliasKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should error when trying to create an account with alias derived from admin key when provided admin key is non-ECDSA private", async function () {
        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        let err = false;

        try {
            await (
                await new AccountCreateTransaction()
                    .setECDSAKeyWithAlias(adminKey)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(
                    "Invalid key for alias derivation provided: expected an ECDSA (secp256k1) PrivateKey or PublicKey.",
                );
        }
        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should error when trying to create an account with non-ECDSA public key set for alias derivation", async function () {
        const nonECDSAPublicKey = PrivateKey.generateED25519().publicKey;

        let err = false;

        try {
            await (
                await new AccountCreateTransaction()
                    .setECDSAKeyWithAlias(nonECDSAPublicKey)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(
                    "Invalid key for alias derivation provided: expected an ECDSA (secp256k1) PrivateKey or PublicKey.",
                );
        }
        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should error when trying to create an account with key and separate non-ECDSA private key set for alias derivation", async function () {
        const accountKey = PrivateKey.generateED25519();
        const nonECDSAPrivateKey = PrivateKey.generateED25519();

        let err = false;

        try {
            await (
                await new AccountCreateTransaction()
                    .setKeyWithAlias(accountKey, nonECDSAPrivateKey)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(
                    "Invalid key for alias derivation provided: expected an ECDSA (secp256k1) PrivateKey or PublicKey.",
                );
        }
        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should error when trying to create an account with key and separate non-ECDSA public key set for alias derivation", async function () {
        const accountKey = PrivateKey.generateED25519();
        const nonECDSAPublicKey = PrivateKey.generateED25519().publicKey;

        let err = false;

        try {
            await (
                await new AccountCreateTransaction()
                    .setKeyWithAlias(accountKey, nonECDSAPublicKey)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(
                    "Invalid key for alias derivation provided: expected an ECDSA (secp256k1) PrivateKey or PublicKey.",
                );
        }
        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should create account with alias from admin key with receiver sig required", async function () {
        // Tests the fourth row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateECDSA();
        const evmAddress = adminKey.publicKey.toEvmAddress();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        let receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setReceiverSignatureRequired(true)
                    .setKeyWithoutAlias(adminKey)
                    .setAlias(evmAddress)
                    .freezeWith(env.client)
                    .sign(adminKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should create account with alias derived from ECDSA private admin key with receiver sig required", async function () {
        // Tests the fourth row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateECDSA();
        const evmAddress = adminKey.publicKey.toEvmAddress();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        // create an account with alias derived from admin key
        let receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setReceiverSignatureRequired(true)
                    .setECDSAKeyWithAlias(adminKey)
                    .freezeWith(env.client)
                    .sign(adminKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should error when trying to create account with alias from admin key with receiver sig required without signature", async function () {
        const adminKey = PrivateKey.generateECDSA();
        const evmAddress = adminKey.publicKey.toEvmAddress();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        let err = false;
        try {
            await (
                await new AccountCreateTransaction()
                    .setReceiverSignatureRequired(true)
                    .setKeyWithoutAlias(adminKey)
                    .setAlias(evmAddress)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should error when trying to create account with alias derived from ECDSA private admin key with receiver sig required without signature", async function () {
        const adminKey = PrivateKey.generateECDSA();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        let err = false;

        try {
            // create an account with alias derived from admin key
            await (
                await new AccountCreateTransaction()
                    .setReceiverSignatureRequired(true)
                    .setECDSAKeyWithAlias(adminKey)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should create account with alias different from admin key", async function () {
        // Tests the fifth row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const key = PrivateKey.generateECDSA();
        const evmAddress = key.publicKey.toEvmAddress();

        let receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(adminKey)
                    .setAlias(evmAddress)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should error when trying to create account with alias different from admin key without signature", async function () {
        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const key = PrivateKey.generateECDSA();
        const evmAddress = key.publicKey.toEvmAddress();

        let err = false;
        try {
            await (
                await new AccountCreateTransaction()
                    .setReceiverSignatureRequired(true)
                    .setKeyWithoutAlias(adminKey)
                    .setAlias(evmAddress)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should error when trying to create account with admin key and alias derived from different ECDSA private alias key without signature", async function () {
        const adminKey = PrivateKey.generateED25519();
        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const aliasKey = PrivateKey.generateECDSA();

        let err = false;
        try {
            await (
                await new AccountCreateTransaction()
                    .setReceiverSignatureRequired(true)
                    .setKeyWithAlias(adminKey, aliasKey)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should create account with alias different from admin key with receiver sig required", async function () {
        // Tests the sixth row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const key = PrivateKey.generateECDSA();
        const evmAddress = key.publicKey.toEvmAddress();

        let receipt = await (
            await (
                await (
                    await new AccountCreateTransaction()
                        .setReceiverSignatureRequired(true)
                        .setKeyWithoutAlias(adminKey)
                        .setAlias(evmAddress)
                        .freezeWith(env.client)
                        .sign(key)
                ).sign(adminKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should create account with admin key and alias derived from ECDSA private alias key with receiver sig required", async function () {
        // Tests the sixth row of this table
        // https://github.com/hashgraph/hedera-improvement-proposal/blob/d39f740021d7da592524cffeaf1d749803798e9a/HIP/hip-583.md#signatures

        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const aliasKey = PrivateKey.generateECDSA();
        const evmAddress = aliasKey.publicKey.toEvmAddress();

        let receipt = await (
            await (
                await (
                    await new AccountCreateTransaction()
                        .setReceiverSignatureRequired(true)
                        .setKeyWithAlias(adminKey, aliasKey)
                        .freezeWith(env.client)
                        .sign(aliasKey)
                ).sign(adminKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const accountId = receipt.accountId;

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.not.be.null;
        expect(info.contractAccountId.toString()).to.be.equal(
            evmAddress.toString(),
        );
        expect(info.key.toString()).to.be.equal(adminKey.publicKey.toString());
    });

    it("should error when trying to create account with alias different from admin key and receiver sig required without signature", async function () {
        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const key = PrivateKey.generateECDSA();
        const evmAddress = key.publicKey.toEvmAddress();

        let err = false;
        try {
            await (
                await (
                    await new AccountCreateTransaction()
                        .setReceiverSignatureRequired(true)
                        .setKeyWithoutAlias(adminKey)
                        .setAlias(evmAddress)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    it("should error when trying to create account with admin key and alias derived from ECDSA private alias key and receiver sig required without signature", async function () {
        const adminKey = PrivateKey.generateED25519();

        // create an admin account
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(adminKey)
            .freezeWith(env.client)
            .execute(env.client);

        const aliasKey = PrivateKey.generateECDSA();

        let err = false;
        try {
            await (
                await (
                    await new AccountCreateTransaction()
                        .setReceiverSignatureRequired(true)
                        .setKeyWithAlias(adminKey, aliasKey)
                        .freezeWith(env.client)
                        .sign(aliasKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        if (!err) {
            throw new Error("account creation did not error");
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
