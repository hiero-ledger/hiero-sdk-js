import {
    AccountId,
    ContractFunctionResult,
    ContractId,
    ContractNonceInfo,
} from "../../src/exports.js";
import * as hex from "../../src/encoding/hex.js";

describe("ContractFunctionResult", function () {
    it("provides results correctly", async function () {
        const CALL_RESULT_HEX =
            "00000000000000000000000000000000000000000000000000000000ffffffff" +
            "7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" +
            "00000000000000000000000011223344556677889900aabbccddeeff00112233" +
            "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" +
            "00000000000000000000000000000000000000000000000000000000000000c0" +
            "0000000000000000000000000000000000000000000000000000000000000100" +
            "000000000000000000000000000000000000000000000000000000000000000d" +
            "48656c6c6f2c20776f726c642100000000000000000000000000000000000000" +
            "0000000000000000000000000000000000000000000000000000000000000014" +
            "48656c6c6f2c20776f726c642c20616761696e21000000000000000000000000";

        const callResult = hex.decode(CALL_RESULT_HEX);
        const evmAddress = hex.decode(
            "98329e006610472e6B372C080833f6D79ED833cf",
        );
        const nonce = new ContractNonceInfo({
            contractId: AccountId.fromString("1.2.3"),
            nonce: 10,
        });

        const result = new ContractFunctionResult({
            contractId: ContractId.fromString("1.2.3")._toProtobuf(),
            bytes: callResult,
            evmAddress: evmAddress,
            senderAccountId: AccountId.fromString("1.2.3")._toProtobuf(),
            contractNonces: [nonce],
        });

        expect(result.getBool(0)).to.be.true;
        expect(result.getInt32(0)).to.be.equal(-1);
        expect(result.getInt64(0).toString()).to.be.equal("4294967295");
        expect(result.getInt256(0).toString()).to.be.equal("4294967295");
        expect(result.getInt256(1).toString()).to.be.equal(
            "5.7896044618658097711785492504343953926634992332820282019728792003956564819967e+76",
        );
        expect(result.getAddress(2)).to.be.equal(
            "11223344556677889900aabbccddeeff00112233",
        );

        //expect(result.getUint32(3)).to.be.equal(-1);
        //expect(result.getUint64(3)).to.be.equal(-1);
        expect(result.getUint256(3).toString()).to.be.equal(
            "1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77",
        );

        expect(result.getString(4)).to.be.equal("Hello, world!");
        expect(result.getString(5)).to.be.equal("Hello, world, again!");

        expect(result.senderAccountId.toString()).to.be.equal(
            AccountId.fromString("1.2.3")._toProtobuf().toString(),
        );
        expect(result.contractId.toString()).to.be.equal(
            ContractId.fromString("1.2.3")._toProtobuf().toString(),
        );
        expect(result.evmAddress).to.be.equal(evmAddress);
        expect(result.contractNonces).to.include(nonce);
    });
});
