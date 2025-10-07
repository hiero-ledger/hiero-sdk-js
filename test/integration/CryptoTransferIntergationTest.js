import { Hbar, Status, TransferTransaction } from "../../src/exports.js";
import Long from "long";
import AccountCreateTransaction from "../../src/account/AccountCreateTransaction.js";
import PrivateKey from "../../src/PrivateKey.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import HookExtensionPoint from "../../src/hooks/HookExtensionPoint.js";
import LambdaEvmHook from "../../src/hooks/LambdaEvmHook.js";
import EvmHookSpec from "../../src/hooks/EvmHookSpec.js";
import HookCall from "../../src/hooks/HookCall.js";
import EvmHookCall from "../../src/hooks/EvmHookCall.js";
import HookType from "../../src/hooks/HookType.js";
import { decode } from "../../src/encoding/hex.js";
import ContractCreateTransaction from "../../src/contract/ContractCreateTransaction.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";

describe("CryptoTransfer", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;

        const { accountId, newKey } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        await (
            await new TransferTransaction()
                .addHbarTransfer(accountId, new Hbar(1))
                .addHbarTransfer(operatorId, new Hbar(-1))
                .execute(env.client)
        ).getReceipt(env.client);

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId);
        });
    });

    it("should error when there is invalid account amounts", async function () {
        const operatorId = env.operatorId;

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction.setInitialBalance(new Hbar(0));
        });

        expect(accountId).to.not.be.null;

        let err = false;

        try {
            await (
                await new TransferTransaction()
                    .addHbarTransfer(accountId, new Hbar(1))
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountAmounts);
        }

        if (!err) {
            throw new Error("Crypto transfer did not error.");
        }
    });

    describe.only("allowance hooks", function () {
        let lambdaContractId;

        beforeAll(async function () {
            const bytecode = decode(
                "6080604052348015600e575f5ffd5b506103da8061001c5f395ff3fe60806040526004361061001d575f3560e01c80630b6c5c0414610021575b5f5ffd5b61003b6004803603810190610036919061021c565b610051565b60405161004891906102ed565b60405180910390f35b5f61016d73ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff16146100c2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100b990610386565b60405180910390fd5b60019050979650505050505050565b5f5ffd5b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610102826100d9565b9050919050565b610112816100f8565b811461011c575f5ffd5b50565b5f8135905061012d81610109565b92915050565b5f819050919050565b61014581610133565b811461014f575f5ffd5b50565b5f813590506101608161013c565b92915050565b5f5ffd5b5f5ffd5b5f5ffd5b5f5f83601f84011261018757610186610166565b5b8235905067ffffffffffffffff8111156101a4576101a361016a565b5b6020830191508360018202830111156101c0576101bf61016e565b5b9250929050565b5f5f83601f8401126101dc576101db610166565b5b8235905067ffffffffffffffff8111156101f9576101f861016a565b5b6020830191508360018202830111156102155761021461016e565b5b9250929050565b5f5f5f5f5f5f5f60a0888a031215610237576102366100d1565b5b5f6102448a828b0161011f565b97505060206102558a828b01610152565b96505060406102668a828b01610152565b955050606088013567ffffffffffffffff811115610287576102866100d5565b5b6102938a828b01610172565b9450945050608088013567ffffffffffffffff8111156102b6576102b56100d5565b5b6102c28a828b016101c7565b925092505092959891949750929550565b5f8115159050919050565b6102e7816102d3565b82525050565b5f6020820190506103005f8301846102de565b92915050565b5f82825260208201905092915050565b7f436f6e74726163742063616e206f6e6c792062652063616c6c656420617320615f8201527f20686f6f6b000000000000000000000000000000000000000000000000000000602082015250565b5f610370602583610306565b915061037b82610316565b604082019050919050565b5f6020820190508181035f83015261039d81610364565b905091905056fea2646970667358221220a8c76458204f8bb9a86f59ec2f0ccb7cbe8ae4dcb65700c4b6ee91a39404083a64736f6c634300081e0033",
            );
            const receipt = await (
                await new ContractCreateTransaction()
                    .setBytecode(bytecode)
                    .setGas(300_000)
                    .execute(env.client)
            ).getReceipt(env.client);
            lambdaContractId = receipt.contractId;
        });

        it("should call pre-transaction allowance hook and approve transfer", async function () {
            const operatorId = env.operatorId;

            // Create account with a pre allowance hook (hookId = 1)
            const key = PrivateKey.generateED25519();
            const lambdaHook = new LambdaEvmHook({
                spec: new EvmHookSpec().setContractId(lambdaContractId),
                storageUpdates: [],
            });
            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hook: lambdaHook,
                hookId: 2,
            });

            const createResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key.publicKey)
                    .setInitialBalance(new Hbar(2))
                    .addHook(hookDetails)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);
            const { accountId } = await createResp.getReceipt(env.client);

            const call = new HookCall({
                hookId: Long.fromInt(2),
                call: new EvmHookCall({ gasLimit: 200000 }),
            });

            const response = await (
                await new TransferTransaction()
                    .addHbarTransferWithHook(
                        accountId,
                        new Hbar(-1),
                        call,
                        HookType.PRE_HOOK_SENDER,
                    )
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });

        it.skip("should call pre and post allowance hooks around successful transfer", async function () {
            const operatorId = env.operatorId;

            // Create account with a pre/post allowance hook (hookId = 1)
            const key = PrivateKey.generateED25519();
            const lambdaHook = new LambdaEvmHook({
                spec: new EvmHookSpec().setContractId(lambdaContractId),
            });
            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hook: lambdaHook,
                hookId: 2,
            });

            const createResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key.publicKey)
                    .setInitialBalance(new Hbar(2))
                    .addHook(hookDetails)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);
            const { accountId } = await createResp.getReceipt(env.client);

            const call = new HookCall({
                hookId: Long.fromInt(2),
                call: new EvmHookCall({ gasLimit: 500000 }),
            });

            // Execute transfer with pre/post hook on sender
            const response = await (
                await new TransferTransaction()
                    .addHbarTransferWithHook(
                        accountId,
                        new Hbar(-1),
                        call,
                        HookType.PRE_POST_HOOK_SENDER,
                    )
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });
    });

    afterAll(async function () {
        await env.close();
    });
});
