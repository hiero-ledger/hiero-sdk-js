import {
    ContractId,
    ContractCreateTransaction,
    FileCreateTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv, { Client } from "./client/NodeIntegrationTestEnv.js";

describe("ContractId", function () {
    let client;

    beforeAll(async function () {
        client = Client.forMainnet();
    });

    it("should generate checksum for contract ID", function () {
        const contractId = new ContractId(123);

        expect(contractId.num.toNumber()).to.eql(123);
        expect(contractId.realm.toNumber()).to.eql(0);
        expect(contractId.shard.toNumber()).to.eql(0);

        expect(contractId.toStringWithChecksum(client)).to.be.eql(
            "0.0.123-vfmkw",
        );
    });

    it("should populate contract number from EVM address", async function () {
        // Create a new integration test environment for this test
        const env = await IntegrationTestEnv.new();

        try {
            // Create a simple contract bytecode
            const BYTECODE =
                "6080604052348015600e575f80fd5b50335f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506104a38061005b5f395ff3fe608060405260043610610033575f3560e01c8063607a4427146100375780637065cb4814610053578063893d20e81461007b575b5f80fd5b610051600480360381019061004c919061033c565b6100a5565b005b34801561005e575f80fd5b50610079600480360381019061007491906103a2565b610215565b005b348015610086575f80fd5b5061008f6102b7575b60405161009c91906103dc565b60405180910390f35b3373ffffffffffffffffffffffffffffffffffffffff165f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146100fb575f80fd5b805f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600181908060018154018082558091505060019003905f5260205f20015f9091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505f8173ffffffffffffffffffffffffffffffffffffffff166108fc3490811502906040515f60405180830381858888f19350505050905080610211576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102089061044f565b60405180910390fd5b5050565b805f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600181908060018154018082558091505060019003905f5260205f20015f9091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b5f805f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61030b826102e2565b9050919050565b61031b81610301565b8114610325575f80fd5b50565b5f8135905061033681610312565b92915050565b5f60208284031215610351576103506102de565b5b5f61035e84828501610328565b91505092915050565b5f610371826102e2565b9050919050565b61038181610367565b811461038b575f80fd5b50565b5f8135905061039c81610378565b92915050565b5f602082840312156103b7576103b66102de565b5b5f6103c48482850161038e565b91505092915050565b6103d681610367565b82525050565b5f6020820190506103ef5f8301846103cd565b92915050565b5f82825260208201905092915050565b7f5472616e73666572206661696c656400000000000000000000000000000000005f82015250565b5f610439600f836103f5565b915061044482610405565b602082019050919050565b5f6020820190508181035f8301526104668161042d565b905091905056fea26469706673582212206c46ddb2acdbcc4290e15be83eb90cd0b2ce5bd82b9bfe58a0709c5aec96305564736f6c634300081a0033";

            // Create a file with the contract bytecode
            const { fileId } = await (
                await new FileCreateTransaction()
                    .setContents(BYTECODE)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Create the contract
            const contractId = (
                await (
                    await new ContractCreateTransaction()
                        .setBytecodeFileId(fileId)
                        .setGas(400_000)
                        .execute(env.client)
                ).getReceipt(env.client)
            ).contractId;

            // Wait a bit for the contract to be available on mirror node
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Get the contract's actual EVM address from the mirror node
            const mirrorRestApiBaseUrl = env.client.mirrorRestApiBaseUrl;
            const contractInfoUrl = `${mirrorRestApiBaseUrl}/contracts/${contractId.num.toString()}`;

            const response = await fetch(contractInfoUrl);
            const contractData = await response.json();
            const actualEvmAddress = contractData.evm_address;

            // Create another ContractId from the actual EVM address for testing populateAccountNum
            const idMirror = ContractId.fromEvmAddress(0, 0, actualEvmAddress);

            // Populate the contract number using mirror node
            const populatedContractId = await idMirror.populateAccountNum(
                env.client,
            );

            // Verify that the contract number was populated correctly
            expect(populatedContractId.num.toString()).to.equal(
                contractId.num.toString(),
            );
            expect(populatedContractId.shard.toString()).to.equal(
                contractId.shard.toString(),
            );
            expect(populatedContractId.realm.toString()).to.equal(
                contractId.realm.toString(),
            );
        } finally {
            // Clean up the test environment
            await env.close();
        }
    });

    afterAll(async function () {
        client.close();
    });
});
