import { AccountId } from "../../src/exports.js";
import MirrorNodeContractQuery from "../../src/query/MirrorNodeContractQuery.js";

describe("MirrorNodeContractQuery", function () {
    const SENDER = new AccountId(1);
    const SENDER_EVM_ADDRESS = "0000000000000000000000000000000000000001";
    const CONTRACT_EVM_ADDRESS = "0000000000000000000000000000000000000001";
    const CONTRACT_ID = new AccountId(1);
    const FUNCTION_NAME = "getMessage";
    const FUNCTION_SELECTOR = new Uint8Array([206, 109, 65, 222]); // getMessage()
    const VALUE = 100;
    const GAS_LIMIT = 100;
    const GAS_PRICE = 100;
    const BLOCK_NUMBER = 100;

    it("should set query parameters", function () {
        const query = new MirrorNodeContractQuery()
            .setBlockNumber(BLOCK_NUMBER)
            .setSender(SENDER)
            .setFunction(FUNCTION_NAME)
            .setValue(VALUE)
            .setGasLimit(GAS_LIMIT)
            .setGasPrice(GAS_PRICE)
            .setContractId(CONTRACT_ID);

        expect(query.sender).to.be.instanceOf(AccountId);
        expect(query.contractEvmAddress).to.be.equal(CONTRACT_EVM_ADDRESS);
        expect(query.callData).to.be.deep.equal(FUNCTION_SELECTOR);
        expect(query.value).to.be.equal(VALUE);
        expect(query.gasLimit).to.be.equal(GAS_LIMIT);
        expect(query.gasPrice).to.be.equal(GAS_PRICE);
        expect(query.blockNumber).to.be.equal(BLOCK_NUMBER);
        expect(query.contractId).to.be.equal(CONTRACT_ID);
    });

    it("should throw an error when no contract id sent", async function () {
        const query = new MirrorNodeContractQuery()
            .setBlockNumber(BLOCK_NUMBER)
            .setSender(SENDER)
            .setFunction(FUNCTION_NAME)
            .setValue(VALUE)
            .setGasLimit(GAS_LIMIT)
            .setGasPrice(GAS_PRICE);

        let err = false;
        try {
            query.contractEvmAddress;
        } catch (e) {
            err = e.message.includes("Contract ID is not set");
        }
        expect(err).to.be.true;
    });

    it("should not be able to perform MN request without contract id", async function () {
        const query = new MirrorNodeContractQuery()
            .setBlockNumber(BLOCK_NUMBER)
            .setSender(SENDER)
            .setFunction(FUNCTION_NAME)
            .setValue(VALUE)
            .setGasLimit(GAS_LIMIT)
            .setGasPrice(GAS_PRICE);

        let err = false;
        try {
            await query.performMirrorNodeRequest("", "");
        } catch (e) {
            err = e.message.includes("Contract ID is not set");
        }
        expect(err).to.be.true;
    });
});
