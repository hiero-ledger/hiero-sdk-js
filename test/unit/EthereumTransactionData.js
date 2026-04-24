import * as hex from "../../src/encoding/hex.js";
import { EthereumTransactionData } from "../../src/index.js";
import { encodeRlp, decodeRlp } from "ethers";
import EthereumTransactionDataEip2930 from "../../src/EthereumTransactionDataEip2930.js";
import EthereumTransactionDataEip1559 from "../../src/EthereumTransactionDataEip1559.js";
import EthereumTransactionDataEip7702 from "../../src/EthereumTransactionDataEip7702.js";

const rawTxType0 = hex.decode(
    "f864012f83018000947e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc18180827653820277a0f9fbff985d374be4a55f296915002eec11ac96f1ce2df183adf992baa9390b2fa00c1e867cc960d9c74ec2e6a662b7908ec4c8cc9f3091e886bcefbeb2290fb792",
);

const rawTxType1 = hex.decode(
    "01f85f01010a0a9400000000000000000000000000000000000000010a80c080a038ba8bdbcd8684ff089b8efaf7b5aaf2071a11ab01b6cc65757af79f1199f2efa0570b83f85d578427becab466ced52da857e2a9e48bf9ec5850cc2f541e9305e9",
);

// These byte fail to be decoded by @ethersproject/rlp
// const rawTxType0TrimmedLastBytes =
//                 hex.decode("f864012f83018000947e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc18180827653820277a0f9fbff985d374be4a55f296915002eec11ac96f1ce2df183adf992baa9390b2fa00c1e867cc960d9c74ec2e6a662b7908ec4c8cc9f3091e886bcefbeb2290000");
//
const rawTxType2 = hex.decode(
    "02f87082012a022f2f83018000947e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181880de0b6b3a764000083123456c001a0df48f2efd10421811de2bfb125ab75b2d3c44139c4642837fb1fccce911fd479a01aaf7ae92bee896651dfc9d99ae422a296bf5d9f1ca49b2d96d82b79eb112d66",
);

describe("EthereumTransactionData", function () {
    it("can decode and encode back into original bytes", function () {
        expect(
            EthereumTransactionData.fromBytes(rawTxType0).toBytes(),
        ).to.deep.equal(rawTxType0);
        expect(
            EthereumTransactionData.fromBytes(rawTxType1).toBytes(),
        ).to.deep.equal(rawTxType1);
        expect(
            EthereumTransactionData.fromBytes(rawTxType2).toBytes(),
        ).to.deep.equal(rawTxType2);
    });

    describe("RLP access list structure", function () {
        it("decodeRlp returns access list as [address, storageKeys[]] tuples, not flat strings", function () {
            const address = hex.decode(
                "0000000000000000000000000000000000000001",
            );
            const storageKey1 = hex.decode(
                "0000000000000000000000000000000000000000000000000000000000000001",
            );
            const storageKey2 = hex.decode(
                "0000000000000000000000000000000000000000000000000000000000000002",
            );

            // Build a type-1 (EIP-2930) RLP payload with a non-empty access list
            const accessList = [[address, [storageKey1, storageKey2]]];
            const rlp = encodeRlp([
                hex.decode("01"), // chainId
                hex.decode("00"), // nonce
                hex.decode("0a"), // gasPrice
                hex.decode("0a"), // gasLimit
                hex.decode("0000000000000000000000000000000000000001"), // to
                hex.decode("00"), // value
                new Uint8Array(), // callData
                accessList,
                hex.decode("00"), // v
                hex.decode(
                    "38ba8bdbcd8684ff089b8efaf7b5aaf2071a11ab01b6cc65757af79f1199f2ef",
                ), // r
                hex.decode(
                    "570b83f85d578427becab466ced52da857e2a9e48bf9ec5850cc2f541e9305e9",
                ), // s
            ]);

            // Decode the raw RLP and inspect the access list field (index 7)
            const decoded = decodeRlp(rlp);
            const rawAccessList = decoded[7];

            // Prove it is NOT a flat array of strings
            expect(rawAccessList).to.be.an("array");
            expect(rawAccessList.length).to.equal(1);

            // Each entry is a tuple: [addressHex, [storageKeyHex, ...]]
            const entry = rawAccessList[0];
            expect(entry).to.be.an("array");
            expect(entry.length).to.equal(2);

            // First element is the address (hex string)
            expect(typeof entry[0]).to.equal("string");

            // Second element is an array of storage keys, NOT a string
            expect(entry[1]).to.be.an("array");
            expect(entry[1].length).to.equal(2);
            expect(typeof entry[1][0]).to.equal("string");
            expect(typeof entry[1][1]).to.equal("string");
        });

        it("fromBytes correctly parses a raw EIP-1559 tx with non-empty access list", function () {
            const address = hex.decode(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
            const storageKey = hex.decode(
                "0000000000000000000000000000000000000000000000000000000000000000",
            );

            // Build a type-2 (EIP-1559) raw transaction with access list
            const accessList = [[address, [storageKey]]];
            const rlpPayload = encodeRlp([
                hex.decode("012a"), // chainId
                hex.decode("02"), // nonce
                hex.decode("2f"), // maxPriorityGas
                hex.decode("2f"), // maxGas
                hex.decode("018000"), // gasLimit
                address, // to
                hex.decode("0de0b6b3a7640000"), // value
                hex.decode("123456"), // callData
                accessList,
                hex.decode("01"), // v
                hex.decode(
                    "df48f2efd10421811de2bfb125ab75b2d3c44139c4642837fb1fccce911fd479",
                ), // r
                hex.decode(
                    "1aaf7ae92bee896651dfc9d99ae422a296bf5d9f1ca49b2d96d82b79eb112d66",
                ), // s
            ]);

            // Prepend type byte 0x02
            const rawTx = hex.decode("02" + rlpPayload.substring(2));

            // fromBytes must not throw
            const txData = EthereumTransactionData.fromBytes(rawTx);

            // Access list must be parsed as [Uint8Array, Uint8Array[]] tuples
            expect(txData.accessList).to.be.an("array");
            expect(txData.accessList.length).to.equal(1);
            expect(txData.accessList[0][0]).to.be.instanceOf(Uint8Array);
            expect(hex.encode(txData.accessList[0][0])).to.equal(
                hex.encode(address),
            );
            expect(txData.accessList[0][1]).to.be.an("array");
            expect(txData.accessList[0][1].length).to.equal(1);
            expect(txData.accessList[0][1][0]).to.be.instanceOf(Uint8Array);
            expect(hex.encode(txData.accessList[0][1][0])).to.equal(
                hex.encode(storageKey),
            );
        });
    });

    describe("EthereumTransactionDataEip2930 access list", function () {
        it("toBytes and fromBytes preserve non-empty access list", function () {
            const address1 = hex.decode(
                "0000000000000000000000000000000000000001",
            );
            const storageKey1 = hex.decode(
                "0000000000000000000000000000000000000000000000000000000000000001",
            );
            const storageKey2 = hex.decode(
                "0000000000000000000000000000000000000000000000000000000000000002",
            );

            const original = new EthereumTransactionDataEip2930({
                chainId: hex.decode("01"),
                nonce: hex.decode("01"),
                gasPrice: hex.decode("0a"),
                gasLimit: hex.decode("0a"),
                to: hex.decode("0000000000000000000000000000000000000001"),
                value: hex.decode("0a"),
                callData: new Uint8Array(),
                accessList: [[address1, [storageKey1, storageKey2]]],
                recId: hex.decode("00"),
                r: hex.decode(
                    "38ba8bdbcd8684ff089b8efaf7b5aaf2071a11ab01b6cc65757af79f1199f2ef",
                ),
                s: hex.decode(
                    "570b83f85d578427becab466ced52da857e2a9e48bf9ec5850cc2f541e9305e9",
                ),
            });

            const bytes = original.toBytes();
            const decoded = EthereumTransactionDataEip2930.fromBytes(bytes);

            expect(decoded.accessList).to.be.an("array");
            expect(decoded.accessList.length).to.equal(1);
            expect(hex.encode(decoded.accessList[0][0])).to.equal(
                hex.encode(address1),
            );
            expect(decoded.accessList[0][1].length).to.equal(2);
            expect(hex.encode(decoded.accessList[0][1][0])).to.equal(
                hex.encode(storageKey1),
            );
            expect(hex.encode(decoded.accessList[0][1][1])).to.equal(
                hex.encode(storageKey2),
            );

            // Verify roundtrip
            expect(decoded.toBytes()).to.deep.equal(bytes);
        });

        it("toJSON produces correct access list format", function () {
            const address1 = hex.decode(
                "0000000000000000000000000000000000000001",
            );
            const storageKey1 = hex.decode(
                "0000000000000000000000000000000000000000000000000000000000000001",
            );

            const tx = new EthereumTransactionDataEip2930({
                chainId: hex.decode("01"),
                nonce: hex.decode("01"),
                gasPrice: hex.decode("0a"),
                gasLimit: hex.decode("0a"),
                to: hex.decode("0000000000000000000000000000000000000001"),
                value: hex.decode("0a"),
                callData: new Uint8Array(),
                accessList: [[address1, [storageKey1]]],
                recId: hex.decode("00"),
                r: hex.decode(
                    "38ba8bdbcd8684ff089b8efaf7b5aaf2071a11ab01b6cc65757af79f1199f2ef",
                ),
                s: hex.decode(
                    "570b83f85d578427becab466ced52da857e2a9e48bf9ec5850cc2f541e9305e9",
                ),
            });

            const json = tx.toJSON();
            expect(json.accessList).to.be.an("array");
            expect(json.accessList[0]).to.have.property("address");
            expect(json.accessList[0]).to.have.property("storageKeys");
            expect(json.accessList[0].storageKeys).to.be.an("array");
        });
    });

    describe("EthereumTransactionDataEip1559 access list", function () {
        it("toBytes and fromBytes preserve non-empty access list", function () {
            const address1 = hex.decode(
                "0000000000000000000000000000000000000001",
            );
            const storageKey1 = hex.decode(
                "0000000000000000000000000000000000000000000000000000000000000001",
            );

            const original = new EthereumTransactionDataEip1559({
                chainId: hex.decode("012a"),
                nonce: hex.decode("02"),
                maxPriorityGas: hex.decode("2f"),
                maxGas: hex.decode("2f"),
                gasLimit: hex.decode("018000"),
                to: hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181"),
                value: hex.decode("0de0b6b3a7640000"),
                callData: hex.decode("123456"),
                accessList: [[address1, [storageKey1]]],
                recId: hex.decode("01"),
                r: hex.decode(
                    "df48f2efd10421811de2bfb125ab75b2d3c44139c4642837fb1fccce911fd479",
                ),
                s: hex.decode(
                    "1aaf7ae92bee896651dfc9d99ae422a296bf5d9f1ca49b2d96d82b79eb112d66",
                ),
            });

            const bytes = original.toBytes();
            const decoded = EthereumTransactionDataEip1559.fromBytes(bytes);

            expect(decoded.accessList).to.be.an("array");
            expect(decoded.accessList.length).to.equal(1);
            expect(hex.encode(decoded.accessList[0][0])).to.equal(
                hex.encode(address1),
            );
            expect(decoded.accessList[0][1].length).to.equal(1);
            expect(hex.encode(decoded.accessList[0][1][0])).to.equal(
                hex.encode(storageKey1),
            );

            // Verify roundtrip
            expect(decoded.toBytes()).to.deep.equal(bytes);
        });
    });

    describe("EthereumTransactionDataEip7702", function () {
        it("toBytes and fromBytes preserve all field values", function () {
            // Create test data similar to integration test
            const chainId = hex.decode("012a");
            const nonce = hex.decode("00");
            const maxPriorityGas = hex.decode("01");
            const maxGas = hex.decode("d1385c7bf0");
            const gasLimit = hex.decode("07A120");
            const value = new Uint8Array();
            const to = hex.decode("00000000000000000000000000000000000003f9");
            const callData = hex.decode("123456");

            // Empty access list
            const accessList = [];

            // Authorization list: [[chainId, contractAddress, nonce, yParity, r, s]]
            const authChainId = hex.decode("012a");
            const authContractAddress = hex.decode(
                "00000000000000000000000000000000000003f9",
            );
            const authNonce = hex.decode("00");
            const authYParity = hex.decode("01");
            const authR = hex.decode(
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            );
            const authS = hex.decode(
                "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            );
            const authorizationList = [
                [
                    authChainId,
                    authContractAddress,
                    authNonce,
                    authYParity,
                    authR,
                    authS,
                ],
            ];

            // Transaction signature
            const recId = hex.decode("01");
            const r = hex.decode(
                "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            );
            const s = hex.decode(
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            );

            // Create original instance
            const original = new EthereumTransactionDataEip7702({
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                authorizationList,
                accessList,
                recId,
                r,
                s,
            });

            // Convert to bytes and back
            const bytes = original.toBytes();
            const decoded = EthereumTransactionDataEip7702.fromBytes(bytes);

            // Verify all fields match
            expect(hex.encode(decoded.chainId)).to.equal(hex.encode(chainId));
            expect(hex.encode(decoded.nonce)).to.equal(hex.encode(nonce));
            expect(hex.encode(decoded.maxPriorityGas)).to.equal(
                hex.encode(maxPriorityGas),
            );
            expect(hex.encode(decoded.maxGas)).to.equal(hex.encode(maxGas));
            expect(hex.encode(decoded.gasLimit)).to.equal(hex.encode(gasLimit));
            expect(hex.encode(decoded.to)).to.equal(hex.encode(to));
            expect(hex.encode(decoded.value)).to.equal(hex.encode(value));
            expect(hex.encode(decoded.callData)).to.equal(hex.encode(callData));
            expect(hex.encode(decoded.recId)).to.equal(hex.encode(recId));
            expect(hex.encode(decoded.r)).to.equal(hex.encode(r));
            expect(hex.encode(decoded.s)).to.equal(hex.encode(s));

            // Verify access list
            expect(decoded.accessList).to.be.an("array");
            expect(decoded.accessList.length).to.equal(accessList.length);

            // Verify authorization list
            expect(decoded.authorizationList).to.be.an("array");
            expect(decoded.authorizationList.length).to.equal(1);
            const decodedAuth = decoded.authorizationList[0];
            expect(decodedAuth).to.be.an("array");
            expect(decodedAuth.length).to.equal(6);
            expect(hex.encode(decodedAuth[0])).to.equal(
                hex.encode(authChainId),
            );
            expect(hex.encode(decodedAuth[1])).to.equal(
                hex.encode(authContractAddress),
            );
            expect(hex.encode(decodedAuth[2])).to.equal(hex.encode(authNonce));
            expect(hex.encode(decodedAuth[3])).to.equal(
                hex.encode(authYParity),
            );
            expect(hex.encode(decodedAuth[4])).to.equal(hex.encode(authR));
            expect(hex.encode(decodedAuth[5])).to.equal(hex.encode(authS));

            // Verify roundtrip: bytes should match
            const roundtripBytes = decoded.toBytes();
            expect(roundtripBytes).to.deep.equal(bytes);
        });

        it("toBytes and fromBytes preserve empty authorization list", function () {
            const chainId = hex.decode("012a");
            const nonce = hex.decode("00");
            const maxPriorityGas = hex.decode("01");
            const maxGas = hex.decode("d1385c7bf0");
            const gasLimit = hex.decode("07A120");
            const value = new Uint8Array();
            const to = hex.decode("00000000000000000000000000000000000003f9");
            const callData = hex.decode("123456");
            const accessList = [];
            const authorizationList = []; // Empty authorization list
            const recId = hex.decode("00");
            const r = hex.decode(
                "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            );
            const s = hex.decode(
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            );

            const original = new EthereumTransactionDataEip7702({
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                authorizationList,
                accessList,
                recId,
                r,
                s,
            });

            const bytes = original.toBytes();
            const decoded = EthereumTransactionDataEip7702.fromBytes(bytes);

            expect(decoded.authorizationList).to.be.an("array");
            expect(decoded.authorizationList.length).to.equal(0);
            expect(decoded.accessList).to.be.an("array");
            expect(decoded.accessList.length).to.equal(0);
        });

        it("toBytes and fromBytes preserve multiple authorization entries", function () {
            const chainId = hex.decode("012a");
            const nonce = hex.decode("00");
            const maxPriorityGas = hex.decode("01");
            const maxGas = hex.decode("d1385c7bf0");
            const gasLimit = hex.decode("07A120");
            const value = new Uint8Array();
            const to = hex.decode("00000000000000000000000000000000000003f9");
            const callData = hex.decode("123456");
            const accessList = [];

            // Multiple authorization entries
            const authorizationList = [
                [
                    hex.decode("012a"),
                    hex.decode("00000000000000000000000000000000000003f9"),
                    hex.decode("00"),
                    hex.decode("01"),
                    hex.decode(
                        "1111111111111111111111111111111111111111111111111111111111111111",
                    ),
                    hex.decode(
                        "2222222222222222222222222222222222222222222222222222222222222222",
                    ),
                ],
                [
                    hex.decode("012a"),
                    hex.decode("00000000000000000000000000000000000004fa"),
                    hex.decode("01"),
                    hex.decode("00"),
                    hex.decode(
                        "3333333333333333333333333333333333333333333333333333333333333333",
                    ),
                    hex.decode(
                        "4444444444444444444444444444444444444444444444444444444444444444",
                    ),
                ],
            ];

            const recId = hex.decode("01");
            const r = hex.decode(
                "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            );
            const s = hex.decode(
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            );

            const original = new EthereumTransactionDataEip7702({
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                authorizationList,
                accessList,
                recId,
                r,
                s,
            });

            const bytes = original.toBytes();
            const decoded = EthereumTransactionDataEip7702.fromBytes(bytes);

            expect(decoded.authorizationList.length).to.equal(2);
            expect(hex.encode(decoded.authorizationList[0][1])).to.equal(
                hex.encode(authorizationList[0][1]),
            );
            expect(hex.encode(decoded.authorizationList[1][1])).to.equal(
                hex.encode(authorizationList[1][1]),
            );
        });
    });
});
