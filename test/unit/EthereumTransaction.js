import Long from "long";

import * as hex from "../../src/encoding/hex.js";
import {
    EthereumTransaction,
    AccountId,
    Timestamp,
    FileId,
    Transaction,
    TransactionId,
    Hbar,
} from "../../src/index.js";

describe("EthereumTransaction", function () {
    it("toProtobuf with FileId", function () {
        const ethereumData = hex.decode("00112233445566778899");
        const callData = new FileId(1);
        const maxGasAllowance = Hbar.fromTinybars(Long.fromNumber(10));
        const accountId1 = new AccountId(7);
        const nodeAccountId = new AccountId(10, 11, 12);
        const timestamp1 = new Timestamp(14, 15);

        let transaction = new EthereumTransaction()
            .setTransactionId(
                TransactionId.withValidStart(accountId1, timestamp1),
            )
            .setNodeAccountIds([nodeAccountId])
            .setEthereumData(ethereumData)
            .setCallDataFileId(callData)
            .setMaxGasAllowanceHbar(maxGasAllowance)
            .freeze();

        transaction = Transaction.fromBytes(transaction.toBytes());

        const data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            ethereumData,
            callData: callData._toProtobuf(),
            maxGasAllowance: maxGasAllowance.toTinybars(),
        });
    });

    it("toProtobuf with Uint8Array", function () {
        const ethereumData = hex.decode("00112233445566778899");
        const maxGasAllowance = Hbar.fromTinybars(Long.fromNumber(10));
        const accountId1 = new AccountId(7);
        const nodeAccountId = new AccountId(10, 11, 12);
        const timestamp1 = new Timestamp(14, 15);

        let transaction = new EthereumTransaction()
            .setTransactionId(
                TransactionId.withValidStart(accountId1, timestamp1),
            )
            .setNodeAccountIds([nodeAccountId])
            .setEthereumData(ethereumData)
            .setMaxGasAllowanceHbar(maxGasAllowance)
            .freeze();

        transaction = Transaction.fromBytes(transaction.toBytes());

        const data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            ethereumData,
            callData: null,
            maxGasAllowance: maxGasAllowance.toTinybars(),
        });
    });
});
