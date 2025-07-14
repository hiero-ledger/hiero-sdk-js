import { FileAppendTransaction } from "../../src/index.js";

describe("FileAppendTransaction", function () {
    it("should throw an error if chunk size is 0", () => {
        const tx = new FileAppendTransaction();

        let err = false;
        try {
            tx.setChunkSize(0);
        } catch (error) {
            if (error.message.includes("Chunk size must be greater than 0"))
                err = true;
        }

        expect(err).to.be.true;
    });
});
