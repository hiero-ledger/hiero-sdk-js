import {
    AccountCreateTransaction,
    TransferTransaction,
    AccountInfoQuery,
    Hbar,
    PrivateKey,
    Status,
    TransactionId,
    KeyList,
    ContractCreateTransaction,
} from "../../src/exports.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import HookExtensionPoint from "../../src/hooks/HookExtensionPoint.js";
import EvmHook from "../../src/hooks/EvmHook.js";

import { EvmHookStorageSlot } from "../../src/hooks/EvmHookStorageUpdate.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { deleteAccount } from "./utils/Fixtures.js";
import { decode } from "../../src/encoding/hex.js";

describe("AccountCreate", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    describe("AccountCreate with EVM Hook", function () {
        let contractId;

        beforeAll(async function () {
            const bytecode = decode(
                "6080604052348015600e575f5ffd5b506103da8061001c5f395ff3fe60806040526004361061001d575f3560e01c80630b6c5c0414610021575b5f5ffd5b61003b6004803603810190610036919061021c565b610051565b60405161004891906102ed565b60405180910390f35b5f61016d73ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff16146100c2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100b990610386565b60405180910390fd5b60019050979650505050505050565b5f5ffd5b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610102826100d9565b9050919050565b610112816100f8565b811461011c575f5ffd5b50565b5f8135905061012d81610109565b92915050565b5f819050919050565b61014581610133565b811461014f575f5ffd5b50565b5f813590506101608161013c565b92915050565b5f5ffd5b5f5ffd5b5f5ffd5b5f5f83601f84011261018757610186610166565b5b8235905067ffffffffffffffff8111156101a4576101a361016a565b5b6020830191508360018202830111156101c0576101bf61016e565b5b9250929050565b5f5f83601f8401126101dc576101db610166565b5b8235905067ffffffffffffffff8111156101f9576101f861016a565b5b6020830191508360018202830111156102155761021461016e565b5b9250929050565b5f5f5f5f5f5f5f60a0888a031215610237576102366100d1565b5b5f6102448a828b0161011f565b97505060206102558a828b01610152565b96505060406102668a828b01610152565b955050606088013567ffffffffffffffff811115610287576102866100d5565b5b6102938a828b01610172565b9450945050608088013567ffffffffffffffff8111156102b6576102b56100d5565b5b6102c28a828b016101c7565b925092505092959891949750929550565b5f8115159050919050565b6102e7816102d3565b82525050565b5f6020820190506103005f8301846102de565b92915050565b5f82825260208201905092915050565b7f436f6e74726163742063616e206f6e6c792062652063616c6c656420617320615f8201527f20686f6f6b000000000000000000000000000000000000000000000000000000602082015250565b5f610370602583610306565b915061037b82610316565b604082019050919050565b5f6020820190508181035f83015261039d81610364565b905091905056fea2646970667358221220a8c76458204f8bb9a86f59ec2f0ccb7cbe8ae4dcb65700c4b6ee91a39404083a64736f6c634300081e0033",
            );
            const receipt = await (
                await new ContractCreateTransaction()
                    .setBytecode(bytecode)
                    .setGas(300_000)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);
            contractId = receipt.contractId;
        });

        it("should execute with EVM hook", async function () {
            const evmHook = new EvmHook({
                contractId: contractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const newKey = PrivateKey.generateED25519();

            // When: executing AccountCreateTransaction with the hook
            const tx = await new AccountCreateTransaction()
                .setKeyWithoutAlias(newKey.publicKey)
                .setInitialBalance(new Hbar(1))
                .setMaxTransactionFee(new Hbar(10))
                .addHook(hookDetails)
                .freezeWith(env.client)
                .sign(newKey);

            const receipt = await (
                await tx.execute(env.client)
            ).getReceipt(env.client);
            const newAccountId = receipt.accountId;
            expect(newAccountId).toBeDefined();
        });

        it("should execute with EVM hook and storage updates", async function () {
            const evmHook = new EvmHook({
                contractId: contractId,
                storageUpdates: [
                    new EvmHookStorageSlot(
                        new Uint8Array([0x01, 0x02, 0x03, 0x04]),
                    ),
                ],
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const newKey = PrivateKey.generateED25519();

            // When: executing AccountCreateTransaction with the hook
            const tx = await new AccountCreateTransaction()
                .setKeyWithoutAlias(newKey.publicKey)
                .setInitialBalance(new Hbar(1))
                .addHook(hookDetails)
                .setMaxTransactionFee(new Hbar(10))
                .freezeWith(env.client)
                .sign(newKey);

            const receipt = await (
                await tx.execute(env.client)
            ).getReceipt(env.client);
            const newAccountId = receipt.accountId;
            expect(newAccountId).toBeDefined();
        });

        it("should revert when EVM hook but no contract id is provided", async function () {
            const evmHook = new EvmHook({
                storageUpdates: [
                    new EvmHookStorageSlot(
                        new Uint8Array([0x01, 0x02, 0x03, 0x04]),
                    ),
                ],
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const newKey = PrivateKey.generateED25519();

            const tx = await new AccountCreateTransaction()
                .setKeyWithoutAlias(newKey.publicKey)
                .setInitialBalance(new Hbar(1))
                .addHook(hookDetails)
                .setMaxTransactionFee(new Hbar(10))
                .freezeWith(env.client)
                .sign(newKey);

            let err = null;
            try {
                await (await tx.execute(env.client)).getReceipt(env.client);
            } catch (error) {
                err = error
                    .toString()
                    .includes(Status.InvalidHookCreationSpec.toString());
            }

            expect(err).toBe(true);
        });

        it("should revert revert when duplicate hook id", async function () {
            const evmHook = new EvmHook({
                contractId: contractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const sameHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const newKey = PrivateKey.generateED25519();

            // When: executing AccountCreateTransaction with the hook
            let tx = await new AccountCreateTransaction()
                .setKeyWithoutAlias(newKey.publicKey)
                .setInitialBalance(new Hbar(1))
                .addHook(hookDetails)
                .addHook(sameHookDetails)
                .setMaxTransactionFee(new Hbar(10))
                .freezeWith(env.client)
                .sign(newKey);

            let err = null;
            try {
                await (await tx.execute(env.client)).getReceipt(env.client);
            } catch (error) {
                err = error
                    .toString()
                    .includes(
                        Status.HookIdRepeatedInCreationDetails.toString(),
                    );
            }

            expect(err).toBe(true);
        });

        it("should execute hook with an admin key provided", async function () {
            const evmHook = new EvmHook({
                storageUpdates: [
                    new EvmHookStorageSlot(
                        new Uint8Array([0x01, 0x02, 0x03, 0x04]),
                    ),
                ],
                contractId: contractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
                adminKey: PrivateKey.generateED25519().publicKey,
            });

            const newKey = PrivateKey.generateED25519();

            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(newKey.publicKey)
                    .setInitialBalance(new Hbar(1))
                    .addHook(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);
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
            .setMaxTransactionFee(new Hbar(10))
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
