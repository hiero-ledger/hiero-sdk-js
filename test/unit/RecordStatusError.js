import {
    Status,
    StatusError,
    TransactionId,
    TransactionRecord,
} from "../../src/index.js";
import RecordStatusError from "../../src/RecordStatusError.js";

describe("RecordStatusError", function () {
    const transactionId = TransactionId.fromString(
        "0.0.1001@1700000000.000000001",
    );
    const status = Status.InvalidSignature;
    const transactionRecord = new TransactionRecord({});

    it("should construct message in the correct format", function () {
        const error = new RecordStatusError({
            status,
            transactionId,
            transactionRecord,
        });

        const expectedMessage = `Record for transaction ${transactionId.toString()} contained error status ${status.toString()}`;

        expect(error.message).to.equal(expectedMessage);
    });

    it("should store status, transactionId and transactionRecord", function () {
        const error = new RecordStatusError({
            status,
            transactionId,
            transactionRecord,
        });

        expect(error.status).to.equal(status);
        expect(error.transactionId).to.equal(transactionId);
        expect(error.transactionRecord).to.equal(transactionRecord);
    });

    it("should be an instance of StatusError and Error", function () {
        const error = new RecordStatusError({
            status,
            transactionId,
            transactionRecord,
        });

        expect(error).to.be.instanceOf(RecordStatusError);
        expect(error).to.be.instanceOf(StatusError);
        expect(error).to.be.instanceOf(Error);
    });

    it("should have name 'StatusError'", function () {
        const error = new RecordStatusError({
            status,
            transactionId,
            transactionRecord,
        });

        expect(error.name).to.equal("StatusError");
    });

    it("toJSON() should be inherited from StatusError and not contain transactionRecord", function () {
        const error = new RecordStatusError({
            status,
            transactionId,
            transactionRecord,
        });

        const json = error.toJSON();

        expect(json).to.deep.equal({
            name: "StatusError",
            status: status.toString(),
            transactionId: transactionId.toString(),
            message: error.message,
        });
        expect(json).not.to.have.property("transactionRecord");
    });

    it("toString() should return JSON.stringify(error.toJSON())", function () {
        const error = new RecordStatusError({
            status,
            transactionId,
            transactionRecord,
        });

        expect(error.toString()).to.equal(JSON.stringify(error.toJSON()));
    });

    it("valueOf() should return the same object as toJSON()", function () {
        const error = new RecordStatusError({
            status,
            transactionId,
            transactionRecord,
        });

        expect(error.valueOf()).to.deep.equal(error.toJSON());
    });
});
