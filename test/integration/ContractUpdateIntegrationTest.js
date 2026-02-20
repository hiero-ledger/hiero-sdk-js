import {
    ContractCreateTransaction,
    ContractDeleteTransaction,
    ContractFunctionParameters,
    ContractInfoQuery,
    ContractUpdateTransaction,
    FileCreateTransaction,
    FileDeleteTransaction,
    Hbar,
    Status,
    AccountId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { decode } from "../../src/encoding/hex.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import HookExtensionPoint from "../../src/hooks/HookExtensionPoint.js";
import { EvmHookStorageSlot } from "../../src/hooks/EvmHookStorageUpdate.js";

let smartContractBytecode =
    "608060405234801561001057600080fd5b506040516104d73803806104d78339818101604052602081101561003357600080fd5b810190808051604051939291908464010000000082111561005357600080fd5b90830190602082018581111561006857600080fd5b825164010000000081118282018810171561008257600080fd5b82525081516020918201929091019080838360005b838110156100af578181015183820152602001610097565b50505050905090810190601f1680156100dc5780820380516001836020036101000a031916815260200191505b506040525050600080546001600160a01b0319163317905550805161010890600190602084019061010f565b50506101aa565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061015057805160ff191683800117855561017d565b8280016001018555821561017d579182015b8281111561017d578251825591602001919060010190610162565b5061018992915061018d565b5090565b6101a791905b808211156101895760008155600101610193565b90565b61031e806101b96000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063368b87721461004657806341c0e1b5146100ee578063ce6d41de146100f6575b600080fd5b6100ec6004803603602081101561005c57600080fd5b81019060208101813564010000000081111561007757600080fd5b82018360208201111561008957600080fd5b803590602001918460018302840111640100000000831117156100ab57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610173945050505050565b005b6100ec6101a2565b6100fe6101ba565b6040805160208082528351818301528351919283929083019185019080838360005b83811015610138578181015183820152602001610120565b50505050905090810190601f1680156101655780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6000546001600160a01b0316331461018a5761019f565b805161019d906001906020840190610250565b505b50565b6000546001600160a01b03163314156101b85733ff5b565b60018054604080516020601f600260001961010087891615020190951694909404938401819004810282018101909252828152606093909290918301828280156102455780601f1061021a57610100808354040283529160200191610245565b820191906000526020600020905b81548152906001019060200180831161022857829003601f168201915b505050505090505b90565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061029157805160ff19168380011785556102be565b828001600101855582156102be579182015b828111156102be5782518255916020019190600101906102a3565b506102ca9291506102ce565b5090565b61024d91905b808211156102ca57600081556001016102d456fea264697066735822122084964d4c3f6bc912a9d20e14e449721012d625aa3c8a12de41ae5519752fc89064736f6c63430006000033";

describe("ContractUpdate", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(smartContractBytecode)
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        response = await new ContractCreateTransaction()
            .setAdminKey(operatorKey)
            .setGas(300_000)
            .setConstructorParameters(
                new ContractFunctionParameters().addString("Hello from Hiero."),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        let contract = receipt.contractId;

        let info = await new ContractInfoQuery()
            .setContractId(contract)
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(info.contractId.toString()).to.be.equal(contract.toString());
        expect(info.accountId).to.be.not.null;
        expect(
            info.contractId != null ? info.contractId.toString() : "",
        ).to.be.equal(contract.toString());
        expect(info.adminKey).to.be.not.null;
        expect(
            info.adminKey != null ? info.adminKey.toString() : "",
        ).to.be.equal(operatorKey.toString());
        expect(info.storage.toInt()).to.be.equal(128);
        expect(info.contractMemo).to.be.equal(
            "[e2e::ContractCreateTransaction]",
        );

        await (
            await new ContractUpdateTransaction()
                .setContractId(contract)
                .setContractMemo("[e2e::ContractUpdateTransaction]")
                .execute(env.client)
        ).getReceipt(env.client);

        info = await new ContractInfoQuery()
            .setContractId(contract)
            .setQueryPayment(new Hbar(5))
            .execute(env.client);

        expect(info.contractId.toString()).to.be.equal(contract.toString());
        expect(info.accountId).to.be.not.null;
        expect(
            info.contractId != null ? info.contractId.toString() : "",
        ).to.be.equal(contract.toString());
        expect(info.adminKey).to.be.not.null;
        expect(
            info.adminKey != null ? info.adminKey.toString() : "",
        ).to.be.equal(operatorKey.toString());
        expect(info.storage.toInt()).to.be.equal(128);
        expect(info.contractMemo).to.be.equal(
            "[e2e::ContractUpdateTransaction]",
        );

        await (
            await new ContractDeleteTransaction()
                .setContractId(contract)
                .setTransferAccountId(env.client.operatorAccountId)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error when contract ID is not set", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(smartContractBytecode)
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        response = await new ContractCreateTransaction()
            .setAdminKey(operatorKey)
            .setGas(300_000)
            .setConstructorParameters(
                new ContractFunctionParameters().addString("Hello from Hiero."),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        let contract = receipt.contractId;

        let err = false;

        try {
            await (
                await new ContractUpdateTransaction()
                    .setContractMemo("[e2e::ContractUpdateTransaction]")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidContractId);
        }

        await (
            await new ContractDeleteTransaction()
                .setContractId(contract)
                .setTransferAccountId(env.client.operatorAccountId)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);

        if (!err) {
            throw new Error("contract update did not error");
        }
    });

    it("should update the auto renew account ID to 0.0.0", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let response = await new FileCreateTransaction()
            .setKeys([operatorKey])
            .setContents(smartContractBytecode)
            .execute(env.client);

        let receipt = await response.getReceipt(env.client);

        expect(receipt.fileId).to.not.be.null;
        expect(receipt.fileId != null ? receipt.fileId.num > 0 : false).to.be
            .true;

        const file = receipt.fileId;

        response = await new ContractCreateTransaction()
            .setAdminKey(operatorKey)
            .setGas(300_000)
            .setConstructorParameters(
                new ContractFunctionParameters().addString("Hello from Hiero."),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .setAutoRenewAccountId(env.client.operatorAccountId)
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        let contract = receipt.contractId;

        let info = await new ContractInfoQuery()
            .setContractId(contract)
            .setQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(info.contractId.toString()).to.be.equal(contract.toString());
        expect(info.accountId).to.be.not.null;
        expect(
            info.contractId != null ? info.contractId.toString() : "",
        ).to.be.equal(contract.toString());
        expect(info.adminKey).to.be.not.null;
        expect(
            info.adminKey != null ? info.adminKey.toString() : "",
        ).to.be.equal(operatorKey.toString());
        expect(info.storage.toInt()).to.be.equal(128);
        expect(info.contractMemo).to.be.equal(
            "[e2e::ContractCreateTransaction]",
        );
        expect(info.autoRenewAccountId.toString()).to.be.equal(
            env.client.operatorAccountId.toString(),
        );

        await (
            await new ContractUpdateTransaction()
                .setContractId(contract)
                .setContractMemo("[e2e::ContractUpdateTransaction]")
                .setAutoRenewAccountId(new AccountId(0, 0, 0))
                .execute(env.client)
        ).getReceipt(env.client);

        info = await new ContractInfoQuery()
            .setContractId(contract)
            .setQueryPayment(new Hbar(5))
            .execute(env.client);

        expect(info.contractId.toString()).to.be.equal(contract.toString());
        expect(info.accountId).to.be.not.null;
        expect(
            info.contractId != null ? info.contractId.toString() : "",
        ).to.be.equal(contract.toString());
        expect(info.adminKey).to.be.not.null;
        expect(
            info.adminKey != null ? info.adminKey.toString() : "",
        ).to.be.equal(operatorKey.toString());
        expect(info.storage.toInt()).to.be.equal(128);
        expect(info.contractMemo).to.be.equal(
            "[e2e::ContractUpdateTransaction]",
        );
        expect(info.autoRenewAccountId.toString()).to.be.equal(
            new AccountId(0, 0, 0).toString(),
        );

        await (
            await new ContractDeleteTransaction()
                .setContractId(contract)
                .setTransferAccountId(env.client.operatorAccountId)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new FileDeleteTransaction()
                .setFileId(file)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    describe("ContractUpdate with Hooks", function () {
        let hookContractId;

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

            hookContractId = contractId;
        });

        it("should successfully add a basic EVM hook to contract without hooks", async function () {
            // Given: a contract exists without hooks
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            // When: ContractUpdateTransaction adds a basic EVM hook
            const evmHook = new EvmHook({
                contractId: hookContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);
        });

        it("should fail with HOOK_ID_REPEATED_IN_CREATION_DETAILS when duplicate hook IDs are used", async function () {
            // Given: a ContractUpdateTransaction is configured with duplicate hook IDs
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            const evmHook = new EvmHook({
                contractId: hookContractId,
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
                    await new ContractUpdateTransaction()
                        .setContractId(contract)
                        .addHookToCreate(hookDetails1)
                        .addHookToCreate(hookDetails2)
                        .setMaxTransactionFee(new Hbar(10))
                        .execute(env.client)
                ).getReceipt(env.client);
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
            // Given: a contract exists with a hook
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            const evmHook = new EvmHook({
                contractId: hookContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            // When: ContractUpdateTransaction attempts to add a hook with the same ID
            const duplicateHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1, // Same ID as existing hook
                evmHook: evmHook,
            });

            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await new ContractUpdateTransaction()
                        .setContractId(contract)
                        .addHookToCreate(duplicateHookDetails)
                        .setMaxTransactionFee(new Hbar(10))
                        .execute(env.client)
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
            // Given: a contract exists without hooks
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            // When: ContractUpdateTransaction adds an EVM hook with initial storage updates
            const evmHook = new EvmHook({
                contractId: hookContractId,
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

            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);
        });

        it("should fail with HOOK_ID_IN_USE when attempting to add another hook with same ID", async function () {
            // Given: a contract exists with an existing hook
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            const evmHook = new EvmHook({
                contractId: hookContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await new ContractUpdateTransaction()
                        .setContractId(contract)
                        .addHookToCreate(hookDetails)
                        .setMaxTransactionFee(new Hbar(10))
                        .execute(env.client)
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
            // Given: a contract exists with a hook
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            const evmHook = new EvmHook({
                contractId: hookContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            // When: ContractUpdateTransaction deletes the hook by ID
            const deleteResponse = await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToDelete(1)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            // Then: the hook is successfully removed from the contract
            expect(deleteResponse.status).to.be.eql(Status.Success);
        });

        it("should fail with HOOK_NOT_FOUND when attempting to delete non-existent hook", async function () {
            // Given: a contract exists with hooks
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            const evmHook = new EvmHook({
                contractId: hookContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            // When: ContractUpdateTransaction attempts to delete a hook ID that doesn't exist
            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await new ContractUpdateTransaction()
                        .setContractId(contract)
                        .addHookToDelete(999) // Non-existent hook ID
                        .setMaxTransactionFee(new Hbar(10))
                        .execute(env.client)
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
            // Given: a ContractUpdateTransaction attempts to add and delete hooks with the same ID
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            const evmHook = new EvmHook({
                contractId: hookContractId,
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
                    await new ContractUpdateTransaction()
                        .setContractId(contract)
                        .addHookToCreate(hookDetails)
                        .addHookToDelete(1) // Same ID as the hook being added
                        .setMaxTransactionFee(new Hbar(100))
                        .execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                errorOccurred = true;
                errorStatus = error.status;
            }

            // Then: the transaction fails with HOOK_NOT_FOUND error
            expect(errorOccurred).to.be.true;
            expect(errorStatus).to.be.eql(Status.HookNotFound);

            await (
                await new ContractDeleteTransaction()
                    .setContractId(contract)
                    .setTransferAccountId(env.client.operatorAccountId)
                    .execute(env.client)
            ).getReceipt(env.client);

            await (
                await new FileDeleteTransaction()
                    .setFileId(file)
                    .execute(env.client)
            ).getReceipt(env.client);
        });

        it.skip("should fail with HOOK_NOT_FOUND when attempting to delete already deleted hook", async function () {
            // Given: a contract exists with a hook that has been previously deleted
            const operatorKey = env.operatorKey.publicKey;

            let response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents(smartContractBytecode)
                .execute(env.client);

            let receipt = await response.getReceipt(env.client);
            const file = receipt.fileId;

            response = await new ContractCreateTransaction()
                .setAdminKey(operatorKey)
                .setGas(300_000)
                .setConstructorParameters(
                    new ContractFunctionParameters().addString(
                        "Hello from Hiero.",
                    ),
                )
                .setBytecodeFileId(file)
                .setContractMemo("[e2e::ContractCreateTransaction]")
                .setMaxTransactionFee(new Hbar(10))
                .execute(env.client);

            receipt = await response.getReceipt(env.client);
            let contract = receipt.contractId;

            const evmHook = new EvmHook({
                contractId: hookContractId,
            });

            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            // First, add a hook
            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToCreate(hookDetails)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            // Then delete the hook
            await (
                await new ContractUpdateTransaction()
                    .setContractId(contract)
                    .addHookToDelete(1)
                    .setMaxTransactionFee(new Hbar(10))
                    .execute(env.client)
            ).getReceipt(env.client);

            // When: ContractUpdateTransaction attempts to delete the same hook again
            let errorOccurred = false;
            let errorStatus = null;

            try {
                await (
                    await new ContractUpdateTransaction()
                        .setContractId(contract)
                        .addHookToDelete(1) // Same ID as previously deleted hook
                        .setMaxTransactionFee(new Hbar(10))
                        .execute(env.client)
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
});
