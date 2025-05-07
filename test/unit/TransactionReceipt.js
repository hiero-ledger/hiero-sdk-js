import {
    AccountId,
    ContractId,
    ExchangeRate,
    ExchangeRates,
    FileId,
    ScheduleId,
    Status,
    Timestamp,
    TokenId,
    TopicId,
    TransactionId,
    TransactionReceipt,
} from "../../src/index.js";
import Long from "long";

describe("TransactionReceipt", function () {
    it("[from|to]Bytes()", function () {
        const status = Status.Ok;
        const accountId = AccountId.fromString("0.0.1");
        const fileId = FileId.fromString("0.0.2");
        const contractId = ContractId.fromString("0.0.3");
        const topicId = TopicId.fromString("0.0.3");
        const tokenId = TokenId.fromString("0.0.4");
        const scheduleId = ScheduleId.fromString("0.0.5");
        const exchangeRate = new ExchangeRate({
            hbars: 3,
            cents: 4,
            expirationTime: new Date(5),
        });
        const nextExchangeRate = new ExchangeRate({
            hbars: 6,
            cents: 7,
            expirationTime: new Date(8),
        });
        const exchangeRateSet = new ExchangeRates({
            currentRate: exchangeRate,
            nextRate: nextExchangeRate,
        });

        const topicSequenceNumber = Long.fromNumber(9);
        const topicRunningHash = new Uint8Array([10]);
        const totalSupply = Long.fromNumber(11);
        const scheduledTransactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.12"),
            new Timestamp(13, 14),
        );
        const serials = [Long.fromNumber(15)];

        const receipt = TransactionReceipt.fromBytes(
            new TransactionReceipt({
                status,
                accountId,
                fileId,
                contractId,
                topicId,
                tokenId,
                scheduleId,
                exchangeRate,
                nextExchangeRate,
                topicSequenceNumber,
                topicRunningHash,
                totalSupply,
                scheduledTransactionId,
                serials,
                duplicates: [],
                children: [],
            }).toBytes(),
        )._toProtobuf();

        expect(receipt.receipt.status).to.deep.equal(status._code);
        expect(receipt.receipt.accountID).to.deep.equal(
            accountId._toProtobuf(),
        );
        expect(receipt.receipt.contractID).to.deep.equal(
            contractId._toProtobuf(),
        );
        expect(receipt.receipt.fileID).to.deep.equal(fileId._toProtobuf());
        expect(receipt.receipt.scheduleID).to.deep.equal(
            scheduleId._toProtobuf(),
        );
        expect(receipt.receipt.tokenID).to.deep.equal(tokenId._toProtobuf());
        expect(receipt.receipt.topicID).to.deep.equal(topicId._toProtobuf());
        expect(receipt.receipt.topicRunningHash).to.deep.equal(
            topicRunningHash,
        );
        expect(receipt.receipt.topicSequenceNumber).to.deep.equal(
            topicSequenceNumber,
        );
        expect(receipt.receipt.exchangeRate).to.deep.equal(
            exchangeRateSet._toProtobuf(),
        );
        expect(receipt.receipt.scheduledTransactionID).to.deep.equal(
            scheduledTransactionId._toProtobuf(),
        );
        expect(receipt.receipt.serialNumbers).to.deep.equal(serials);
        expect(receipt.receipt.newTotalSupply).to.deep.equal(totalSupply);
        expect(receipt.duplicateTransactionReceipts).to.deep.equal([]);
        expect(receipt.childTransactionReceipts).to.deep.equal([]);
    });

    it("toJSON()", function () {
        const status = Status.Ok;
        const accountId = AccountId.fromString("0.0.1");
        const fileId = FileId.fromString("0.0.2");
        const contractId = ContractId.fromString("0.0.3");
        const topicId = TopicId.fromString("0.0.3");
        const tokenId = TokenId.fromString("0.0.4");
        const scheduleId = ScheduleId.fromString("0.0.5");
        const exchangeRate = new ExchangeRate({
            hbars: 6,
            cents: 7,
            expirationTime: new Date(Date.parse("1973-11-25T17:31:44.000Z")),
        });
        const nextExchangeRate = new ExchangeRate({
            hbars: 2,
            cents: 1,
            expirationTime: new Date(Date.parse("1973-11-25T17:31:44.000Z")),
        });
        const topicSequenceNumber = Long.fromNumber(9);
        const topicRunningHash = new Uint8Array([10]);
        const totalSupply = Long.fromNumber(11);
        const scheduledTransactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.12"),
            new Timestamp(13, 14),
        );
        const serials = [Long.fromNumber(15)];
        const nodeId = Long.fromNumber(1234);

        const receipt = new TransactionReceipt({
            status,
            accountId,
            fileId,
            contractId,
            topicId,
            tokenId,
            scheduleId,
            exchangeRate,
            nextExchangeRate,
            topicSequenceNumber,
            topicRunningHash,
            totalSupply,
            scheduledTransactionId,
            serials,
            duplicates: [],
            children: [],
            nodeId,
        });
        const child = new TransactionReceipt({
            status,
            accountId,
            fileId,
            contractId,
            topicId,
        });
        receipt.children.push(child);
        receipt.duplicates.push(child);

        const expectedJSON = JSON.parse(
            `{"status":"OK","accountId":"0.0.1","filedId":"0.0.2","contractId":"0.0.3","topicId":"0.0.3","tokenId":"0.0.4","scheduleId":"0.0.5","exchangeRate":{"hbars":6,"cents":7,"expirationTime":"1973-11-25T17:31:44.000Z","exchangeRateInCents":1.1666666666666667},"nextExchangeRate":{"hbars":2,"cents":1,"expirationTime":"1973-11-25T17:31:44.000Z","exchangeRateInCents":0.5},"topicSequenceNumber":"9","topicRunningHash":"0a","totalSupply":"11","scheduledTransactionId":"0.0.12@13.000000014","serials":["15"],"duplicates":[{"status":"OK","accountId":"0.0.1","filedId":"0.0.2","contractId":"0.0.3","topicId":"0.0.3","tokenId":null,"scheduleId":null,"exchangeRate":null,"nextExchangeRate":null,"topicSequenceNumber":null,"topicRunningHash":null,"totalSupply":null,"scheduledTransactionId":null,"serials":[],"duplicates":[],"children":[],"nodeId":null}],"children":[{"status":"OK","accountId":"0.0.1","filedId":"0.0.2","contractId":"0.0.3","topicId":"0.0.3","tokenId":null,"scheduleId":null,"exchangeRate":null,"nextExchangeRate":null,"topicSequenceNumber":null,"topicRunningHash":null,"totalSupply":null,"scheduledTransactionId":null,"serials":[],"duplicates":[],"children":[],"nodeId":null}],"nodeId":"1234"}`,
        );

        const resultJSON = JSON.parse(JSON.stringify(receipt));
        expect(resultJSON).to.deep.equal(expectedJSON);
    });

    it("toJSON() with missing fields", function () {
        const status = Status.Ok;
        const receipt = new TransactionReceipt({
            status,
        });

        const expectedJSON = `{"status":"OK","accountId":null,"filedId":null,"contractId":null,"topicId":null,"tokenId":null,"scheduleId":null,"exchangeRate":null,"nextExchangeRate":null,"topicSequenceNumber":null,"topicRunningHash":null,"totalSupply":null,"scheduledTransactionId":null,"serials":[],"duplicates":[],"children":[],"nodeId":null}`;
        const expectedJSONParsed = JSON.parse(expectedJSON);

        const resultJSON = JSON.parse(JSON.stringify(receipt));
        expect(resultJSON).to.deep.equal(expectedJSONParsed);
    });
});
