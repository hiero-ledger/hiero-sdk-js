import sinon from "sinon";

import PrivateKey from "../../src/PrivateKey.js";
import Transaction from "../../src/transaction/Transaction.js";

describe("PrivateKey signTransaction Legacy", function () {
    let privateKey, mockedTransaction, mockedSignature;

    beforeEach(function () {
        privateKey = PrivateKey.generate();

        mockedTransaction = sinon.createStubInstance(Transaction);
        mockedSignature = new Uint8Array([4, 5, 6]);

        // Mock addSignature method on the transaction
        mockedTransaction.addSignature = sinon.spy();
    });

    it("should sign transaction and add signature", function () {
        // Mock _signedTransactions.list to return an array with one signed transaction
        mockedTransaction._signedTransactions = {
            list: [{ bodyBytes: new Uint8Array([1, 2, 3]) }],
        };

        // Stub the _key.sign method to return a mock signature
        privateKey._key = {
            sign: sinon.stub().returns(mockedSignature),
        };

        // Call the real signTransaction method
        const signatures = privateKey.signTransaction(mockedTransaction, true);

        // Validate that the signatures are correct
        expect(signatures).to.deep.equal(mockedSignature);

        sinon.assert.calledWith(
            mockedTransaction.addSignature,
            privateKey.publicKey,
            [mockedSignature],
        );

        // Ensure that sign method of the privateKey._key was called
        sinon.assert.calledOnce(privateKey._key.sign);
    });

    it("should return empty signature if bodyBytes are missing", function () {
        // Set bodyBytes to null to simulate missing bodyBytes
        mockedTransaction._signedTransactions = {
            list: [{ bodyBytes: null }],
        };

        // Stub the _key.sign method to return a mock signature
        privateKey._key = {
            sign: sinon.stub().returns(mockedSignature),
        };

        // Call signTransaction method
        const signatures = privateKey.signTransaction(mockedTransaction, true);

        // Validate that an empty Uint8Array was returned
        expect(signatures).to.deep.equal(new Uint8Array());

        // Ensure that the transaction's addSignature method was called with the empty signature
        sinon.assert.calledWith(
            mockedTransaction.addSignature,
            privateKey.publicKey,
            [new Uint8Array()],
        );

        // Ensure that sign method of the privateKey._key was not called
        sinon.assert.notCalled(privateKey._key.sign);
    });

    it("should sign transaction and add multiple signature", function () {
        const mockedSignatures = [
            new Uint8Array([10, 11, 12]),
            new Uint8Array([13, 14, 15]),
            new Uint8Array([16, 17, 18]),
        ];

        const signedTransactions = [
            { bodyBytes: new Uint8Array([1, 2, 3]) },
            { bodyBytes: new Uint8Array([4, 5, 6]) },
            { bodyBytes: new Uint8Array([7, 8, 9]) },
        ];

        // Mock _signedTransactions.list to return an array of  transaction
        mockedTransaction._signedTransactions = {
            list: signedTransactions,
        };

        // Stub the _key.sign method to return a list of mock signature
        privateKey._key = {
            sign: sinon
                .stub()
                .onCall(0)
                .returns(mockedSignatures[0])
                .onCall(1)
                .returns(mockedSignatures[1])
                .onCall(2)
                .returns(mockedSignatures[2]),
        };

        // Call the real signTransaction method
        const signatures = privateKey.signTransaction(mockedTransaction, true);

        // Validate that the signatures are correct
        expect(signatures).to.deep.equal(mockedSignatures);

        // Ensure that the transaction's addSignature method was called with the correct arguments
        sinon.assert.calledWith(
            mockedTransaction.addSignature,
            privateKey.publicKey,
            mockedSignatures,
        );

        // Ensure that sign method of the privateKey._key was called the correct number of times
        sinon.assert.callCount(privateKey._key.sign, 3);
    });
});
