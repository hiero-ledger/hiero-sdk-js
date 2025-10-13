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

    describe("allowance hooks", function () {
        let lambdaContractId;

        beforeAll(async function () {
            // contract bytecode for the hiero hook contract
            // contract is located in test/integration/utils/HieroHookContract.sol
            const bytecode = decode(
                "6080604052348015600e575f5ffd5b506107d18061001c5f395ff3fe608060405260043610610033575f3560e01c8063124d8b301461003757806394112e2f14610067578063bd0dd0b614610097575b5f5ffd5b610051600480360381019061004c91906106f2565b6100c7565b60405161005e9190610782565b60405180910390f35b610081600480360381019061007c91906106f2565b6100d2565b60405161008e9190610782565b60405180910390f35b6100b160048036038101906100ac91906106f2565b6100dd565b6040516100be9190610782565b60405180910390f35b5f6001905092915050565b5f6001905092915050565b5f6001905092915050565b5f604051905090565b5f5ffd5b5f5ffd5b5f5ffd5b5f60a08284031215610112576101116100f9565b5b81905092915050565b5f5ffd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6101658261011f565b810181811067ffffffffffffffff821117156101845761018361012f565b5b80604052505050565b5f6101966100e8565b90506101a2828261015c565b919050565b5f5ffd5b5f5ffd5b5f67ffffffffffffffff8211156101c9576101c861012f565b5b602082029050602081019050919050565b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610207826101de565b9050919050565b610217816101fd565b8114610221575f5ffd5b50565b5f813590506102328161020e565b92915050565b5f8160070b9050919050565b61024d81610238565b8114610257575f5ffd5b50565b5f8135905061026881610244565b92915050565b5f604082840312156102835761028261011b565b5b61028d604061018d565b90505f61029c84828501610224565b5f8301525060206102af8482850161025a565b60208301525092915050565b5f6102cd6102c8846101af565b61018d565b905080838252602082019050604084028301858111156102f0576102ef6101da565b5b835b818110156103195780610305888261026e565b8452602084019350506040810190506102f2565b5050509392505050565b5f82601f830112610337576103366101ab565b5b81356103478482602086016102bb565b91505092915050565b5f67ffffffffffffffff82111561036a5761036961012f565b5b602082029050602081019050919050565b5f67ffffffffffffffff8211156103955761039461012f565b5b602082029050602081019050919050565b5f606082840312156103bb576103ba61011b565b5b6103c5606061018d565b90505f6103d484828501610224565b5f8301525060206103e784828501610224565b60208301525060406103fb8482850161025a565b60408301525092915050565b5f6104196104148461037b565b61018d565b9050808382526020820190506060840283018581111561043c5761043b6101da565b5b835b81811015610465578061045188826103a6565b84526020840193505060608101905061043e565b5050509392505050565b5f82601f830112610483576104826101ab565b5b8135610493848260208601610407565b91505092915050565b5f606082840312156104b1576104b061011b565b5b6104bb606061018d565b90505f6104ca84828501610224565b5f83015250602082013567ffffffffffffffff8111156104ed576104ec6101a7565b5b6104f984828501610323565b602083015250604082013567ffffffffffffffff81111561051d5761051c6101a7565b5b6105298482850161046f565b60408301525092915050565b5f61054761054284610350565b61018d565b9050808382526020820190506020840283018581111561056a576105696101da565b5b835b818110156105b157803567ffffffffffffffff81111561058f5761058e6101ab565b5b80860161059c898261049c565b8552602085019450505060208101905061056c565b5050509392505050565b5f82601f8301126105cf576105ce6101ab565b5b81356105df848260208601610535565b91505092915050565b5f604082840312156105fd576105fc61011b565b5b610607604061018d565b90505f82013567ffffffffffffffff811115610626576106256101a7565b5b61063284828501610323565b5f83015250602082013567ffffffffffffffff811115610655576106546101a7565b5b610661848285016105bb565b60208301525092915050565b5f604082840312156106825761068161011b565b5b61068c604061018d565b90505f82013567ffffffffffffffff8111156106ab576106aa6101a7565b5b6106b7848285016105e8565b5f83015250602082013567ffffffffffffffff8111156106da576106d96101a7565b5b6106e6848285016105e8565b60208301525092915050565b5f5f60408385031215610708576107076100f1565b5b5f83013567ffffffffffffffff811115610725576107246100f5565b5b610731858286016100fd565b925050602083013567ffffffffffffffff811115610752576107516100f5565b5b61075e8582860161066d565b9150509250929050565b5f8115159050919050565b61077c81610768565b82525050565b5f6020820190506107955f830184610773565b9291505056fea26469706673582212207dfe7723f6d6869419b1cb0619758b439da0cf4ffd9520997c40a3946299d4dc64736f6c634300081e0033",
            );
            const receipt = await (
                await new ContractCreateTransaction()
                    .setBytecode(bytecode)
                    .setGas(1_000_000)
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
                hookId: 1,
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
                hookId: Long.fromInt(1),
                call: new EvmHookCall({ gasLimit: 1000000 }),
            });

            const response = await (
                await new TransferTransaction()
                    .addHbarTransferWithHook(
                        accountId,
                        new Hbar(-1),
                        call,
                        HookType.PRE_HOOK,
                    )
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });

        it("should call pre and post allowance hooks around successful transfer", async function () {
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
