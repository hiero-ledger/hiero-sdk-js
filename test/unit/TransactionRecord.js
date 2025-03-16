import { expect } from "chai";

import {
    AssessedCustomFee,
    ScheduleId,
    EvmAddress,
    PublicKey,
    TransactionRecord,
    AccountId,
    TokenId,
} from "../../src/index.js";
import TokenTransfer from "../../src/token/TokenTransfer.js";
import TokenAssociation from "../../src/token/TokenAssociation.js";
import TokenTransferMap from "../../src/account/TokenTransferMap.js";
import TokenNFTTransferMap from "../../src/account/TokenNftTransferMap.js";
import * as hex from "../../src/encoding/hex.js";

const HEX_BYTES =
    "1a93020a3b081612070800100018de092a260a110801100c1a0b0880ae99a4ffffffffff0112110801100f1a0b08c0bd98a4ffffffffff0138004200580078001230cac44f2db045ba441f3fbc295217f2eb0f956293d28b3401578f6160e66f4e47ea87952d91c4b1cb5bda6447823b979a1a0c08f3fcb495061083d9be900322190a0c08e8fcb495061098f09cf20112070800100018850918002a0030bee8f013526c0a0f0a0608001000180510d0df820118000a0f0a0608001000186210f08dff1e18000a100a070800100018a00610def1ef0318000a100a070800100018a10610def1ef0318000a110a070800100018850910fbf8b7e10718000a110a070800100018de091080a8d6b90718008a0100aa0100";

describe("TransactionRecord", function () {
    it("[from|to]Bytes()", function () {
        const record = TransactionRecord.fromBytes(hex.decode(HEX_BYTES));
        expect(hex.encode(record.toBytes())).to.equal(HEX_BYTES);
    });

    it("toJSON()", function () {
        const record = TransactionRecord.fromBytes(hex.decode(HEX_BYTES));
        const accID = AccountId.fromString("0.0.1246");
        const tokenID = TokenId.fromString("0.0.123");

        const tokenTransferMap = new TokenTransferMap();
        tokenTransferMap.__set(tokenID, accID, 789);

        const nftTransferMap = new TokenNFTTransferMap();
        nftTransferMap.__set(tokenID, {
            sender: accID,
            recipient: accID,
            serial: 123,
            isApproved: true,
        });

        const assessedCustomFee = new AssessedCustomFee({
            tokenId: tokenID,
            feeCollectorAccountId: accID,
            amount: 789,
            payerAccountIds: [accID],
        });

        const tokenAssociation = new TokenAssociation({
            tokenId: tokenID,
            accountId: accID,
        });

        const tokenTransfer = new TokenTransfer({
            tokenId: tokenID,
            accountId: accID,
            amount: 789,
        });

        const newRecord = new TransactionRecord({
            ...record,
            transactionMemo: "test",
            tokenTransfers: tokenTransferMap,
            nftTransfers: nftTransferMap,
            parentConsensusTimestamp: record.consensusTimestamp,
            aliasKey: PublicKey.fromString(
                "302a300506032b6570032100d7366c45e4d2f1a6c1d9af054f5ef8edc0b8d3875ba5d08a7f2e81ee8876e9e8",
            ),
            ethereumHash: Uint8Array.from([1, 2, 3, 4]),
            paidStakingRewards: record.transfers,
            prngBytes: Uint8Array.from([1, 2, 3, 4]),
            prngNumber: 123,
            evmAddress: EvmAddress.fromString("0xdeadbeef"),
            scheduleRef: ScheduleId.fromString("0.0.123"),
            assessedCustomFees: [assessedCustomFee],
            automaticTokenAssociations: [tokenAssociation],
            tokenTransfersList: [tokenTransfer],
        });

        const expectedJSON = JSON.parse(
            `{"receipt":{"status":"SUCCESS","accountId":"0.0.1246","filedId":null,"contractId":null,"topicId":null,"tokenId":null,"scheduleId":null,"exchangeRate":{"hbars":1,"cents":12,"expirationTime":"1963-11-25T17:31:44.000Z","exchangeRateInCents":12},"nextExchangeRate":{"hbars":1,"cents":15,"expirationTime":"1963-11-25T13:31:44.000Z","exchangeRateInCents":15},"topicSequenceNumber":"0","topicRunningHash":"","totalSupply":"0","scheduledTransactionId":null,"serials":[],"duplicates":[],"children":[],"nodeId":"0"},"transactionHash":"cac44f2db045ba441f3fbc295217f2eb0f956293d28b3401578f6160e66f4e47ea87952d91c4b1cb5bda6447823b979a","consensusTimestamp":"2022-06-18T02:54:43.839Z","transactionId":"0.0.1157@1655520872.507983896","transactionMemo":"test","transactionFee":"41694270","transfers":[{"accountId":"0.0.5","amount":"1071080","isApproved":false},{"accountId":"0.0.98","amount":"32498552","isApproved":false},{"accountId":"0.0.800","amount":"4062319","isApproved":false},{"accountId":"0.0.801","amount":"4062319","isApproved":false},{"accountId":"0.0.1157","amount":"-1041694270","isApproved":false},{"accountId":"0.0.1246","amount":"1000000000","isApproved":false}],"tokenTransfers":{"0.0.123":{"0.0.1246":"789"}},"tokenTransfersList":[{"tokenId":"0.0.123","accountId":"0.0.1246","amount":"789"}],"scheduleRef":"0.0.123","assessedCustomFees":[{"feeCollectorAccountId":"0.0.1246","tokenId":"0.0.123","amount":"789","payerAccountIds":["0.0.1246"]}],"nftTransfers":{"0.0.123":[{"sender":"0.0.1246","recipient":"0.0.1246","serial":123,"isApproved":true}]},"automaticTokenAssociations":[{"accountId":"0.0.1246","tokenId":"0.0.123"}],"parentConsensusTimestamp":"2022-06-18T02:54:43.839Z","aliasKey":"302a300506032b6570032100d7366c45e4d2f1a6c1d9af054f5ef8edc0b8d3875ba5d08a7f2e81ee8876e9e8","duplicates":[],"children":[],"ethereumHash":"01020304","paidStakingRewards":[{"accountId":"0.0.5","amount":"1071080","isApproved":false},{"accountId":"0.0.98","amount":"32498552","isApproved":false},{"accountId":"0.0.800","amount":"4062319","isApproved":false},{"accountId":"0.0.801","amount":"4062319","isApproved":false},{"accountId":"0.0.1157","amount":"-1041694270","isApproved":false},{"accountId":"0.0.1246","amount":"1000000000","isApproved":false}],"prngBytes":"01020304","prngNumber":123,"evmAddress":"deadbeef"}`,
        );
        const actualJSON = JSON.parse(JSON.stringify(newRecord));

        expect(actualJSON).to.deep.equal(expectedJSON);
    });
});
