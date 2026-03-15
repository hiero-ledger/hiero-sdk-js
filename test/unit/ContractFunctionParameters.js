import { ContractFunctionParameters } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";

import BigNumber from "../../src/BigNumberCompat.js";

const int32 = 16909060;

const bytes = new Uint8Array(10);
bytes[1] = 1;
bytes[4] = 4;
bytes[9] = 8;

const maxInt64 = new BigNumber("0x7FFFFFFFFFFFFFFF", 16);

const str = "this is a grin: \uD83D\uDE01";

const strArray = ["one", "two"];

describe("ContractFunctionParameters", function () {
    it("should convert number to BigNumber in addUint256()", function () {
        const contractFunctionParameters = new ContractFunctionParameters();

        const num = 111;
        const cfp = contractFunctionParameters.addUint256(num);

        const bigNum = BigNumber(111);
        contractFunctionParameters.addUint256(bigNum);

        expect(cfp._arguments[0].value).to.eql(cfp._arguments[1].value);
    });

    it("should convert number to BigNumber in addUint24()", function () {
        const contractFunctionParameters = new ContractFunctionParameters();

        const num = 111;
        const cfp = contractFunctionParameters.addUint24(num);

        const bigNum = BigNumber(111);
        contractFunctionParameters.addUint24(bigNum);

        expect(cfp._arguments[0].value).to.eql(cfp._arguments[1].value);
    });

    it("should convert number to BigNumber in addInt24()", function () {
        const contractFunctionParameters = new ContractFunctionParameters();

        const num = 111;
        const cfp = contractFunctionParameters.addInt24(num);

        const bigNum = BigNumber(111);
        contractFunctionParameters.addInt24(bigNum);

        expect(cfp._arguments[0].value).to.eql(cfp._arguments[1].value);
    });

    it("should convert number to BigNumber in addUint256Array()", function () {
        const contractFunctionParameters = new ContractFunctionParameters();

        const numArray = [111, 1112];

        const cfp = contractFunctionParameters.addUint256Array(numArray);

        const bigArray = [new BigNumber(111), new BigNumber(1112)];

        contractFunctionParameters.addUint256Array(bigArray);

        expect(cfp._arguments[0].value).to.eql(cfp._arguments[1].value);
    });

    it("encodes correctly using function selector", function () {
        const bytes2 = new Uint8Array(32);
        bytes2[0] = 255;
        bytes2[31] = 255;

        const params = new ContractFunctionParameters()
            .addInt32(int32)
            .addBytes(bytes)
            .addInt64(maxInt64)
            .addBytes(bytes2)
            .addString(str);

        const finished = params._build("f");
        const funcHash = hex.encode(finished.slice(0, 4));
        const firstParam = hex.encode(finished.slice(32 * 0 + 4, 32 * 1 + 4));
        const secondParam = hex.encode(finished.slice(32 * 1 + 4, 32 * 2 + 4));
        const thirdParam = hex.encode(finished.slice(32 * 2 + 4, 32 * 3 + 4));
        const forthParam = hex.encode(finished.slice(32 * 3 + 4, 32 * 4 + 4));
        const fifthParam = hex.encode(finished.slice(32 * 4 + 4, 32 * 5 + 4));
        const secondParamDataLength = hex.encode(
            finished.slice(32 * 5 + 4, 32 * 6 + 4),
        );
        const secondParamData = hex.encode(
            finished.slice(32 * 6 + 4, 32 * 7 + 4),
        );
        const fourthParamDataLength = hex.encode(
            finished.slice(32 * 7 + 4, 32 * 8 + 4),
        );
        const fourthParamData = hex.encode(
            finished.slice(32 * 8 + 4, 32 * 9 + 4),
        );
        const fifthParamDataLength = hex.encode(
            finished.slice(32 * 9 + 4, 32 * 10 + 4),
        );
        const fifthParamData = hex.encode(
            finished.slice(32 * 10 + 4, 32 * 11 + 4),
        );
        expect(funcHash).to.be.equal("b54f97cf");
        expect(firstParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000001020304",
        );
        expect(secondParam).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000000a0",
        );
        expect(thirdParam).to.be.equal(
            "0000000000000000000000000000000000000000000000007fffffffffffffff",
        );
        expect(forthParam).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000000e0",
        );
        expect(fifthParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000120",
        );
        expect(secondParamDataLength).to.be.equal(
            "000000000000000000000000000000000000000000000000000000000000000a",
        );
        expect(secondParamData).to.be.equal(
            "0001000004000000000800000000000000000000000000000000000000000000",
        );
        expect(fourthParamDataLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000020",
        );
        expect(fourthParamData).to.be.equal(
            "ff000000000000000000000000000000000000000000000000000000000000ff",
        );
        expect(fifthParamDataLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000014",
        );
        expect(fifthParamData).to.be.equal(
            "746869732069732061206772696e3a20f09f9881000000000000000000000000",
        );
        expect(finished.length).to.be.equal(356);
    });

    it("encodes correctly using generic addParam", function () {
        const params = new ContractFunctionParameters()
            .addInt32(int32)
            .addInt32(int32)
            .addInt64(maxInt64)
            .addString(str)
            .addInt32(1515)
            .addStringArray(strArray);

        const finished = params._build("f");
        const funcHash = hex.encode(finished.slice(0, 4));
        const firstParam = hex.encode(finished.slice(32 * 0 + 4, 32 * 1 + 4));
        const secondParam = hex.encode(finished.slice(32 * 1 + 4, 32 * 2 + 4));
        const thirdParam = hex.encode(finished.slice(32 * 2 + 4, 32 * 3 + 4));
        const forthParam = hex.encode(finished.slice(32 * 3 + 4, 32 * 4 + 4));
        const fifthParam = hex.encode(finished.slice(32 * 4 + 4, 32 * 5 + 4));
        const sixthParam = hex.encode(finished.slice(32 * 5 + 4, 32 * 6 + 4));
        const fourthParamDataLength = hex.encode(
            finished.slice(32 * 6 + 4, 32 * 7 + 4),
        );
        const fourthParamData = hex.encode(
            finished.slice(32 * 7 + 4, 32 * 8 + 4),
        );
        const sixthParamDataLength = hex.encode(
            finished.slice(32 * 8 + 4, 32 * 9 + 4),
        );
        const sixthParamFirstElOff = hex.encode(
            finished.slice(32 * 9 + 4, 32 * 10 + 4),
        );
        const sixthParamSecondElOff = hex.encode(
            finished.slice(32 * 10 + 4, 32 * 11 + 4),
        );
        const sixthParamFirstElLen = hex.encode(
            finished.slice(32 * 11 + 4, 32 * 12 + 4),
        );
        const sixthParamFirstEl = hex.encode(
            finished.slice(32 * 12 + 4, 32 * 13 + 4),
        );
        const sixthParamSecondElLen = hex.encode(
            finished.slice(32 * 13 + 4, 32 * 14 + 4),
        );
        const sixthParamSecondEl = hex.encode(
            finished.slice(32 * 14 + 4, 32 * 15 + 4),
        );
        expect(funcHash).to.be.equal("a27fc6f6");
        expect(firstParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000001020304",
        );
        expect(secondParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000001020304",
        );
        expect(thirdParam).to.be.equal(
            "0000000000000000000000000000000000000000000000007fffffffffffffff",
        );
        expect(forthParam).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000000c0",
        );
        expect(fifthParam).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000005eb",
        );
        expect(sixthParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000100",
        );
        expect(fourthParamDataLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000014",
        );
        expect(fourthParamData).to.be.equal(
            "746869732069732061206772696e3a20f09f9881000000000000000000000000",
        );
        expect(sixthParamDataLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(sixthParamFirstElOff).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000040",
        );
        expect(sixthParamSecondElOff).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000080",
        );
        expect(sixthParamFirstElLen).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000003",
        );
        expect(sixthParamFirstEl).to.be.equal(
            "6f6e650000000000000000000000000000000000000000000000000000000000",
        );
        expect(sixthParamSecondElLen).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000003",
        );
        expect(sixthParamSecondEl).to.be.equal(
            "74776f0000000000000000000000000000000000000000000000000000000000",
        );
        expect(finished.length).to.be.equal(484);
    });

    it("encodes correctly without name", function () {
        const params = new ContractFunctionParameters()
            .addInt32(int32)
            .addInt32(int32)
            .addInt64(maxInt64)
            .addString(str)
            .addInt32(1515)
            .addStringArray(strArray);

        const finished = params._build(null);
        const firstParam = hex.encode(finished.slice(32 * 0, 32 * 1));
        const secondParam = hex.encode(finished.slice(32 * 1, 32 * 2));
        const thirdParam = hex.encode(finished.slice(32 * 2, 32 * 3));
        const forthParam = hex.encode(finished.slice(32 * 3, 32 * 4));
        const fifthParam = hex.encode(finished.slice(32 * 4, 32 * 5));
        const sixthParam = hex.encode(finished.slice(32 * 5, 32 * 6));
        const fourthParamDataLength = hex.encode(
            finished.slice(32 * 6, 32 * 7),
        );
        const fourthParamData = hex.encode(finished.slice(32 * 7, 32 * 8));
        const sixthParamDataLength = hex.encode(finished.slice(32 * 8, 32 * 9));
        const sixthParamFirstElOff = hex.encode(
            finished.slice(32 * 9, 32 * 10),
        );
        const sixthParamSecondElOff = hex.encode(
            finished.slice(32 * 10, 32 * 11),
        );
        const sixthParamFirstElLen = hex.encode(
            finished.slice(32 * 11, 32 * 12),
        );
        const sixthParamFirstEl = hex.encode(finished.slice(32 * 12, 32 * 13));
        const sixthParamSecondElLen = hex.encode(
            finished.slice(32 * 13, 32 * 14),
        );
        const sixthParamSecondEl = hex.encode(finished.slice(32 * 14, 32 * 15));
        expect(firstParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000001020304",
        );
        expect(secondParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000001020304",
        );
        expect(thirdParam).to.be.equal(
            "0000000000000000000000000000000000000000000000007fffffffffffffff",
        );
        expect(forthParam).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000000c0",
        );
        expect(fifthParam).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000005eb",
        );
        expect(sixthParam).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000100",
        );
        expect(fourthParamDataLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000014",
        );
        expect(fourthParamData).to.be.equal(
            "746869732069732061206772696e3a20f09f9881000000000000000000000000",
        );
        expect(sixthParamDataLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(sixthParamFirstElOff).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000040",
        );
        expect(sixthParamSecondElOff).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000080",
        );
        expect(sixthParamFirstElLen).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000003",
        );
        expect(sixthParamFirstEl).to.be.equal(
            "6f6e650000000000000000000000000000000000000000000000000000000000",
        );
        expect(sixthParamSecondElLen).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000003",
        );
        expect(sixthParamSecondEl).to.be.equal(
            "74776f0000000000000000000000000000000000000000000000000000000000",
        );
        expect(finished.length).to.be.equal(480);
    });

    it("encodes address", function () {
        const params = new ContractFunctionParameters().addAddress(
            "888937961a6E3D313e481a2c5BAd9791fD11ea5b",
        );

        const finished = params._build(null);
        const firstParam = hex.encode(finished.slice(32 * 0, 32 * 1));
        expect(firstParam).to.be.equal(
            "000000000000000000000000888937961a6e3d313e481a2c5bad9791fd11ea5b",
        );
        expect(finished.length).to.be.equal(32);
    });

    it("encodes address with 0x prefix", function () {
        const params = new ContractFunctionParameters().addAddress(
            "0x888937961a6E3D313e481a2c5BAd9791fD11ea5b",
        );

        const finished = params._build(null);
        const firstParam = hex.encode(finished.slice(32 * 0, 32 * 1));
        expect(firstParam).to.be.equal(
            "000000000000000000000000888937961a6e3d313e481a2c5bad9791fd11ea5b",
        );
        expect(finished.length).to.be.equal(32);
    });

    it("encodes arrays correctly", function () {
        const params = new ContractFunctionParameters()
            .addInt256(maxInt64)
            .addInt32Array([1111, 2222])
            .addInt64Array([new BigNumber(3333), new BigNumber(4444)])
            .addInt256Array([new BigNumber(5555), new BigNumber(6666)])
            .addAddressArray([
                "888937961a6E3D313e481a2c5BAd9791fD11ea5b",
                "ffffffffffffffffffffffffffffffffffffffff",
            ])
            .addInt256Array([new BigNumber(7777), new BigNumber(8888)]);

        const finished = params._build(null);
        const firstParam = hex.encode(finished.slice(32 * 0, 32 * 1));
        const secondOffset = hex.encode(finished.slice(32 * 1, 32 * 2));
        const thirdOffset = hex.encode(finished.slice(32 * 2, 32 * 3));
        const forthOffset = hex.encode(finished.slice(32 * 3, 32 * 4));
        const fifthOffset = hex.encode(finished.slice(32 * 4, 32 * 5));
        const sixthOffset = hex.encode(finished.slice(32 * 5, 32 * 6));
        const secondLength = hex.encode(finished.slice(32 * 6, 32 * 7));
        const secondFirstValue = hex.encode(finished.slice(32 * 7, 32 * 8));
        const secondSecondValue = hex.encode(finished.slice(32 * 8, 32 * 9));
        const thirdLength = hex.encode(finished.slice(32 * 9, 32 * 10));
        const thirdFirstValue = hex.encode(finished.slice(32 * 10, 32 * 11));
        const thirdSecondValue = hex.encode(finished.slice(32 * 11, 32 * 12));
        const forthLength = hex.encode(finished.slice(32 * 12, 32 * 13));
        const forthFirstValue = hex.encode(finished.slice(32 * 13, 32 * 14));
        const forthSecondValue = hex.encode(finished.slice(32 * 14, 32 * 15));
        const fifthLength = hex.encode(finished.slice(32 * 15, 32 * 16));
        const fifthFirstValue = hex.encode(finished.slice(32 * 16, 32 * 17));
        const fifthSecondValue = hex.encode(finished.slice(32 * 17, 32 * 18));
        const sixthLength = hex.encode(finished.slice(32 * 18, 32 * 19));
        const sixthFirstValue = hex.encode(finished.slice(32 * 19, 32 * 20));
        const sixthSecondValue = hex.encode(finished.slice(32 * 20, 32 * 21));
        expect(firstParam).to.be.equal(
            "0000000000000000000000000000000000000000000000007fffffffffffffff",
        );
        expect(secondOffset).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000000c0",
        );
        expect(thirdOffset).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000120",
        );
        expect(forthOffset).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000180",
        );
        expect(fifthOffset).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000001e0",
        );
        expect(sixthOffset).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000240",
        );
        expect(secondLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(secondFirstValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000457",
        );
        expect(secondSecondValue).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000008ae",
        );
        expect(thirdLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(thirdFirstValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000d05",
        );
        expect(thirdSecondValue).to.be.equal(
            "000000000000000000000000000000000000000000000000000000000000115c",
        );
        expect(forthLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(forthFirstValue).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000015b3",
        );
        expect(forthSecondValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000001a0a",
        );
        expect(fifthLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(fifthFirstValue).to.be.equal(
            "000000000000000000000000888937961a6e3d313e481a2c5bad9791fd11ea5b",
        );
        expect(fifthSecondValue).to.be.equal(
            "000000000000000000000000ffffffffffffffffffffffffffffffffffffffff",
        );
        expect(sixthLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(sixthFirstValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000001e61",
        );
        expect(sixthSecondValue).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000022b8",
        );
        expect(finished.length).to.be.equal(672);
    });

    it("encodes uint arrays correctly", function () {
        const params = new ContractFunctionParameters()
            .addUint256(maxInt64)
            .addUint32Array([1111, 2222])
            .addUint64Array([new BigNumber(3333), new BigNumber(4444)])
            .addUint256Array([new BigNumber(5555), new BigNumber(6666)])
            .addAddressArray([
                "888937961a6E3D313e481a2c5BAd9791fD11ea5b",
                "ffffffffffffffffffffffffffffffffffffffff",
            ])
            .addUint256Array([new BigNumber(7777), new BigNumber(8888)]);

        const finished = params._build(null);
        const firstParam = hex.encode(finished.slice(32 * 0, 32 * 1));
        const secondOffset = hex.encode(finished.slice(32 * 1, 32 * 2));
        const thirdOffset = hex.encode(finished.slice(32 * 2, 32 * 3));
        const forthOffset = hex.encode(finished.slice(32 * 3, 32 * 4));
        const fifthOffset = hex.encode(finished.slice(32 * 4, 32 * 5));
        const sixthOffset = hex.encode(finished.slice(32 * 5, 32 * 6));
        const secondLength = hex.encode(finished.slice(32 * 6, 32 * 7));
        const secondFirstValue = hex.encode(finished.slice(32 * 7, 32 * 8));
        const secondSecondValue = hex.encode(finished.slice(32 * 8, 32 * 9));
        const thirdLength = hex.encode(finished.slice(32 * 9, 32 * 10));
        const thirdFirstValue = hex.encode(finished.slice(32 * 10, 32 * 11));
        const thirdSecondValue = hex.encode(finished.slice(32 * 11, 32 * 12));
        const forthLength = hex.encode(finished.slice(32 * 12, 32 * 13));
        const forthFirstValue = hex.encode(finished.slice(32 * 13, 32 * 14));
        const forthSecondValue = hex.encode(finished.slice(32 * 14, 32 * 15));
        const fifthLength = hex.encode(finished.slice(32 * 15, 32 * 16));
        const fifthFirstValue = hex.encode(finished.slice(32 * 16, 32 * 17));
        const fifthSecondValue = hex.encode(finished.slice(32 * 17, 32 * 18));
        const sixthLength = hex.encode(finished.slice(32 * 18, 32 * 19));
        const sixthFirstValue = hex.encode(finished.slice(32 * 19, 32 * 20));
        const sixthSecondValue = hex.encode(finished.slice(32 * 20, 32 * 21));
        expect(firstParam).to.be.equal(
            "0000000000000000000000000000000000000000000000007fffffffffffffff",
        );
        expect(secondOffset).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000000c0",
        );
        expect(thirdOffset).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000120",
        );
        expect(forthOffset).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000180",
        );
        expect(fifthOffset).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000001e0",
        );
        expect(sixthOffset).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000240",
        );
        expect(secondLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(secondFirstValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000457",
        );
        expect(secondSecondValue).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000008ae",
        );
        expect(thirdLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(thirdFirstValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000d05",
        );
        expect(thirdSecondValue).to.be.equal(
            "000000000000000000000000000000000000000000000000000000000000115c",
        );
        expect(forthLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(forthFirstValue).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000015b3",
        );
        expect(forthSecondValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000001a0a",
        );
        expect(fifthLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(fifthFirstValue).to.be.equal(
            "000000000000000000000000888937961a6e3d313e481a2c5bad9791fd11ea5b",
        );
        expect(fifthSecondValue).to.be.equal(
            "000000000000000000000000ffffffffffffffffffffffffffffffffffffffff",
        );
        expect(sixthLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );
        expect(sixthFirstValue).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000001e61",
        );
        expect(sixthSecondValue).to.be.equal(
            "00000000000000000000000000000000000000000000000000000000000022b8",
        );
        expect(finished.length).to.be.equal(672);
    });

    it("encodes bytes32 correctly", function () {
        const bytes = new Uint8Array(32);
        bytes.set([0xff, 0xff], 10);

        const params = new ContractFunctionParameters().addBytes32(bytes);

        const finished = params._build(null);
        const firstParam = hex.encode(finished.slice(32 * 0, 32 * 1));
        expect(firstParam).to.be.equal(
            "00000000000000000000ffff0000000000000000000000000000000000000000",
        );
        expect(finished.length).to.be.equal(32);
    });

    it("encodes bytes of size > 32 and size % 32 === 0 correctly", function () {
        const bytes = new Uint8Array(64);
        bytes.set([0xff, 0xff], 10);

        const params = new ContractFunctionParameters().addBytes(bytes);

        const finished = params._build(null);
        const firstOffset = hex.encode(finished.slice(32 * 0, 32 * 1));
        const firstLength = hex.encode(finished.slice(32 * 1, 32 * 2));
        const firstValuePart1 = hex.encode(finished.slice(32 * 2, 32 * 3));
        const firstValuePart2 = hex.encode(finished.slice(32 * 3, 32 * 4));
        expect(firstOffset).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000020",
        );
        expect(firstLength).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000040",
        );
        expect(firstValuePart1).to.be.equal(
            "00000000000000000000ffff0000000000000000000000000000000000000000",
        );
        expect(firstValuePart2).to.be.equal(
            "0000000000000000000000000000000000000000000000000000000000000000",
        );
        expect(finished.length).to.be.equal(128);
    });
});
