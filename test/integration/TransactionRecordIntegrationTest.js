import {
    FileCreateTransaction,
    ContractCreateTransaction,
    FileAppendTransaction,
    ContractExecuteTransaction,
    ContractFunctionParameters,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TransactionRecord", function () {
    let env;
    const contractByteCode =
        "0x608060405234801561001057600080fd5b50610594806100206000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c8063368b87721461006757806353f2a8a31461009057806380acb9e6146100b1578063ce6d41de146100c4578063e21f37ce146100cc578063f7753390146100d4575b600080fd5b61007a610075366004610406565b6100dc565b60405161008791906104ba565b60405180910390f35b6100a361009e3660046104a2565b610112565b604051908152602001610087565b61007a6100bf366004610441565b610177565b61007a6101c2565b61007a610254565b61007a6102e2565b80516060906100f29060009060208501906102ef565b50506040805180820190915260028152614f4b60f01b6020820152919050565b6000606482116101735760405162461bcd60e51b815260206004820152602260248201527f546865206e756d62657220697320736d616c6c6572207468616e2068756e6472604482015261195960f21b606482015260840160405180910390fd5b5090565b815160609061018d9060009060208601906102ef565b5081516101a19060019060208501906102ef565b50506040805180820190915260028152614f4b60f01b602082015292915050565b6060600080546101d19061050d565b80601f01602080910402602001604051908101604052809291908181526020018280546101fd9061050d565b801561024a5780601f1061021f5761010080835404028352916020019161024a565b820191906000526020600020905b81548152906001019060200180831161022d57829003601f168201915b5050505050905090565b600080546102619061050d565b80601f016020809104026020016040519081016040528092919081815260200182805461028d9061050d565b80156102da5780601f106102af576101008083540402835291602001916102da565b820191906000526020600020905b8154815290600101906020018083116102bd57829003601f168201915b505050505081565b600180546102619061050d565b8280546102fb9061050d565b90600052602060002090601f01602090048101928261031d5760008555610363565b82601f1061033657805160ff1916838001178555610363565b82800160010185558215610363579182015b82811115610363578251825591602001919060010190610348565b506101739291505b80821115610173576000815560010161036b565b600082601f83011261038f578081fd5b813567ffffffffffffffff808211156103aa576103aa610548565b604051601f8301601f19908116603f011681019082821181831017156103d2576103d2610548565b816040528381528660208588010111156103ea578485fd5b8360208701602083013792830160200193909352509392505050565b600060208284031215610417578081fd5b813567ffffffffffffffff81111561042d578182fd5b6104398482850161037f565b949350505050565b60008060408385031215610453578081fd5b823567ffffffffffffffff8082111561046a578283fd5b6104768683870161037f565b9350602085013591508082111561048b578283fd5b506104988582860161037f565b9150509250929050565b6000602082840312156104b3578081fd5b5035919050565b6000602080835283518082850152825b818110156104e6578581018301518582016040015282016104ca565b818111156104f75783604083870101525b50601f01601f1916929092016040019392505050565b600181811c9082168061052157607f821691505b6020821081141561054257634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052604160045260246000fdfea26469706673582212206369861146f0c706a48e951145ffca721f1fe7e98b0fb535d02d2e0b4195be0664736f6c63430008040033";

    beforeAll(async function () {
        env = await IntegrationTestEnv.new({ throwaway: true });
    });

    it("should return the verbose record log when a transaction failed", async function () {
        const privateKey = env.operatorKey;

        // Create a file on Hedera and store the bytecode
        const fileCreateTx = new FileCreateTransaction()
            .setKeys([privateKey])
            .freezeWith(env.client);
        const fileCreateSign = await fileCreateTx.sign(privateKey);
        const fileCreateSubmit = await fileCreateSign.execute(env.client);
        const fileCreateRx = await fileCreateSubmit.getReceipt(env.client);
        const bytecodeFileId = fileCreateRx.fileId;
        console.log(`- The bytecode file ID is: ${bytecodeFileId} \n`);

        //Append contents to the file
        const fileAppendTx = new FileAppendTransaction()
            .setFileId(bytecodeFileId)
            .setContents(contractByteCode)
            .setMaxChunks(10)
            .freezeWith(env.client);
        const fileAppendSign = await fileAppendTx.sign(privateKey);
        const fileAppendSubmit = await fileAppendSign.execute(env.client);
        const fileAppendRx = await fileAppendSubmit.getReceipt(env.client);
        console.log("Status of file append is", fileAppendRx.status.toString());

        // Instantiate the contract instance
        const contractTx = await new ContractCreateTransaction()
            //Set the file ID of the Hedera file storing the bytecode
            .setBytecodeFileId(bytecodeFileId)
            //Set the gas to instantiate the contract
            .setGas(400_000)
            //Provide the constructor parameters for the contract
            .setConstructorParameters();

        //Submit the transaction to the Hedera test network
        const contractResponse = await contractTx.execute(env.client);

        //Get the receipt of the file create transaction
        const contractReceipt = await contractResponse.getReceipt(env.client);

        //Get the smart contract ID
        const newContractId = contractReceipt.contractId;

        //Log the smart contract ID
        console.log("The smart contract ID is " + newContractId);

        const contractExecuteTx = new ContractExecuteTransaction()
            .setContractId(newContractId)
            .setGas(750000)
            .setFunction(
                "setDataRequire",
                new ContractFunctionParameters().addUint256(10),
            )
            .freezeWith(env.client);

        try {
            const signedTx = await contractExecuteTx.sign(privateKey);
            const contractExecuteSubmit = await signedTx.execute(env.client);

            // Get transaction record information
            await contractExecuteSubmit.getVerboseRecord(env.client);
        } catch (err) {
            expect(err.transactionRecord.transactionFee).not.to.be.null;
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
