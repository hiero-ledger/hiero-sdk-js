import * as hashgraph from "@hiero-ledger/sdk";

/**
 *
 * ContractHelper declutters solidity-precomile-example.js
 *
 * When we instantiate a ContractHelper, we provide it with the JSON of a compiled solidity contract
 * which is assumed to have functions named "step0()" through "stepN()".
 *
 * Each of these step functions is assumed to take no function parameters, and to return a Hedera ResponseCode
 * which ought to be SUCCESS -- in other words, an int32 with value 22.
 * See examples/precompile-example/HederaResponseCodes.sol
 *
 * If a step takes function parameters, or if its ContractFunctionResult should be validated with a different method,
 * the user can specify a supplier for a particular step with setParameterSupplier(stepIndex, parametersSupplier),
 * and can specify an alternative validation method with setResultValidator(stepIndex, validateFunction)
 *
 * The contract is created on the Hedera network in the ContractHelper constructor, and when the user is ready to
 * execute the step functions in the contract, they should call executeSteps(firstStepToExecute, lastStepToExecute).
 */
export default class ContractHelper {
    /**
     * @private
     * @param {hashgraph.ContractId} contractId
     */
    constructor(contractId) {
        this.contractId = contractId;

        /** @type {Map<number, (result: hashgraph.ContractFunctionResult) => boolean>} */
        this.stepResultValidators = new Map();

        /** @type {Map<number, () => hashgraph.ContractFunctionParameters>} */
        this.stepParameterSuppliers = new Map();

        /** @type {Map<number, hashgraph.Hbar>} */
        this.stepPayableAmounts = new Map();

        /** @type {Map<number, hashgraph.PrivateKey[]>} */
        this.stepSigners = new Map();

        /** @type {Map<number, hashgraph.AccountId>} */
        this.stepFeePayers = new Map();

        /** @type {Map<number, (tokenAddress: string) => Promise<void>>} */
        this.stepLogic = new Map();
    }

    /**
     * @param {string} bytecode
     * @param {hashgraph.ContractFunctionParameters} constructorParameters
     * @param {hashgraph.Signer} signer
     * @returns {Promise<ContractHelper>}
     */
    static async init(bytecode, constructorParameters, signer) {
        const response = await new hashgraph.ContractCreateFlow()
            .setBytecode(bytecode)
            .setMaxChunks(30)
            .setGas(8_000_000)
            .setConstructorParameters(constructorParameters)
            .executeWithSigner(signer);

        const receipt = await response.getReceiptWithSigner(signer);

        return new ContractHelper(receipt.contractId);
    }

    /**
     * @param {number} stepIndex
     * @param {(result: hashgraph.ContractFunctionResult) => boolean} validator
     * @returns {this}
     */
    setResultValidatorForStep(stepIndex, validator) {
        this.stepResultValidators.set(stepIndex, validator);
        return this;
    }

    /**
     * @param {number} stepIndex
     * @param {(tokenAddress: string) => Promise<void>} logic
     * @returns {this}
     */
    setStepLogic(stepIndex, logic) {
        this.stepLogic.set(stepIndex, logic);
        return this;
    }

    /**
     * @param {number} stepIndex
     * @param {() => hashgraph.ContractFunctionParameters} supplier
     * @returns {this}
     */
    setParameterSupplierForStep(stepIndex, supplier) {
        this.stepParameterSuppliers.set(stepIndex, supplier);
        return this;
    }

    /**
     * @param {number} stepIndex
     * @param {hashgraph.Hbar} amount
     * @returns {this}
     */
    setPayableAmountForStep(stepIndex, amount) {
        this.stepPayableAmounts.set(stepIndex, amount);
        return this;
    }

    /**
     * @param {number} stepIndex
     * @param {hashgraph.PrivateKey} signer
     * @returns {this}
     */
    addSignerForStep(stepIndex, signer) {
        if (this.stepSigners.has(stepIndex)) {
            this.stepSigners.get(stepIndex).push(signer);
        } else {
            this.stepSigners.set(stepIndex, [signer]);
        }

        return this;
    }

    /**
     * @param {number} stepIndex
     * @param {hashgraph.AccountId} feePayerAccountId
     * @param {hashgraph.PrivateKey} feePayerAccountKey
     * @returns {this}
     */
    setFeePayerForStep(stepIndex, feePayerAccountId, feePayerAccountKey) {
        this.stepFeePayers.set(stepIndex, feePayerAccountId);
        return this.addSignerForStep(stepIndex, feePayerAccountKey);
    }

    /**
     * @private
     * @param {number} stepIndex
     * @returns {(tokenAddress: string) => Promise<void>}
     */
    getStepLogic(stepIndex) {
        return this.stepLogic.get(stepIndex);
    }

    /**
     * @private
     * @param {number} stepIndex
     * @returns {(result: hashgraph.ContractFunctionResult) => boolean}
     */
    getResultValidator(stepIndex) {
        if (this.stepResultValidators.has(stepIndex)) {
            return this.stepResultValidators.get(stepIndex);
        }

        return (/** @type {hashgraph.ContractFunctionResult} */ result) => {
            const responseStatus = hashgraph.Status._fromCode(
                result.getInt32(0),
            );
            const isValid = responseStatus == hashgraph.Status.Success;
            if (!isValid) {
                console.log(
                    `Encountered invalid response status ${responseStatus.toString()}`,
                );
            }
            return isValid;
        };
    }

    /**
     * @private
     * @param {number} stepIndex
     * @returns {() => hashgraph.ContractFunctionParameters}
     */
    getParameterSupplier(stepIndex) {
        if (this.stepParameterSuppliers.has(stepIndex)) {
            return this.stepParameterSuppliers.get(stepIndex);
        }

        return () => null;
    }

    /**
     * @private
     * @param {number} stepIndex
     * @returns {hashgraph.Hbar}
     */
    getPayableAmount(stepIndex) {
        return this.stepPayableAmounts.get(stepIndex);
    }

    /**
     * @private
     * @param {number} stepIndex
     * @returns {hashgraph.PrivateKey[]}
     */
    getSigners(stepIndex) {
        if (this.stepSigners.has(stepIndex)) {
            return this.stepSigners.get(stepIndex);
        }

        return [];
    }

    /**
     * @param {number} firstStepToExecute
     * @param {number} lastStepToExecute
     * @param {hashgraph.Signer} signer
     * @returns {Promise<ContractHelper>}
     */
    async executeSteps(firstStepToExecute, lastStepToExecute, signer) {
        for (
            let stepIndex = firstStepToExecute;
            stepIndex <= lastStepToExecute;
            stepIndex++
        ) {
            console.log(`Attempting to execute step ${stepIndex}`);

            let transaction = new hashgraph.ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(10_000_000);

            const payableAmount = this.getPayableAmount(stepIndex);
            if (payableAmount != null) {
                transaction.setPayableAmount(payableAmount);
            }

            const functionName = `step${stepIndex}`;
            const parameters = this.getParameterSupplier(stepIndex)();
            if (parameters != null) {
                transaction.setFunction(functionName, parameters);
            } else {
                transaction.setFunction(functionName);
            }

            const feePayerAccountId = this.stepFeePayers.get(stepIndex);
            if (feePayerAccountId != null) {
                transaction.setTransactionId(
                    hashgraph.TransactionId.generate(feePayerAccountId),
                );
            }

            await transaction.freezeWithSigner(signer);
            for (const signer of this.getSigners(stepIndex)) {
                await transaction.sign(signer);
            }

            transaction = /** @type {hashgraph.ContractExecuteTransaction} */ (
                await transaction.signWithSigner(signer)
            );

            const response = await transaction.executeWithSigner(signer);
            const record = await response.getRecordWithSigner(signer);
            const functionResult = record.contractFunctionResult;

            if (this.getStepLogic(stepIndex)) {
                const additionalFunction = this.getStepLogic(stepIndex);
                const tokenAddress = functionResult.getAddress(1);
                await additionalFunction(tokenAddress);
            }

            if (this.getResultValidator(stepIndex)(functionResult)) {
                console.log(
                    `step ${stepIndex} completed, and returned valid result. (TransactionId "${record.transactionId.toString()}")`,
                );
            } else {
                console.log(
                    `Transaction record: ${JSON.stringify(record, null, 2)}`,
                );
                throw new Error(`step ${stepIndex} returned invalid result`);
            }
        }
        return this;
    }
}
