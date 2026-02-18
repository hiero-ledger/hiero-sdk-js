import {
    AccountCreateTransaction,
    Hbar,
    PrivateKey,
    Status,
} from "../../src/exports.js";
import Long from "long";
import HookStoreTransaction from "../../src/hooks/HookStoreTransaction.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import HookExtensionPoint from "../../src/hooks/HookExtensionPoint.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import { EvmHookStorageSlot } from "../../src/hooks/EvmHookStorageUpdate.js";
import HookId from "../../src/hooks/HookId.js";
import HookEntityId from "../../src/hooks/HookEntityId.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

import { decode } from "../../src/encoding/hex.js";
import ContractCreateTransaction from "../../src/contract/ContractCreateTransaction.js";

describe("HookStore", function () {
    let env;
    let accountWithHook;
    let accountKey;
    let hookId;
    let contractId;
    let transactionHookId;

    const HOOK_BYTECODE = decode(
        "6080604052348015600e575f5ffd5b506103da8061001c5f395ff3fe60806040526004361061001d575f3560e01c80630b6c5c0414610021575b5f5ffd5b61003b6004803603810190610036919061021c565b610051565b60405161004891906102ed565b60405180910390f35b5f61016d73ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff16146100c2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100b990610386565b60405180910390fd5b60019050979650505050505050565b5f5ffd5b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610102826100d9565b9050919050565b610112816100f8565b811461011c575f5ffd5b50565b5f8135905061012d81610109565b92915050565b5f819050919050565b61014581610133565b811461014f575f5ffd5b50565b5f813590506101608161013c565b92915050565b5f5ffd5b5f5ffd5b5f5ffd5b5f5f83601f84011261018757610186610166565b5b8235905067ffffffffffffffff8111156101a4576101a361016a565b5b6020830191508360018202830111156101c0576101bf61016e565b5b9250929050565b5f5f83601f8401126101dc576101db610166565b5b8235905067ffffffffffffffff8111156101f9576101f861016a565b5b6020830191508360018202830111156102155761021461016e565b5b9250929050565b5f5f5f5f5f5f5f60a0888a031215610237576102366100d1565b5b5f6102448a828b0161011f565b97505060206102558a828b01610152565b96505060406102668a828b01610152565b955050606088013567ffffffffffffffff811115610287576102866100d5565b5b6102938a828b01610172565b9450945050608088013567ffffffffffffffff8111156102b6576102b56100d5565b5b6102c28a828b016101c7565b925092505092959891949750929550565b5f8115159050919050565b6102e7816102d3565b82525050565b5f6020820190506103005f8301846102de565b92915050565b5f82825260208201905092915050565b7f436f6e74726163742063616e206f6e6c792062652063616c6c656420617320615f8201527f20686f6f6b000000000000000000000000000000000000000000000000000000602082015250565b5f610370602583610306565b915061037b82610316565b604082019050919050565b5f6020820190508181035f83015261039d81610364565b905091905056fea2646970667358221220a8c76458204f8bb9a86f59ec2f0ccb7cbe8ae4dcb65700c4b6ee91a39404083a64736f6c634300081e0033",
    );

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    beforeEach(async function () {
        // Create contract for hook
        const contractCreate = await (
            await new ContractCreateTransaction()
                .setBytecode(HOOK_BYTECODE)
                .setGas(300_000)
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client)
        ).getReceipt(env.client);
        contractId = contractCreate.contractId;

        // Initialize hook ID
        hookId = Long.fromInt(1);

        // Create account key
        accountKey = PrivateKey.generateED25519();

        // Create initial storage slot
        const storageSlot = new EvmHookStorageSlot({
            key: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
            value: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
        });

        // Create EVM hook with storage
        const evmHook = new EvmHook({
            contractId: contractId,
            storageUpdates: [storageSlot],
        });

        const hookDetails = new HookCreationDetails({
            extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            evmHook: evmHook,
            hookId: hookId,
        });

        // Create account with the hook
        const tx = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(accountKey.publicKey)
                .setInitialBalance(new Hbar(1))
                .addHook(hookDetails)
                .setMaxTransactionFee(new Hbar(10))
                .freezeWith(env.client)
                .sign(accountKey)
        ).execute(env.client);

        const accountCreateReceipt = await tx.getReceipt(env.client);
        accountWithHook = accountCreateReceipt.accountId;

        // Create transaction hook ID for reuse
        transactionHookId = new HookId({
            entityId: new HookEntityId({
                accountId: accountWithHook,
            }),
            hookId: hookId,
        });
    });

    it("should update storage slots with valid signatures", async function () {
        // Create new storage updates
        const newStorageSlot = new EvmHookStorageSlot({
            key: new Uint8Array([0x09, 0x0a, 0x0b, 0x0c]),
            value: new Uint8Array([0x0d, 0x0e, 0x0f, 0x10]),
        });

        // When: HookStoreTransaction updates storage slots with valid signatures
        const response = await (
            await new HookStoreTransaction()
                .setHookId(transactionHookId)
                .setStorageUpdates([newStorageSlot])
                .freezeWith(env.client)
                .sign(accountKey)
        ).execute(env.client);

        const receipt = await response.getReceipt(env.client);

        // Then: the storage is updated successfully
        expect(receipt.status).toEqual(Status.Success);
    });

    it("should fail with TOO_MANY_LAMBDA_STORAGE_UPDATES when updating more than 256 storage slots", async function () {
        // Create a storage slot
        const storageSlot = new EvmHookStorageSlot({
            key: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
            value: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
        });

        let error;
        try {
            await (
                await (
                    await new HookStoreTransaction()
                        .setHookId(transactionHookId)
                        .setMaxTransactionFee(new Hbar(100))
                        .setStorageUpdates(Array(256).fill(storageSlot))
                        .freezeWith(env.client)
                        .sign(accountKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (err) {
            error = err.status
                .toString()
                .includes(Status.TooManyLambdaStorageUpdates.toString());
        }

        expect(error).toBe(true);
    });

    it("should fail with INVALID_SIGNATURE when signed without proper key", async function () {
        const storageSlot = new EvmHookStorageSlot({
            key: new Uint8Array([0x31, 0x32, 0x33, 0x34]),
            value: new Uint8Array([0x35, 0x36, 0x37, 0x38]),
        });

        const invalidKey = PrivateKey.generateED25519();

        let error = false;
        try {
            await (
                await (
                    await new HookStoreTransaction()
                        .setHookId(transactionHookId)
                        .setStorageUpdates([storageSlot])
                        .freezeWith(env.client)
                        .sign(invalidKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (err) {
            error = err.status
                .toString()
                .includes(Status.InvalidSignature.toString());
        }

        expect(error).toBe(true);
    });

    it("should fail with HOOK_NOT_FOUND when using a non-existent hook id", async function () {
        const storageSlot = new EvmHookStorageSlot({
            key: new Uint8Array([0x41, 0x42, 0x43, 0x44]),
            value: new Uint8Array([0x45, 0x46, 0x47, 0x48]),
        });

        // Use a hook id that does not exist
        const nonExistentHookId = new HookId({
            entityId: new HookEntityId({
                accountId: accountWithHook,
            }),
            hookId: Long.fromInt(999),
        });

        let error;
        try {
            await (
                await (
                    await new HookStoreTransaction()
                        .setHookId(nonExistentHookId)
                        .setStorageUpdates([storageSlot])
                        .freezeWith(env.client)
                        .sign(accountKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (err) {
            error = err.status
                .toString()
                .includes(Status.HookNotFound.toString());
        }

        expect(error).toBe(true);
    });

    afterAll(async function () {
        await env.close();
    });
});
