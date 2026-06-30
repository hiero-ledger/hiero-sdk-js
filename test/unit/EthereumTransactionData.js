import * as hex from "../../src/encoding/hex.js";
import { EthereumTransactionData, PrivateKey } from "../../src/index.js";
import { encodeRlp, decodeRlp } from "ethers";
import Long from "long";
import BigNumber from "bignumber.js";
import EvmAddress from "../../src/EvmAddress.js";
import AccessListItem from "../../src/AccessListItem.js";
import Authorization from "../../src/Authorization.js";
import EthereumTransactionDataLegacy from "../../src/EthereumTransactionDataLegacy.js";
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

    describe("sign", function () {
        const chainId = hex.decode("012a");
        const nonce = hex.decode("02");
        const gasPrice = hex.decode("2f");
        const maxPriorityGas = hex.decode("2f");
        const maxGas = hex.decode("2f");
        const gasLimit = hex.decode("018000");
        const to = hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181");
        const value = hex.decode("0de0b6b3a7640000");
        const callData = hex.decode("123456");
        const accessList = [];
        const authorizationList = [];
        // Unsigned placeholders, overwritten by sign()
        const empty = new Uint8Array();

        function buildLegacy() {
            return new EthereumTransactionDataLegacy({
                nonce,
                gasPrice,
                gasLimit,
                to,
                value,
                callData,
                v: empty,
                r: empty,
                s: empty,
            });
        }

        function buildEip2930() {
            return new EthereumTransactionDataEip2930({
                chainId,
                nonce,
                gasPrice,
                gasLimit,
                to,
                value,
                callData,
                accessList,
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        function buildEip1559() {
            return new EthereumTransactionDataEip1559({
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        function buildEip7702() {
            return new EthereumTransactionDataEip7702({
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
                authorizationList,
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        /**
         * Asserts that `data.r`/`data.s` form a valid ECDSA signature for `key`
         * over the given unsigned message, and that they are 32 bytes each.
         */
        function expectValidSignature(key, data, message) {
            expect(data.r).to.be.instanceOf(Uint8Array);
            expect(data.s).to.be.instanceOf(Uint8Array);
            expect(data.r.length).to.equal(32);
            expect(data.s.length).to.equal(32);

            const signature = new Uint8Array(64);
            signature.set(data.r, 0);
            signature.set(data.s, 32);
            expect(key.publicKey.verify(message, signature)).to.be.true;
        }

        it("legacy sign() sets v = 27 + recoveryId and a recoverable r/s", function () {
            const key = PrivateKey.generateECDSA();
            const data = buildLegacy();

            expect(data.sign(key)).to.equal(data);

            const message = hex.decode(
                encodeRlp([nonce, gasPrice, gasLimit, to, value, callData]),
            );
            expectValidSignature(key, data, message);
            expect(data.v.length).to.equal(1);
            expect(data.v[0]).to.be.oneOf([27, 28]);
        });

        it("EIP-2930 sign() sets recId and a recoverable r/s", function () {
            const key = PrivateKey.generateECDSA();
            const data = buildEip2930();

            expect(data.sign(key)).to.equal(data);

            const encoded = encodeRlp([
                chainId,
                nonce,
                gasPrice,
                gasLimit,
                to,
                value,
                callData,
                accessList,
            ]);
            const message = hex.decode("01" + encoded.substring(2));
            expectValidSignature(key, data, message);
            const recId = data.recId.length === 0 ? 0 : data.recId[0];
            expect(recId).to.be.oneOf([0, 1]);
        });

        it("EIP-1559 sign() sets recId and a recoverable r/s", function () {
            const key = PrivateKey.generateECDSA();
            const data = buildEip1559();

            expect(data.sign(key)).to.equal(data);

            const encoded = encodeRlp([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
            ]);
            const message = hex.decode("02" + encoded.substring(2));
            expectValidSignature(key, data, message);
            const recId = data.recId.length === 0 ? 0 : data.recId[0];
            expect(recId).to.be.oneOf([0, 1]);
        });

        it("EIP-7702 sign() sets recId and a recoverable r/s", function () {
            const key = PrivateKey.generateECDSA();
            const data = buildEip7702();

            expect(data.sign(key)).to.equal(data);

            const encoded = encodeRlp([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
                authorizationList,
            ]);
            const message = hex.decode("04" + encoded.substring(2));
            expectValidSignature(key, data, message);
            const recId = data.recId.length === 0 ? 0 : data.recId[0];
            expect(recId).to.be.oneOf([0, 1]);
        });

        it("throws when signing with a non-ECDSA (Ed25519) key", function () {
            const key = PrivateKey.generateED25519();

            expect(() => buildLegacy().sign(key)).to.throw();
            expect(() => buildEip2930().sign(key)).to.throw();
            expect(() => buildEip1559().sign(key)).to.throw();
            expect(() => buildEip7702().sign(key)).to.throw();
        });

        it("base EthereumTransactionData.sign() is abstract", function () {
            const base = new EthereumTransactionData({ callData });
            expect(() => base.sign(PrivateKey.generateECDSA())).to.throw(
                "not implemented",
            );
        });
    });

    describe("typed accessors (EIP-1559)", function () {
        const empty = new Uint8Array();
        function build() {
            return new EthereumTransactionDataEip1559({
                chainId: empty,
                nonce: empty,
                maxPriorityGas: empty,
                maxGas: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        it("uint64 fields round-trip through Long and raw bytes", function () {
            const d = build();
            d.setNonce(7)
                .setChainId(Long.fromNumber(298))
                .setGasLimit(new Uint8Array([0x01, 0x80, 0x00]));

            expect(d.getNonce().toString()).to.equal("7");
            expect(d.getChainId().toString()).to.equal("298");
            expect(d.getGasLimit().toNumber()).to.equal(0x018000);
            expect(hex.encode(d.getNonceBytes())).to.equal("07");

            // minimal encoding: zero -> empty bytes
            d.setNonce(0);
            expect(d.getNonceBytes().length).to.equal(0);
            expect(d.getNonce().toString()).to.equal("0");
        });

        it("uint256 fields round-trip through BigNumber", function () {
            const d = build();
            d.setValue(new BigNumber("1000000000000000000")); // 1 ether in wei
            expect(d.getValue().toFixed()).to.equal("1000000000000000000");
            expect(hex.encode(d.getValueBytes())).to.equal("0de0b6b3a7640000");

            d.setMaxGas(new BigNumber(1000000000));
            expect(d.getMaxGas().toFixed()).to.equal("1000000000");
        });

        it("address accessor accepts EvmAddress, bytes and 0x string", function () {
            const d = build();
            const addr = "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181";

            d.setTo("0x" + addr);
            expect(d.getTo()).to.be.instanceOf(EvmAddress);
            expect(d.getTo().toString()).to.equal(addr);

            d.setTo(EvmAddress.fromString("0x" + addr));
            expect(hex.encode(d.getToBytes())).to.equal(addr);

            d.setTo(hex.decode(addr));
            expect(d.getTo().toString()).to.equal(addr);
        });

        it("setters accept number | Long | BigNumber | Uint8Array | hex string", function () {
            const d = build();
            d.setNonce(5);
            expect(d.getNonce().toNumber()).to.equal(5);
            d.setNonce(Long.fromNumber(6));
            expect(d.getNonce().toNumber()).to.equal(6);
            d.setNonce(new BigNumber(7));
            expect(d.getNonce().toNumber()).to.equal(7);
            d.setNonce(new Uint8Array([8]));
            expect(d.getNonce().toNumber()).to.equal(8);
            d.setNonce("0x09");
            expect(d.getNonce().toNumber()).to.equal(9);
        });

        it("typed setters keep toBytes/fromBytes round-trip valid", function () {
            const d = build()
                .setChainId(298)
                .setNonce(2)
                .setMaxPriorityGas(new BigNumber(47))
                .setMaxGas(new BigNumber(47))
                .setGasLimit(0x018000)
                .setTo("0x7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181")
                .setValue(new BigNumber("1000000000000000000"))
                .setCallData("0x123456");

            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            expect(decoded.getChainId().toString()).to.equal("298");
            expect(decoded.getNonce().toString()).to.equal("2");
            expect(decoded.getValue().toFixed()).to.equal(
                "1000000000000000000",
            );
            expect(decoded.getTo().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
            expect(hex.encode(decoded.getCallData())).to.equal("123456");
        });
    });

    describe("typed accessors (EIP-2930, EIP-7702, Legacy)", function () {
        const empty = new Uint8Array();

        it("EIP-2930 exposes gasPrice (BigNumber) and round-trips", function () {
            const d = new EthereumTransactionDataEip2930({
                chainId: empty,
                nonce: empty,
                gasPrice: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                recId: empty,
                r: empty,
                s: empty,
            })
                .setChainId(1)
                .setNonce(2)
                .setGasPrice(new BigNumber(1000000000))
                .setGasLimit(21000)
                .setTo("0x7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181")
                .setValue(new BigNumber(100));

            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            expect(decoded.getChainId().toString()).to.equal("1");
            expect(decoded.getGasPrice().toFixed()).to.equal("1000000000");
            expect(decoded.getGasLimit().toNumber()).to.equal(21000);
            expect(decoded.getTo().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
        });

        it("EIP-7702 exposes maxPriorityGas/maxGas and round-trips", function () {
            const d = new EthereumTransactionDataEip7702({
                chainId: empty,
                nonce: empty,
                maxPriorityGas: empty,
                maxGas: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                authorizationList: [],
                recId: empty,
                r: empty,
                s: empty,
            })
                .setChainId(298)
                .setMaxPriorityGas(new BigNumber(47))
                .setMaxGas(new BigNumber(1000000000))
                .setGasLimit(0x018000);

            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            expect(decoded.getChainId().toString()).to.equal("298");
            expect(decoded.getMaxPriorityGas().toFixed()).to.equal("47");
            expect(decoded.getMaxGas().toFixed()).to.equal("1000000000");
            expect(decoded.getGasLimit().toNumber()).to.equal(0x018000);
        });

        it("Legacy exposes gasPrice + v and round-trips", function () {
            const d = new EthereumTransactionDataLegacy({
                nonce: empty,
                gasPrice: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                v: new Uint8Array([0x1b]),
                r: empty,
                s: empty,
            })
                .setNonce(1)
                .setGasPrice(new BigNumber(50))
                .setGasLimit(21000)
                .setValue(new BigNumber(1));

            expect(d.getV().toNumber()).to.equal(27);

            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            expect(decoded.getNonce().toString()).to.equal("1");
            expect(decoded.getGasPrice().toFixed()).to.equal("50");
            expect(decoded.getGasLimit().toNumber()).to.equal(21000);
            expect(decoded.getValue().toFixed()).to.equal("1");
        });
    });

    describe("structured access list (AccessListItem)", function () {
        const empty = new Uint8Array();
        const address = hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181");
        const storageKey1 = hex.decode(
            "0000000000000000000000000000000000000000000000000000000000000001",
        );
        const storageKey2 = hex.decode(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );

        function build1559(accessList) {
            return new EthereumTransactionDataEip1559({
                chainId: hex.decode("012a"),
                nonce: hex.decode("02"),
                maxPriorityGas: hex.decode("2f"),
                maxGas: hex.decode("2f"),
                gasLimit: hex.decode("018000"),
                to: address,
                value: hex.decode("0de0b6b3a7640000"),
                callData: hex.decode("123456"),
                accessList,
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        it("getAccessList() returns a structured view over the tuple field", function () {
            const d = build1559([[address, [storageKey1, storageKey2]]]);
            const list = d.getAccessList();

            expect(list).to.be.an("array").with.length(1);
            expect(list[0]).to.be.instanceOf(AccessListItem);
            expect(list[0].getAddress()).to.be.instanceOf(EvmAddress);
            expect(list[0].getAddress().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
            expect(list[0].getStorageKeys().length).to.equal(2);
            expect(hex.encode(list[0].getStorageKeys()[0])).to.equal(
                hex.encode(storageKey1),
            );
        });

        it("setAccessList() writes back to the tuple field and round-trips", function () {
            const d = build1559([]);
            const item = new AccessListItem()
                .setAddress("0x" + hex.encode(address))
                .addStorageKey(storageKey1)
                .addStorageKey("0x" + hex.encode(storageKey2));

            d.setAccessList([item]);

            // tuple field (source of truth) is updated
            expect(d.accessList).to.be.an("array").with.length(1);
            expect(hex.encode(d.accessList[0][0])).to.equal(
                hex.encode(address),
            );
            expect(d.accessList[0][1].length).to.equal(2);

            // survives a full encode/decode round-trip
            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            const roundTripped = decoded.getAccessList();
            expect(roundTripped[0].getAddress().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
            expect(roundTripped[0].getStorageKeys().length).to.equal(2);
            expect(hex.encode(roundTripped[0].getStorageKeys()[1])).to.equal(
                hex.encode(storageKey2),
            );
        });

        it("getAddress() is null when no address is set", function () {
            const item = new AccessListItem(empty, [storageKey1]);
            expect(item.getAddress()).to.equal(null);
            expect(item.getAddressBytes().length).to.equal(0);
        });

        it("EIP-2930 and EIP-7702 also expose the structured access list", function () {
            const item = new AccessListItem(address, [storageKey1]);

            const tx2930 = new EthereumTransactionDataEip2930({
                chainId: hex.decode("01"),
                nonce: empty,
                gasPrice: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                recId: empty,
                r: empty,
                s: empty,
            }).setAccessList([item]);
            expect(tx2930.getAccessList()[0].getAddress().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );

            const tx7702 = new EthereumTransactionDataEip7702({
                chainId: hex.decode("01"),
                nonce: empty,
                maxPriorityGas: empty,
                maxGas: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                authorizationList: [],
                recId: empty,
                r: empty,
                s: empty,
            }).setAccessList([item]);
            expect(tx7702.getAccessList()[0].getStorageKeys().length).to.equal(
                1,
            );
        });
    });

    describe("structured authorization list (Authorization, EIP-7702)", function () {
        const empty = new Uint8Array();
        const address = hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181");
        const r = hex.decode(
            "df48f2efd10421811de2bfb125ab75b2d3c44139c4642837fb1fccce911fd479",
        );
        const s = hex.decode(
            "1aaf7ae92bee896651dfc9d99ae422a296bf5d9f1ca49b2d96d82b79eb112d66",
        );

        function build7702(authorizationList) {
            return new EthereumTransactionDataEip7702({
                chainId: hex.decode("012a"),
                nonce: hex.decode("02"),
                maxPriorityGas: hex.decode("2f"),
                maxGas: hex.decode("2f"),
                gasLimit: hex.decode("018000"),
                to: address,
                value: hex.decode("0de0b6b3a7640000"),
                callData: hex.decode("123456"),
                accessList: [],
                authorizationList,
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        it("getAuthorizationList() returns a read-only structured view", function () {
            const d = build7702([
                [
                    hex.decode("012a"),
                    address,
                    hex.decode("01"),
                    hex.decode("01"),
                    r,
                    s,
                ],
            ]);
            const list = d.getAuthorizationList();

            expect(list).to.be.an("array").with.length(1);
            expect(list[0]).to.be.instanceOf(Authorization);
            expect(list[0].getChainId().toString()).to.equal("298");
            expect(list[0].getAddress().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
            expect(list[0].getNonce().toString()).to.equal("1");
            expect(list[0].getYParity().toString()).to.equal("1");
            expect(list[0].getRecoveryId().toString()).to.equal("1");
            expect(hex.encode(list[0].getR())).to.equal(hex.encode(r));
            expect(hex.encode(list[0].getS())).to.equal(hex.encode(s));

            // read-only: no setters exposed
            expect(list[0].setChainId).to.equal(undefined);
        });

        it("can be constructed from typed values and round-trips via setAuthorizationList", function () {
            const auth = new Authorization(
                298,
                EvmAddress.fromString("0x" + hex.encode(address)),
                1,
                1,
                r,
                s,
            );

            const d = build7702([]).setAuthorizationList([auth]);

            // tuple field (source of truth) updated
            expect(d.authorizationList).to.be.an("array").with.length(1);
            expect(d.authorizationList[0].length).to.equal(6);

            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            const roundTripped = decoded.getAuthorizationList();
            expect(roundTripped[0].getChainId().toString()).to.equal("298");
            expect(roundTripped[0].getAddress().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
            expect(roundTripped[0].getNonce().toString()).to.equal("1");
            expect(hex.encode(roundTripped[0].getR())).to.equal(hex.encode(r));
        });
    });

    describe("accessor normalization & null address", function () {
        const empty = new Uint8Array();
        function build1559() {
            return new EthereumTransactionDataEip1559({
                chainId: empty,
                nonce: empty,
                maxPriorityGas: empty,
                maxGas: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                recId: empty,
                r: empty,
                s: empty,
            });
        }

        it("integer setters trim leading zero bytes to minimal encoding", function () {
            const d = build1559();

            // padded Uint8Array -> minimal
            d.setNonce(new Uint8Array([0x00, 0x00, 0x05]));
            expect(hex.encode(d.getNonceBytes())).to.equal("05");
            expect(d.getNonce().toNumber()).to.equal(5);

            // padded hex string -> minimal
            d.setGasLimit("0x00018000");
            expect(hex.encode(d.getGasLimitBytes())).to.equal("018000");

            // all-zero -> empty bytes
            d.setValue(new Uint8Array([0x00, 0x00]));
            expect(d.getValueBytes().length).to.equal(0);
        });

        it("address and callData setters preserve exact bytes (no trimming)", function () {
            const d = build1559();

            // a 20-byte address with a leading zero byte must NOT be trimmed
            const addr = "00aa9eaf9bcc39e2ffa38eb30bf7a93feacbc181";
            d.setTo(hex.decode(addr));
            expect(hex.encode(d.getToBytes())).to.equal(addr);
            expect(d.getTo().toString()).to.equal(addr);

            // callData with leading zero bytes is opaque and preserved
            d.setCallData(new Uint8Array([0x00, 0x12, 0x34]));
            expect(hex.encode(d.getCallData())).to.equal("001234");
        });

        it("getTo() returns null when there is no recipient", function () {
            const d = build1559();
            expect(d.getTo()).to.equal(null);
            expect(d.getToBytes().length).to.equal(0);
        });

        it("rejects negative numeric input", function () {
            const d = build1559();
            expect(() => d.setNonce(-1)).to.throw(/non-negative integer/);
            expect(() => d.setValue(new BigNumber(-5))).to.throw(
                /non-negative integer/,
            );
            expect(() => d.setNonce(Long.fromNumber(-1))).to.throw(
                /non-negative integer/,
            );
        });

        it("rejects unsafe-integer numbers (precision loss) instead of silently rounding", function () {
            const d = build1559();
            // 2^53 + 1 cannot be represented as a JS number; must throw, not round.
            expect(() => d.setValue(9007199254740993)).to.throw(/safe integer/);
            expect(() => d.setGasLimit(1.5)).to.throw(/safe integer/);
            expect(() => d.setChainId(NaN)).to.throw(/safe integer/);

            // the same large value passed as BigNumber is exact and round-trips
            const wei = new BigNumber("10000000000000000"); // 0.01 ETH, > 2^53
            d.setValue(wei);
            expect(d.getValue().toFixed()).to.equal("10000000000000000");
        });

        it("parses string input as decimal, or hex when 0x-prefixed", function () {
            const d = build1559();
            d.setNonce("10");
            expect(d.getNonce().toNumber()).to.equal(10); // decimal, not 0x10
            d.setNonce("0x10");
            expect(d.getNonce().toNumber()).to.equal(16); // hex
            d.setChainId("298"); // odd-length decimal must not throw
            expect(d.getChainId().toNumber()).to.equal(298);
        });

        it("accepts bigint input for numeric fields (incl. values beyond 2^53)", function () {
            const d = build1559();

            d.setNonce(7n);
            expect(d.getNonce().toNumber()).to.equal(7);

            d.setMaxPriorityGas(0n); // zero -> empty (minimal encoding)
            expect(d.getMaxPriorityGasBytes().length).to.equal(0);

            d.setValue(2000000000n);
            expect(d.getValue().toFixed()).to.equal("2000000000");

            // exact for values a JS number couldn't represent
            d.setValue(10000000000000000001n);
            expect(d.getValue().toFixed()).to.equal("10000000000000000001");
        });

        it("setters copy byte input so later caller mutation can't corrupt the field", function () {
            const d = build1559();
            const a = new Uint8Array([0x05]);
            d.setNonce(a);
            a[0] = 0x09; // mutate the caller's buffer after the setter
            expect(d.getNonce().toNumber()).to.equal(5);
        });

        it("uint64 getter throws rather than silently wrapping an out-of-range field", function () {
            // 9-byte nonce is outside uint64 range
            const d = new EthereumTransactionDataEip1559({
                chainId: empty,
                nonce: hex.decode("010000000000000000"),
                maxPriorityGas: empty,
                maxGas: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                recId: empty,
                r: empty,
                s: empty,
            });
            expect(() => d.getNonce()).to.throw(/uint64/);
            // raw bytes accessor still works
            expect(d.getNonceBytes().length).to.equal(9);
        });
    });

    describe("AccessListItem does not alias its storage keys", function () {
        const address = hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181");
        const key1 = hex.decode(
            "0000000000000000000000000000000000000000000000000000000000000001",
        );
        const key2 = hex.decode(
            "0000000000000000000000000000000000000000000000000000000000000002",
        );

        it("mutating a structured item does not mutate the source tuple", function () {
            const tx = new EthereumTransactionDataEip2930({
                chainId: hex.decode("01"),
                nonce: new Uint8Array(),
                gasPrice: new Uint8Array(),
                gasLimit: new Uint8Array(),
                to: new Uint8Array(),
                value: new Uint8Array(),
                callData: new Uint8Array(),
                accessList: [[address, [key1]]],
                recId: new Uint8Array(),
                r: new Uint8Array(),
                s: new Uint8Array(),
            });

            tx.getAccessList()[0].addStorageKey(key2);

            // the envelope's underlying tuple is untouched
            expect(tx.accessList[0][1].length).to.equal(1);
        });

        it("getStorageKeys() returns a copy that cannot mutate internal state", function () {
            const item = new AccessListItem(address, [key1]);
            item.getStorageKeys().push(key2);
            expect(item.getStorageKeys().length).to.equal(1);
        });
    });

    describe("single-item adders (addAccessListItem / addAuthorization)", function () {
        const empty = new Uint8Array();
        const address = hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181");
        const key1 = hex.decode(
            "0000000000000000000000000000000000000000000000000000000000000001",
        );
        const r = hex.decode(
            "df48f2efd10421811de2bfb125ab75b2d3c44139c4642837fb1fccce911fd479",
        );
        const s = hex.decode(
            "1aaf7ae92bee896651dfc9d99ae422a296bf5d9f1ca49b2d96d82b79eb112d66",
        );

        it("addAccessListItem appends to the tuple field and chains (EIP-1559/2930/7702)", function () {
            const make1559 = () =>
                new EthereumTransactionDataEip1559({
                    chainId: hex.decode("012a"),
                    nonce: empty,
                    maxPriorityGas: empty,
                    maxGas: empty,
                    gasLimit: empty,
                    to: address,
                    value: empty,
                    callData: empty,
                    accessList: [],
                    recId: empty,
                    r: empty,
                    s: empty,
                });

            const d = make1559();
            const ret = d
                .addAccessListItem(new AccessListItem(address, [key1]))
                .addAccessListItem(new AccessListItem(address, []));

            expect(ret).to.equal(d); // chainable
            expect(d.accessList.length).to.equal(2); // wrote into the tuple field
            const view = d.getAccessList();
            expect(view[0].getStorageKeys().length).to.equal(1);
            expect(view[1].getStorageKeys().length).to.equal(0);

            // round-trips through encode/decode
            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            expect(decoded.getAccessList().length).to.equal(2);
        });

        it("addAuthorization appends to the EIP-7702 authorization list", function () {
            const d = new EthereumTransactionDataEip7702({
                chainId: hex.decode("012a"),
                nonce: empty,
                maxPriorityGas: empty,
                maxGas: empty,
                gasLimit: empty,
                to: address,
                value: empty,
                callData: empty,
                accessList: [],
                authorizationList: [],
                recId: empty,
                r: empty,
                s: empty,
            });

            const ret = d.addAuthorization(
                new Authorization(298, address, 1, 1, r, s),
            );

            expect(ret).to.equal(d);
            expect(d.authorizationList.length).to.equal(1);

            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            const auth = decoded.getAuthorizationList()[0];
            expect(auth.getChainId().toString()).to.equal("298");
            expect(auth.getAddress().toString()).to.equal(
                "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181",
            );
        });
    });

    describe("canonical signature encoding (toBytes trims r/s)", function () {
        const empty = new Uint8Array();

        it("encodes r/s as minimal big-endian scalars (no leading zero bytes)", function () {
            // r has 31 leading zero bytes -> minimal "05"; s has one -> 31 bytes.
            const r = new Uint8Array(32);
            r[31] = 0x05;
            const s = new Uint8Array(32).fill(0xab);
            s[0] = 0x00;

            const d = new EthereumTransactionDataEip1559({
                chainId: hex.decode("012a"),
                nonce: empty,
                maxPriorityGas: empty,
                maxGas: empty,
                gasLimit: empty,
                to: empty,
                value: empty,
                callData: empty,
                accessList: [],
                recId: empty,
                r,
                s,
            });

            // In-memory r/s stay full 32-byte (so verification still works)...
            expect(d.r.length).to.equal(32);
            expect(d.s.length).to.equal(32);

            // ...but the encoded wire form is the minimal scalar.
            const decoded = EthereumTransactionData.fromBytes(d.toBytes());
            expect(hex.encode(decoded.getR())).to.equal("05");
            expect(decoded.getS().length).to.equal(31);
            expect(decoded.getS()[0]).to.equal(0xab);
        });
    });
});
