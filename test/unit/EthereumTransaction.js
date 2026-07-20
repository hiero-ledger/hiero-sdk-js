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
    PrivateKey,
} from "../../src/index.js";
import EthereumTransactionDataEip1559 from "../../src/EthereumTransactionDataEip1559.js";

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

    describe("setEthereumData(EthereumTransactionData) overload", function () {
        function buildUnsignedData() {
            const empty = new Uint8Array();
            return new EthereumTransactionDataEip1559({
                chainId: hex.decode("012a"),
                nonce: hex.decode("02"),
                maxPriorityGas: hex.decode("2f"),
                maxGas: hex.decode("2f"),
                gasLimit: hex.decode("018000"),
                to: hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181"),
                value: hex.decode("0de0b6b3a7640000"),
                callData: hex.decode("123456"),
                accessList: [],
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        it("accepts a signed EthereumTransactionData and stores its bytes", function () {
            const data = buildUnsignedData().sign(PrivateKey.generateECDSA());
            expect(data.isSigned()).to.be.true;

            const tx = new EthereumTransaction().setEthereumData(data);
            expect(tx.ethereumData).to.deep.equal(data.toBytes());
        });

        it("rejects an unsigned EthereumTransactionData (never submits unsigned)", function () {
            const data = buildUnsignedData();
            expect(data.isSigned()).to.be.false;

            expect(() =>
                new EthereumTransaction().setEthereumData(data),
            ).to.throw(/not signed/);
        });

        it("leaves the raw-bytes overload unchanged (bypasses the guard)", function () {
            // Arbitrary bytes - the bytes path must not inspect or transform them.
            const bytes = hex.decode("00112233445566778899");
            const tx = new EthereumTransaction().setEthereumData(bytes);
            expect(tx.ethereumData).to.equal(bytes);
        });
    });
});
