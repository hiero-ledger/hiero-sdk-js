import { AccountId, MirrorNodeContractCallQuery } from "../../src/exports.js";

describe("MirrorNodeContractCallQuery", function () {
    const SENDER = new AccountId(1);
    const CONTRACT_ID = new AccountId(1);
    const VALUE = 100;
    const GAS_LIMIT = 100;
    const GAS_PRICE = 100;
    const BLOCK_NUMBER = 100;

    it("should throw an error without calldata", async function () {
        const query = new MirrorNodeContractCallQuery()
            .setBlockNumber(BLOCK_NUMBER)
            .setSender(SENDER)
            .setValue(VALUE)
            .setGasLimit(GAS_LIMIT)
            .setGasPrice(GAS_PRICE)
            .setContractId(CONTRACT_ID);

        let err = false;
        try {
            await query.execute();
        } catch (e) {
            err = e.message.includes("Call data is required.");
        }
        expect(err).to.equal(true);
    });
});
