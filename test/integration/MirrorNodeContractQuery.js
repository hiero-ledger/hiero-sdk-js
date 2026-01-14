// Cross-environment sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

import {
    MirrorNodeContractCallQuery,
    ContractCreateTransaction,
    FileCreateTransaction,
    ContractFunctionParameters,
    MirrorNodeContractEstimateQuery,
    ContractId,
    Hbar,
    ContractExecuteTransaction,
    ContractCallQuery,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount } from "./utils/Fixtures.js";

describe("MirrorNodeContractQuery", function () {
    let env, contractId;
    const ADDRESS = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();

        const BYTECODE =
            "6080604052348015600e575f80fd5b50335f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506104a38061005b5f395ff3fe608060405260043610610033575f3560e01c8063607a4427146100375780637065cb4814610053578063893d20e81461007b575b5f80fd5b610051600480360381019061004c919061033c565b6100a5565b005b34801561005e575f80fd5b50610079600480360381019061007491906103a2565b610215565b005b348015610086575f80fd5b5061008f6102b7565b60405161009c91906103dc565b60405180910390f35b3373ffffffffffffffffffffffffffffffffffffffff165f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146100fb575f80fd5b805f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600181908060018154018082558091505060019003905f5260205f20015f9091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505f8173ffffffffffffffffffffffffffffffffffffffff166108fc3490811502906040515f60405180830381858888f19350505050905080610211576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102089061044f565b60405180910390fd5b5050565b805f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600181908060018154018082558091505060019003905f5260205f20015f9091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b5f805f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61030b826102e2565b9050919050565b61031b81610301565b8114610325575f80fd5b50565b5f8135905061033681610312565b92915050565b5f60208284031215610351576103506102de565b5b5f61035e84828501610328565b91505092915050565b5f610371826102e2565b9050919050565b61038181610367565b811461038b575f80fd5b50565b5f8135905061039c81610378565b92915050565b5f602082840312156103b7576103b66102de565b5b5f6103c48482850161038e565b91505092915050565b6103d681610367565b82525050565b5f6020820190506103ef5f8301846103cd565b92915050565b5f82825260208201905092915050565b7f5472616e73666572206661696c656400000000000000000000000000000000005f82015250565b5f610439600f836103f5565b915061044482610405565b602082019050919050565b5f6020820190508181035f8301526104668161042d565b905091905056fea26469706673582212206c46ddb2acdbcc4290e15be83eb90cd0b2ce5bd82b9bfe58a0709c5aec96305564736f6c634300081a0033";
        const { fileId } = await (
            await new FileCreateTransaction()
                .setContents(BYTECODE)
                .execute(env.client)
        ).getReceipt(env.client);

        contractId = (
            await (
                await new ContractCreateTransaction()
                    .setBytecodeFileId(fileId)
                    .setGas(400_000)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).contractId;

        await sleep(5000);
    });

    it("should get contract owner", async function () {
        const gas = await new MirrorNodeContractEstimateQuery()
            .setContractId(contractId)
            .setFunction("getOwner")
            .execute(env.client);

        expect(gas).to.be.gt(0);

        const result = await new MirrorNodeContractCallQuery()
            .setContractId(contractId)
            .setBlockNumber("latest")
            .setFunction("getOwner")
            .setGasLimit(gas)
            .execute(env.client);
        expect(result).to.not.be.null;
        const ownerMirrorNode = result.substring(26);

        const resultNode = await new ContractCallQuery()
            .setContractId(contractId)
            .setGas(gas)
            .setFunction("getOwner")
            .execute(env.client);
        const ownerConsensusNode = resultNode.getAddress(0);

        expect(ownerMirrorNode).to.equal(ownerConsensusNode);
    });

    it("should return default gas when contract is not deployed", async function () {
        const NON_EXISTING_CONTRACT = new ContractId(12341234);
        const DEFAULT_GAS = 22892;

        const gasUsed = await new MirrorNodeContractEstimateQuery()
            .setContractId(NON_EXISTING_CONTRACT)
            .setFunction("getOwner")
            .execute(env.client);

        expect(gasUsed).to.equal(DEFAULT_GAS);
    });

    it("should fail when gas limit is too low", async function () {
        const LOW_GAS = 100;
        let err = false;
        try {
            await new MirrorNodeContractCallQuery()
                .setContractId(contractId)
                .setGasLimit(LOW_GAS)
                .setFunction("getOwner")
                .execute(env.client);
        } catch (e) {
            err = true;
        }
        expect(err).to.be.true;
    });

    it("should fail when sender is not sent", async function () {
        const LOW_GAS = 100;
        let err = false;

        try {
            await new MirrorNodeContractEstimateQuery()
                .setContractId(contractId)
                .setFunction(
                    "addOwnerAndTransfer",
                    new ContractFunctionParameters().addAddress(ADDRESS),
                )
                .execute(env.client);
        } catch (e) {
            err = true;
        }
        expect(err).to.be.true;
        err = false;

        try {
            await new MirrorNodeContractCallQuery()
                .setGasLimit(LOW_GAS)
                .setContractId(contractId)
                .setFunction(
                    "addOwnerAndTransfer",
                    new ContractFunctionParameters().addAddress(ADDRESS),
                )
                .execute(env.client);
        } catch (e) {
            err = true;
        }
        expect(err).to.be.true;
    });

    it("should simulate when sender is set", async function () {
        const owner = (
            await new MirrorNodeContractCallQuery()
                .setContractId(contractId)
                .setFunction("getOwner")
                .execute(env.client)
        ).substring(26);

        const { accountId } = await createAccount(env.client);

        const newOwnerEvmAddress = accountId.toEvmAddress();

        await sleep(3000);

        const gas = await new MirrorNodeContractEstimateQuery()
            .setContractId(contractId)
            .setFunction(
                "addOwnerAndTransfer",
                new ContractFunctionParameters().addAddress(newOwnerEvmAddress),
            )
            .setSenderEvmAddress(owner)
            .execute(env.client);

        await new ContractExecuteTransaction()
            .setContractId(contractId)
            .setFunction(
                "addOwnerAndTransfer",
                new ContractFunctionParameters().addAddress(newOwnerEvmAddress),
            )
            .setGas(gas)
            .setPayableAmount(new Hbar(1))
            .execute(env.client);
    });
});
