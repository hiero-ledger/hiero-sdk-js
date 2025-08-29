import {
    ContractExecuteTransaction,
    ContractId,
    AccountId,
    TransactionId,
    Hbar,
    PrivateKey,
    ContractFunctionParameters,
    Transaction,
    HbarUnit,
} from "../../src/index.js";
import Long from "long";

describe("ContractExecuteTransaction", function () {
    let contractId;
    let gas;
    let payableAmount;
    let functionParameters;
    let privateKey;

    beforeEach(function () {
        contractId = new ContractId(5);
        gas = Long.fromNumber(100000);
        payableAmount = new Hbar(10);
        functionParameters = new Uint8Array([0, 1, 2, 3]);
        privateKey = PrivateKey.generateED25519();
    });

    describe("constructor", function () {
        it("should set contract ID from constructor", function () {
            const transaction = new ContractExecuteTransaction({
                contractId,
            });

            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
        });

        it("should set gas from constructor", function () {
            const transaction = new ContractExecuteTransaction({
                gas,
            });

            expect(transaction.gas.toString()).to.equal(gas.toString());
        });

        it("should set payable amount from constructor", function () {
            const transaction = new ContractExecuteTransaction({
                amount: payableAmount,
            });

            expect(transaction.payableAmount.toString()).to.equal(
                payableAmount.toString(),
            );
        });

        it("should set function parameters from constructor", function () {
            const transaction = new ContractExecuteTransaction({
                functionParameters,
            });

            expect(transaction.functionParameters).to.deep.equal(
                functionParameters,
            );
        });

        it("should set function and parameters from constructor", function () {
            const params = new ContractFunctionParameters()
                .addString("test")
                .addUint256(1);
            const functionName = "myFunction";

            const transaction = new ContractExecuteTransaction({
                function: {
                    name: functionName,
                    parameters: params,
                },
            });

            // The actual parameters will be encoded based on the function name and params
            expect(transaction.functionParameters).to.not.be.null;
        });
    });

    describe("setters", function () {
        it("should set contract ID", function () {
            const transaction = new ContractExecuteTransaction().setContractId(
                contractId,
            );

            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
        });

        it("should set contract ID from string", function () {
            const transaction = new ContractExecuteTransaction().setContractId(
                contractId.toString(),
            );

            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
        });

        it("should set gas", function () {
            const transaction = new ContractExecuteTransaction().setGas(gas);

            expect(transaction.gas.toString()).to.equal(gas.toString());
        });

        it("should set gas from number", function () {
            const gasNumber = 100000;
            const transaction = new ContractExecuteTransaction().setGas(
                gasNumber,
            );

            expect(transaction.gas.toNumber()).to.equal(gasNumber);
        });

        it("should throw error if gas is negative", function () {
            const gasNumber = -10;
            expect(() => {
                new ContractExecuteTransaction().setGas(gasNumber);
            }).to.throw("Gas must be greater than 0");
        });

        it("should set payable amount", function () {
            const transaction =
                new ContractExecuteTransaction().setPayableAmount(
                    payableAmount,
                );

            expect(transaction.payableAmount.toString()).to.equal(
                payableAmount.toString(),
            );
        });

        it("should set payable amount from number", function () {
            const amount = 10;
            const transaction =
                new ContractExecuteTransaction().setPayableAmount(amount);

            expect(transaction.payableAmount.toString()).to.equal(
                Hbar.from(amount).toString(),
            );
        });

        it("should set payable amount from number with unit", function () {
            const amount = 10;
            let transaction = new ContractExecuteTransaction().setPayableAmount(
                amount,
                HbarUnit.Tinybar,
            );

            expect(transaction.payableAmount.toString()).to.equal(
                Hbar.from(amount, HbarUnit.Tinybar).toString(),
            );

            transaction = new ContractExecuteTransaction().setPayableAmount(
                amount,
                HbarUnit.Megabar,
            );

            expect(transaction.payableAmount.toString()).to.equal(
                Hbar.from(amount, HbarUnit.Megabar).toString(),
            );
        });

        it("should set function parameters", function () {
            const transaction =
                new ContractExecuteTransaction().setFunctionParameters(
                    functionParameters,
                );

            expect(transaction.functionParameters).to.deep.equal(
                functionParameters,
            );
        });

        it("should set function name and parameters", function () {
            const params = new ContractFunctionParameters()
                .addString("test")
                .addUint256(1);
            const functionName = "myFunction";

            const transaction = new ContractExecuteTransaction().setFunction(
                functionName,
                params,
            );

            // The actual parameters will be encoded based on the function name and params
            expect(transaction.functionParameters).to.not.be.null;
        });
    });

    describe("serialization/deserialization", function () {
        it("should correctly serialize and deserialize with all properties", async function () {
            // Create a transaction with all properties set
            const transaction = await new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(gas)
                .setPayableAmount(payableAmount)
                .setFunctionParameters(functionParameters)
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(10)))
                .freeze()
                .sign(privateKey);

            // Convert to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize from bytes
            const deserializedTransaction =
                Transaction.fromBytes(transactionBytes);

            // Verify the transaction is the right type
            expect(deserializedTransaction).to.be.instanceOf(
                ContractExecuteTransaction,
            );

            // Cast to the correct type
            const contractExec = /** @type {ContractExecuteTransaction} */ (
                deserializedTransaction
            );

            // Verify all properties are preserved
            expect(contractExec.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(contractExec.gas.toString()).to.equal(gas.toString());
            expect(contractExec.payableAmount.toString()).to.equal(
                payableAmount.toString(),
            );
            expect(contractExec.functionParameters).to.deep.equal(
                functionParameters,
            );
        });

        it("should correctly serialize and deserialize with minimal properties", async function () {
            // Create a transaction with minimal properties
            const transaction = await new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(gas)
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(10)))
                .freeze()
                .sign(privateKey);

            // Convert to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize from bytes
            const deserializedTransaction =
                Transaction.fromBytes(transactionBytes);

            // Verify the transaction is the right type
            expect(deserializedTransaction).to.be.instanceOf(
                ContractExecuteTransaction,
            );

            // Cast to the correct type
            const contractExec = /** @type {ContractExecuteTransaction} */ (
                deserializedTransaction
            );

            // Verify properties are preserved
            expect(contractExec.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(contractExec.gas.toString()).to.equal(gas.toString());
            expect(contractExec.payableAmount.toString()).to.equal("0 tℏ");
            expect(contractExec.functionParameters).to.deep.equal(
                new Uint8Array(),
            );
        });

        it("should correctly handle function name and parameters through serialization", async function () {
            // Create a ContractFunctionParameters object
            const params = new ContractFunctionParameters()
                .addString("testValue")
                .addUint256(123);

            const functionName = "myTestFunction";

            // Create and serialize transaction
            const transaction = await new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(gas)
                .setFunction(functionName, params)
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(10)))
                .freeze()
                .sign(privateKey);

            // Convert to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize from bytes
            const deserializedTransaction =
                Transaction.fromBytes(transactionBytes);

            // Cast to the correct type
            const contractExec = /** @type {ContractExecuteTransaction} */ (
                deserializedTransaction
            );

            // Verify function parameters were preserved (we can't check the encoded function name directly,
            // but we can verify functionParameters exists and isn't empty)
            expect(contractExec.functionParameters).to.not.be.null;
            expect(contractExec.functionParameters.length).to.be.greaterThan(0);
        });
    });

    describe("_makeTransactionData", function () {
        it("should create correct transaction data", function () {
            const transaction = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(gas)
                .setPayableAmount(payableAmount)
                .setFunctionParameters(functionParameters);

            // Access the private method using a workaround
            const transactionData = transaction._makeTransactionData();

            // Verify the structure
            expect(transactionData.contractID).to.deep.include({
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                contractNum: Long.fromNumber(5),
            });
            expect(transactionData.gas.toString()).to.equal(gas.toString());
            expect(transactionData.amount.toString()).to.equal(
                payableAmount.toTinybars().toString(),
            );
            expect(transactionData.functionParameters).to.equal(
                functionParameters,
            );
        });

        it("should handle null values", function () {
            const transaction = new ContractExecuteTransaction().setContractId(
                contractId,
            );

            const transactionData = transaction._makeTransactionData();

            expect(transactionData.contractID).to.not.be.null;
            expect(transactionData.gas).to.be.null;
            expect(transactionData.amount).to.be.null;
            expect(transactionData.functionParameters).to.be.null;
        });
    });
});
