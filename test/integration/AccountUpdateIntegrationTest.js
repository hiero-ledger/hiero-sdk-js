import {
    AccountInfoQuery,
    AccountUpdateTransaction,
    ContractCreateTransaction,
    Hbar,
    PrivateKey,
    Status,
    Timestamp,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import Long from "long";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";
import { decode } from "../../src/encoding/hex.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import HookExtensionPoint from "../../src/hooks/HookExtensionPoint.js";
import { EvmHookStorageSlot } from "../../src/hooks/EvmHookStorageUpdate.js";

describe("AccountUpdate", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;

        const { accountId, newKey: key1 } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        let info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(accountId.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key1.publicKey.toString());
        expect(info.balance.toTinybars().toInt()).to.be.equal(
            new Hbar(1).toTinybars().toInt(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toInt()).to.be.equal(0);

        const key2 = PrivateKey.generateED25519();

        const response = await (
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .setKey(key2.publicKey)
                    // .setAutoRenewPeriod(777600000)
                    // .setExpirationTime(new Date(Date.now() + 7776000000))
                    .freezeWith(env.client)
                    .sign(key1)
            ).sign(key2)
        ).execute(env.client);

        await response.getReceipt(env.client);

        info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(accountId.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key2.publicKey.toString());
        expect(info.balance.toTinybars().toInt()).to.be.equal(
            new Hbar(1).toTinybars().toInt(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toInt()).to.be.equal(0);

        await deleteAccount(env.client, key2, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId)
                .setTransactionId(TransactionId.generate(accountId));
        });
    });

    // Hook-related tests
    describe("AccountUpdate with Hooks", function () {
        let testContractId;

        beforeAll(async function () {
            // Create a test contract for hook testing
            const bytecode = decode(
                "6080604052348015600e575f5ffd5b506103da8061001c5f395ff3fe60806040526004361061001d575f3560e01c80630b6c5c0414610021575b5f5ffd5b61003b6004803603810190610036919061021c565b610051565b60405161004891906102ed565b60405180910390f35b5f61016d73ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff16146100c2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100b990610386565b60405180910390fd5b60019050979650505050505050565b5f5ffd5b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610102826100d9565b9050919050565b610112816100f8565b811461011c575f5ffd5b50565b5f8135905061012d81610109565b92915050565b5f819050919050565b61014581610133565b811461014f575f5ffd5b50565b5f813590506101608161013c565b92915050565b5f5ffd5b5f5ffd5b5f5ffd5b5f5f83601f84011261018757610186610166565b5b8235905067ffffffffffffffff8111156101a4576101a361016a565b5b6020830191508360018202830111156101c0576101bf61016e565b5b9250929050565b5f5f83601f8401126101dc576101db610166565b5b8235905067ffffffffffffffff8111156101f9576101f861016a565b5b6020830191508360018202830111156102155761021461016e565b5b9250929050565b5f5f5f5f5f5f5f60a0888a031215610237576102366100d1565b5b5f6102448a828b0161011f565b97505060206102558a828b01610152565b96505060406102668a828b01610152565b955050606088013567ffffffffffffffff811115610287576102866100d5565b5b6102938a828b01610172565b9450945050608088013567ffffffffffffffff8111156102b6576102b56100d5565b5b6102c28a828b016101c7565b925092505092959891949750929550565b5f8115159050919050565b6102e7816102d3565b82525050565b5f6020820190506103005f8301846102de565b92915050565b5f82825260208201905092915050565b7f436f6e74726163742063616e206f6e6c792062652063616c6c656420617320615f8201527f20686f6f6b000000000000000000000000000000000000000000000000000000602082015250565b5f610370602583610306565b915061037b82610316565b604082019050919050565b5f6020820190508181035f83015261039d81610364565b905091905056fea2646970667358221220a8c76458204f8bb9a86f59ec2f0ccb7cbe8ae4dcb65700c4b6ee91a39404083a64736f6c634300081e0033",
            );

            const { contractId } = await (
                await new ContractCreateTransaction()
                    .setBytecode(bytecode)
                    .setGas(300_000)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            testContractId = contractId;
        });

        it("should successfully add a basic EVM hook to account without hooks", async function () {
            // Given: an account exists without hooks
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            // When: AccountUpdateTransaction adds a basic EVM hook
            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const response = await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
        });

        it("should fail with HOOK_ID_REPEATED_IN_CREATION_DETAILS when duplicate hook IDs are used", async function () {
            // Given: an AccountUpdateTransaction is configured with duplicate hook IDs
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails1 = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const hookDetails2 = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1, // Same ID as hookDetails1
                evmHook: evmHook,
            });

            let errorOccurred = false;
            let errorStatus = null;

            try {
                // When: the transaction is executed
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .addHookToCreate(hookDetails1)
                        .addHookToCreate(hookDetails2)
                        .setMaxTransactionFee(new Hbar(10))
                        .freezeWith(env.client)
                        .sign(newKey)
                ).execute(env.client);
            } catch (error) {
                errorOccurred = true;
                errorStatus = error.status;
            }

            // Then: the transaction fails with HOOK_ID_REPEATED_IN_CREATION_DETAILS error
            expect(errorOccurred).to.be.true;
            expect(errorStatus).to.be.eql(
                Status.HookIdRepeatedInCreationDetails,
            );
        });

        it("should fail with HOOK_ID_IN_USE when attempting to add hook with existing ID", async function () {
            // Given: an account exists with a hook
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .addHookToCreate(hookDetails)
                        .setMaxTransactionFee(new Hbar(10))
                        .freezeWith(env.client)
                        .sign(newKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .addHookToCreate(hookDetails)
                            .setMaxTransactionFee(new Hbar(10))
                            .freezeWith(env.client)
                            .sign(newKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                errorOccurred = true;
                errorStatus = error.status;
            }

            // Then: the transaction fails with HOOK_ID_IN_USE error
            expect(errorOccurred).to.be.true;
            expect(errorStatus).to.be.eql(Status.HookIdInUse);
        });

        it("should successfully add EVM hook with initial storage updates", async function () {
            // Given: an account exists without hooks
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            // When: AccountUpdateTransaction adds an EVM hook with initial storage updates
            const evmHook = new EvmHook({
                contractId: testContractId,
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

            const response = await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
        });

        it("should fail with HOOK_ID_IN_USE when attempting to add another hook with same ID", async function () {
            // Given: an account exists with an existing hook
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .addHookToCreate(hookDetails)
                        .setMaxTransactionFee(new Hbar(10))
                        .freezeWith(env.client)
                        .sign(newKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .addHookToCreate(hookDetails)
                            .setMaxTransactionFee(new Hbar(10))
                            .freezeWith(env.client)
                            .sign(newKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                errorOccurred = true;
                errorStatus = error.status;
            }

            // Then: the transaction fails with HOOK_ID_IN_USE error
            expect(errorOccurred).to.be.true;
            expect(errorStatus).to.be.eql(Status.HookIdInUse);
        });

        it("should successfully delete a hook by ID with valid signatures", async function () {
            // Given: an account exists with a hook
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client);

            // When: AccountUpdateTransaction deletes the hook by ID
            const response = await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .addHookToDelete(1)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status).to.be.eql(Status.Success);

            // Then: the hook is successfully removed from the account
            // Note: We can't directly verify hook removal without additional query capabilities
            // The test passes if the transaction succeeds without errors
        });

        it("should fail with HOOK_NOT_FOUND when attempting to delete non-existent hook", async function () {
            // Given: an account exists with hooks
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client);

            // When: AccountUpdateTransaction attempts to delete a hook ID that doesn't exist
            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .addHookToDelete(999) // Non-existent hook ID
                            .setMaxTransactionFee(new Hbar(10))
                            .freezeWith(env.client)
                            .sign(newKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                errorOccurred = true;
                errorStatus = error.status;
            }

            // Then: the transaction fails with HOOK_NOT_FOUND error
            expect(errorOccurred).to.be.true;
            expect(errorStatus).to.be.eql(Status.HookNotFound);
        });

        it("should fail with HOOK_NOT_FOUND when adding and deleting same hook ID in same transaction", async function () {
            // Given: an AccountUpdateTransaction attempts to add and delete hooks with the same ID
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .addHookToCreate(hookDetails)
                            .addHookToDelete(1) // Same ID as the hook being added
                            .setMaxTransactionFee(new Hbar(100))
                            .freezeWith(env.client)
                            .sign(newKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                errorOccurred = true;
                errorStatus = error.status;
            }

            // Then: the transaction fails with HOOK_NOT_FOUND error
            expect(errorOccurred).to.be.true;
            expect(errorStatus).to.be.eql(Status.HookNotFound);
        });

        //  this doesn't seem to be a valid test case
        // TODO: check with consensus node guys if this should work as expected
        it.skip("should fail with HOOK_NOT_FOUND when attempting to delete already deleted hook", async function () {
            const { accountId, newKey } = await createAccount(env.client);
            expect(accountId).to.not.be.null;

            const evmHook = new EvmHook({
                contractId: testContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .addHookToCreate(hookDetails)
                        .setMaxTransactionFee(new Hbar(10))
                        .freezeWith(env.client)
                        .sign(newKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Then delete the hook
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .addHookToDelete(1)
                        .setMaxTransactionFee(new Hbar(10))
                        .freezeWith(env.client)
                        .sign(newKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // When: AccountUpdateTransaction attempts to delete the same hook again
            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .addHookToDelete(1) // Same ID as previously deleted hook
                            .setMaxTransactionFee(new Hbar(10))
                            .freezeWith(env.client)
                            .sign(newKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                errorOccurred = true;
                errorStatus = error.status;
            }

            expect(errorOccurred).to.be.true;
            expect(errorStatus).to.be.eql(Status.HookNotFound);
        });
    });

    afterAll(async function () {
        await env.close();
    });

    it("should error with invalid auto renew period", async function () {
        const { accountId, newKey: key1 } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        const key2 = PrivateKey.generateED25519();

        let err = false;

        try {
            await (
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .setKey(key2.publicKey)
                            .setAutoRenewPeriod(777600000)
                            .freezeWith(env.client)
                            .sign(key1)
                    ).sign(key2)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.AutorenewDurationNotInRange.toString());
        }

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.client.operatorAccountId)
                .setTransactionId(TransactionId.generate(accountId));
        });

        if (!err) {
            throw new Error("account update did not error");
        }
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("should error with insufficent tx fee when a large expiration time is set", async function () {
        const { accountId, newKey: key1 } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        const key2 = PrivateKey.generateED25519();

        let err = false;

        try {
            await (
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .setKey(key2.publicKey)
                            .setExpirationTime(new Timestamp(Long.MAX, 0))
                            .freezeWith(env.client)
                            .sign(key1)
                    ).sign(key2)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.InsufficientTxFee.toString());
        }

        if (!err) {
            throw new Error("account update did not error");
        }
    });

    it("should error when account ID is not set", async function () {
        let status;

        try {
            await (
                await new AccountUpdateTransaction()
                    .setKey(env.client.operatorPublicKey)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.AccountIdDoesNotExist);
    });

    it("should execute with only account ID", async function () {
        const { accountId, newKey: key1 } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        await (
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.client.operatorAccountId);
        });
    });

    it("should error with invalid signature", async function () {
        const { accountId, newKey: key1 } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        const key2 = PrivateKey.generateED25519();

        let err = false;

        try {
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .setKey(key2.publicKey)
                        .freezeWith(env.client)
                        .sign(key1)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.client.operatorAccountId);
        });

        if (!err) {
            throw new Error("account update did not error");
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
