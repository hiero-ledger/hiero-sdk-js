import {
    AccountAllowanceApproveTransaction,
    Hbar,
    Status,
    TransactionId,
    TokenAssociateTransaction,
    FileCreateTransaction,
    FileAppendTransaction,
    ContractCreateTransaction,
    TransferTransaction,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    TransactionRecordQuery,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, createFungibleToken } from "./utils/Fixtures.js";

let smartContractBytecode =
    "0x608060405234801561001057600080fd5b5061050e806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806315dacbea1461004e578063a983361a14610076578063e1f21c6714610089578063e7092b411461009c575b005b61006161005c3660046103db565b6100bd565b60405190151581526020015b60405180910390f35b61004c6100843660046103db565b61016e565b610061610097366004610425565b610248565b6100af6100aa366004610399565b6102f0565b60405190815260200161006d565b604080516001600160a01b0385811660248301528481166044830152606480830185905283518084039091018152608490920183526020820180516001600160e01b03166323b872dd60e01b1790529151600092839290881691610121919061049f565b600060405180830381855af49150503d806000811461015c576040519150601f19603f3d011682016040523d82523d6000602084013e610161565b606091505b5090979650505050505050565b6040516323b872dd60e01b81526001600160a01b038481166004830152838116602483015260448201839052600091908616906323b872dd90606401602060405180830381600087803b1580156101c457600080fd5b505af11580156101d8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101fc9190610460565b9050806102415760405162461bcd60e51b815260206004820152600f60248201526e151c985b9cd9995c8811985a5b1959608a1b604482015260640160405180910390fd5b5050505050565b604080516001600160a01b038481166024830152604480830185905283518084039091018152606490920183526020820180516001600160e01b031663095ea7b360e01b17905291516000928392908716916102a4919061049f565b600060405180830381855af49150503d80600081146102df576040519150601f19603f3d011682016040523d82523d6000602084013e6102e4565b606091505b50909695505050505050565b604051636eb1769f60e11b81526001600160a01b03838116600483015282811660248301526000919085169063dd62ed3e9060440160206040518083038186803b15801561033d57600080fd5b505afa158015610351573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103759190610487565b949350505050565b80356001600160a01b038116811461039457600080fd5b919050565b6000806000606084860312156103ad578283fd5b6103b68461037d565b92506103c46020850161037d565b91506103d26040850161037d565b90509250925092565b600080600080608085870312156103f0578081fd5b6103f98561037d565b93506104076020860161037d565b92506104156040860161037d565b9396929550929360600135925050565b600080600060608486031215610439578283fd5b6104428461037d565b92506104506020850161037d565b9150604084013590509250925092565b600060208284031215610471578081fd5b81518015158114610480578182fd5b9392505050565b600060208284031215610498578081fd5b5051919050565b60008251815b818110156104bf57602081860181015185830152016104a5565b818111156104cd5782828501525b50919091019291505056fea2646970667358221220231931d69934dec3bcbd24b8ab4267e454b799a4d72f33d2ebc42c9f42ce374964736f6c63430008040033";

describe("TokenAllowances", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("Cannot transfer on behalf of `spender` account without allowance approval", async function () {
        let status;
        const { accountId: spenderAccountId, newKey: spenderKey } =
            await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(2));
            });

        const { accountId: receiverAccountId } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setInitialBalance(new Hbar(2));
            },
        );

        const tokenId = await createFungibleToken(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([tokenId])
                    .setAccountId(spenderAccountId)
                    .freezeWith(env.client)
                    .sign(spenderKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const onBehalfOfTransactionId =
            TransactionId.generate(spenderAccountId);
        try {
            await (
                await (
                    await new TransferTransaction()
                        .addApprovedTokenTransfer(tokenId, spenderAccountId, -1)
                        .addApprovedTokenTransfer(tokenId, receiverAccountId, 1)
                        .setTransactionId(onBehalfOfTransactionId)
                        .freezeWith(env.client)
                        .sign(spenderKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.TokenNotAssociatedToAccount);
    });

    it("Can transfer on behalf of `spender` account with allowance approval", async function () {
        const { accountId: spenderAccountId, newKey: spenderKey } =
            await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(2));
            });

        const { accountId: receiverAccountId, newKey: receiverKey } =
            await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(2));
            });

        const tokenId = await createFungibleToken(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([tokenId])
                    .setAccountId(receiverAccountId)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        // Give `spender` allowance for Token
        const receiverApproveTx =
            new AccountAllowanceApproveTransaction().approveTokenAllowance(
                tokenId,
                env.operatorId,
                spenderAccountId,
                100,
            );

        const approveRx = await receiverApproveTx.execute(env.client);

        const approveReceipt = await approveRx.getReceipt(env.client);
        console.log(
            `Approve spender allowance - status: ${approveReceipt.status}`,
        );

        let err = false;
        const onBehalfOfTransactionId =
            TransactionId.generate(spenderAccountId);
        try {
            await (
                await (
                    await new TransferTransaction()
                        .addApprovedTokenTransfer(tokenId, spenderAccountId, -1)
                        .addApprovedTokenTransfer(tokenId, receiverAccountId, 1)
                        .setTransactionId(onBehalfOfTransactionId)
                        .freezeWith(env.client)
                        .sign(spenderKey)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.SpenderDoesNotHaveAllowance);
        }

        expect(err).to.be.true;
    });

    it("Can set `spender` account to be ContractId instead of AccountId", async function () {
        const { accountId: receiverAccountId, newKey: receiverKey } =
            await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(2));
            });

        const tokenId = await createFungibleToken(env.client);

        // Create a file on Hedera and store the bytecode
        const fileCreateTx = new FileCreateTransaction()
            .setKeys([env.operatorKey])
            .freezeWith(env.client);
        const fileCreateSign = await fileCreateTx.sign(env.operatorKey);
        const fileCreateSubmit = await fileCreateSign.execute(env.client);
        const fileCreateRx = await fileCreateSubmit.getReceipt(env.client);
        const bytecodeFileId = fileCreateRx.fileId;

        //Append contents to the file

        const fileAppendTx = new FileAppendTransaction()
            .setFileId(bytecodeFileId)
            .setContents(smartContractBytecode)
            .setMaxChunks(10)
            .freezeWith(env.client);
        const fileAppendSign = await fileAppendTx.sign(env.operatorKey);
        const fileAppendSubmit = await fileAppendSign.execute(env.client);
        const fileAppendRx = await fileAppendSubmit.getReceipt(env.client);
        console.log("Status of file append is", fileAppendRx.status.toString());

        // Instantiate the contract instance
        const contractTx = await new ContractCreateTransaction()
            //Set the file ID of the Hedera file storing the bytecode
            .setAdminKey(env.operatorKey)
            .setBytecodeFileId(bytecodeFileId)
            //Set the gas to instantiate the contract
            .setGas(100000)
            //Provide the constructor parameters for the contract
            .setConstructorParameters();

        //Submit the transaction to the Hedera test network
        const contractResponse = await contractTx.execute(env.client);

        //Get the receipt of the file create transaction
        const contractReceipt = await contractResponse.getReceipt(env.client);

        //Get the smart contract ID
        const contractId = contractReceipt.contractId;

        console.log("Contract ID is:", contractId.toString());

        //Associate Token with Contract
        const tokenAssociateTransactionWithContract =
            await new TokenAssociateTransaction()
                .setAccountId(contractId.toString())
                .setTokenIds([tokenId])
                .freezeWith(env.client);

        const signedTxForAssociateTokenWithContract =
            await tokenAssociateTransactionWithContract.sign(env.operatorKey);
        const txResponseAssociatedTokenWithContract =
            await signedTxForAssociateTokenWithContract.execute(env.client);
        const txReceipt2 =
            await txResponseAssociatedTokenWithContract.getReceipt(env.client);
        console.log(
            "The associate token to contract transaction consensus is",
            txReceipt2.status.toString(),
        );

        //Associate Token with Receiver
        const tokenAssociateTransactionWithContract1 =
            await new TokenAssociateTransaction()
                .setAccountId(receiverAccountId.toString())
                .setTokenIds([tokenId])
                .freezeWith(env.client);

        const signedTxForAssociateTokenWithContract1 =
            await tokenAssociateTransactionWithContract1.sign(receiverKey);
        const txResponseAssociatedTokenWithContract1 =
            await signedTxForAssociateTokenWithContract1.execute(env.client);
        const txReceipt21 =
            await txResponseAssociatedTokenWithContract1.getReceipt(env.client);
        console.log(
            "The associate token to receiver transaction consensus is",
            txReceipt21.status.toString(),
        );

        // Give `spender` allowance for Token
        const receiverApproveTx =
            new AccountAllowanceApproveTransaction().approveTokenAllowance(
                tokenId,
                env.operatorId,
                contractId,
                100,
            );

        const approveRx = await receiverApproveTx.execute(env.client);

        const approveReceipt = await approveRx.getReceipt(env.client);
        console.log(
            `Approve spender allowance - status: ${approveReceipt.status}`,
        );

        // Get Allowances
        const checkAllowance = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(1500000)
            .setFunction(
                "getAllowance",
                new ContractFunctionParameters()
                    .addAddress(tokenId.toSolidityAddress())
                    .addAddress(env.operatorId.toSolidityAddress())
                    .addAddress(contractId.toSolidityAddress()),
            );

        const checkAllowanceTx = await checkAllowance.execute(env.client);
        const txRecord = await checkAllowanceTx.getRecord(env.client);

        const recQuery = await new TransactionRecordQuery()
            .setTransactionId(txRecord.transactionId)
            .setIncludeChildren(true)
            .execute(env.client);
        const allowanceSize = recQuery.contractFunctionResult.getUint256(0);

        console.log(`Contract has an allowance of ${allowanceSize}`);

        expect(allowanceSize.toNumber()).to.equal(100);
    });

    after(async function () {
        await env.close();
    });
});
