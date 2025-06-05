import {
    ContractCreateTransaction,
    ContractDeleteTransaction,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    FileCreateTransaction,
    FileDeleteTransaction,
    Hbar,
    HbarUnit,
    Status,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount } from "./utils/Fixtures.js";

let smartContractBytecode =
    "608060405234801561001057600080fd5b506040516104d73803806104d78339818101604052602081101561003357600080fd5b810190808051604051939291908464010000000082111561005357600080fd5b90830190602082018581111561006857600080fd5b825164010000000081118282018810171561008257600080fd5b82525081516020918201929091019080838360005b838110156100af578181015183820152602001610097565b50505050905090810190601f1680156100dc5780820380516001836020036101000a031916815260200191505b506040525050600080546001600160a01b0319163317905550805161010890600190602084019061010f565b50506101aa565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061015057805160ff191683800117855561017d565b8280016001018555821561017d579182015b8281111561017d578251825591602001919060010190610162565b5061018992915061018d565b5090565b6101a791905b808211156101895760008155600101610193565b90565b61031e806101b96000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063368b87721461004657806341c0e1b5146100ee578063ce6d41de146100f6575b600080fd5b6100ec6004803603602081101561005c57600080fd5b81019060208101813564010000000081111561007757600080fd5b82018360208201111561008957600080fd5b803590602001918460018302840111640100000000831117156100ab57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610173945050505050565b005b6100ec6101a2565b6100fe6101ba565b6040805160208082528351818301528351919283929083019185019080838360005b83811015610138578181015183820152602001610120565b50505050905090810190601f1680156101655780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6000546001600160a01b0316331461018a5761019f565b805161019d906001906020840190610250565b505b50565b6000546001600160a01b03163314156101b85733ff5b565b60018054604080516020601f600260001961010087891615020190951694909404938401819004810282018101909252828152606093909290918301828280156102455780601f1061021a57610100808354040283529160200191610245565b820191906000526020600020905b81548152906001019060200180831161022857829003601f168201915b505050505090505b90565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061029157805160ff19168380011785556102be565b828001600101855582156102be579182015b828111156102be5782518255916020019190600101906102a3565b506102ca9291506102ce565b5090565b61024d91905b808211156102ca57600081556001016102d456fea264697066735822122084964d4c3f6bc912a9d20e14e449721012d625aa3c8a12de41ae5519752fc89064736f6c63430006000033";

describe("ContractExecute", function () {
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
                new ContractFunctionParameters().addString(
                    "Hello from Hedera.",
                ),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        const contract = receipt.contractId;

        await (
            await new ContractExecuteTransaction()
                .setContractId(contract)
                .setGas(100000)
                .setFunction(
                    "setMessage",
                    new ContractFunctionParameters().addString("new message"),
                )
                .execute(env.client)
        ).getReceipt(env.client);

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
                new ContractFunctionParameters().addString(
                    "Hello from Hedera.",
                ),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        const contract = receipt.contractId;

        let err = false;

        try {
            await (
                await new ContractExecuteTransaction()
                    .setGas(100000)
                    .setFunction(
                        "setMessage",
                        new ContractFunctionParameters().addString(
                            "new message",
                        ),
                    )
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
            throw new Error("contract execution did not error");
        }
    });

    it("should error when function is not set", async function () {
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
                new ContractFunctionParameters().addString(
                    "Hello from Hedera.",
                ),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        const contract = receipt.contractId;

        let err = false;

        try {
            await (
                await new ContractExecuteTransaction()
                    .setContractId(contract)
                    .setGas(100000)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.ContractRevertExecuted);
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
            throw new Error("contract execution did not error");
        }
    });

    it("should error when gas is not set", async function () {
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
                new ContractFunctionParameters().addString(
                    "Hello from Hedera.",
                ),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        const contract = receipt.contractId;

        let err = false;

        try {
            await (
                await new ContractExecuteTransaction()
                    .setContractId(contract)
                    .setFunction(
                        "setMessage",
                        new ContractFunctionParameters().addString(
                            "new message",
                        ),
                    )
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InsufficientGas);
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
            throw new Error("contract execution did not error");
        }
    });

    it("should error when function's parameter are not set", async function () {
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
                new ContractFunctionParameters().addString(
                    "Hello from Hedera.",
                ),
            )
            .setBytecodeFileId(file)
            .setContractMemo("[e2e::ContractCreateTransaction]")
            .execute(env.client);

        receipt = await response.getReceipt(env.client);

        expect(receipt.contractId).to.not.be.null;
        expect(receipt.contractId != null ? receipt.contractId.num > 0 : false)
            .to.be.true;

        const contract = receipt.contractId;

        let err = false;

        try {
            await (
                await new ContractExecuteTransaction()
                    .setContractId(contract)
                    .setGas(100000)
                    .setFunction("setMessage")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.ContractRevertExecuted);
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
            throw new Error("contract execution did not error");
        }
    });

    it("should execute with payable amount", async function () {
        const BYTECODE =
            "6080604052348015600e575f80fd5b50335f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506104a38061005b5f395ff3fe608060405260043610610033575f3560e01c8063607a4427146100375780637065cb4814610053578063893d20e81461007b575b5f80fd5b610051600480360381019061004c919061033c565b6100a5565b005b34801561005e575f80fd5b50610079600480360381019061007491906103a2565b610215565b005b348015610086575f80fd5b5061008f6102b7565b60405161009c91906103dc565b60405180910390f35b3373ffffffffffffffffffffffffffffffffffffffff165f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146100fb575f80fd5b805f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600181908060018154018082558091505060019003905f5260205f20015f9091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505f8173ffffffffffffffffffffffffffffffffffffffff166108fc3490811502906040515f60405180830381858888f19350505050905080610211576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102089061044f565b60405180910390fd5b5050565b805f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600181908060018154018082558091505060019003905f5260205f20015f9091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b5f805f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61030b826102e2565b9050919050565b61031b81610301565b8114610325575f80fd5b50565b5f8135905061033681610312565b92915050565b5f60208284031215610351576103506102de565b5b5f61035e84828501610328565b91505092915050565b5f610371826102e2565b9050919050565b61038181610367565b811461038b575f80fd5b50565b5f8135905061039c81610378565b92915050565b5f602082840312156103b7576103b66102de565b5b5f6103c48482850161038e565b91505092915050565b6103d681610367565b82525050565b5f6020820190506103ef5f8301846103cd565b92915050565b5f82825260208201905092915050565b7f5472616e73666572206661696c656400000000000000000000000000000000005f82015250565b5f610439600f836103f5565b915061044482610405565b602082019050919050565b5f6020820190508181035f8301526104668161042d565b905091905056fea26469706673582212206c46ddb2acdbcc4290e15be83eb90cd0b2ce5bd82b9bfe58a0709c5aec96305564736f6c634300081a0033";
        const { fileId } = await (
            await new FileCreateTransaction()
                .setContents(BYTECODE)
                .execute(env.client)
        ).getReceipt(env.client);

        const { accountId } = await createAccount(env.client);

        const newOwnerSolidityAddress = accountId.toSolidityAddress();

        const contractId = (
            await (
                await new ContractCreateTransaction()
                    .setBytecodeFileId(fileId)
                    .setGas(400_000)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).contractId;

        await new ContractExecuteTransaction()
            .setContractId(contractId)
            .setFunction(
                "addOwnerAndTransfer",
                new ContractFunctionParameters().addAddress(
                    newOwnerSolidityAddress,
                ),
            )
            .setGas(60_000)
            .setPayableAmount(new Hbar(100), HbarUnit.Kilobar)
            .execute(env.client);
    });

    afterAll(async function () {
        await env.close();
    });
});
