// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import BigNumber from "bignumber.js";
import {
    EthereumTransactionData,
    EthereumTransactionDataLegacy,
    EthereumTransactionDataEip2930,
    EthereumTransactionDataEip1559,
    EthereumTransactionDataEip7702,
    AccessListItem,
    Authorization,
    EvmAddress,
} from "../../src/index.js";
import * as rlp from "../../src/encoding/rlp.js";
import * as hex from "../../src/encoding/hex.js";

const address = "0000000000000000000000000000000000000001";
const storageKey = new Uint8Array(32).fill(2);
const variants = [
    ["legacy", EthereumTransactionDataLegacy, 0],
    ["EIP-2930", EthereumTransactionDataEip2930, 1],
    ["EIP-1559", EthereumTransactionDataEip1559, 2],
    ["EIP-7702", EthereumTransactionDataEip7702, 4],
];

describe.each(variants)("%s envelope contract", function (_, Envelope, type) {
    const create = () =>
        new Envelope({
            chainId: Uint8Array.of(1),
            nonce: Uint8Array.of(1),
            gasPrice: Uint8Array.of(2),
            maxPriorityGas: Uint8Array.of(3),
            maxGas: Uint8Array.of(4),
            gasLimit: Uint8Array.of(5),
            to: hex.decode(address),
            value: Uint8Array.of(6),
            callData: new Uint8Array(),
            accessList: [],
            authorizationList: [],
            v: Uint8Array.of(27),
            recId: Uint8Array.of(1),
            r: Uint8Array.of(7),
            s: Uint8Array.of(8),
        });

    it("preserves large integers, opaque bytes and signature fields through RLP", function () {
        const transaction = create()
            .setNonce(Long.fromString("9007199254740993", true))
            .setGasLimit(21000)
            .setValue(new BigNumber("1000000000000000001"))
            .setTo(EvmAddress.fromString(address))
            .setCallData("000102");
        const restored = EthereumTransactionData.fromBytes(
            transaction.toBytes(),
        );

        expect(restored).to.be.instanceOf(Envelope);
        expect(restored.getNonce().toString()).to.equal("9007199254740993");
        expect(restored.getNonceBytes()).to.deep.equal(
            hex.decode("20000000000001"),
        );
        expect(restored.getGasLimit().toString()).to.equal("21000");
        expect(restored.getGasLimitBytes()).to.deep.equal(hex.decode("5208"));
        expect(restored.getValue().toFixed()).to.equal("1000000000000000001");
        expect(restored.getValueBytes()).to.deep.equal(
            hex.decode("0de0b6b3a7640001"),
        );
        expect(restored.getTo().toString()).to.equal(address);
        expect(restored.getToBytes()).to.deep.equal(hex.decode(address));
        expect(restored.getCallData()).to.deep.equal(Uint8Array.of(0, 1, 2));
        expect(restored.getR()).to.deep.equal(Uint8Array.of(7));
        expect(restored.getS()).to.deep.equal(Uint8Array.of(8));
        if (type === 0) {
            expect(restored.getV().toString()).to.equal("27");
            expect(restored.getVBytes()).to.deep.equal(Uint8Array.of(27));
        } else {
            expect(restored.getRecId().toString()).to.equal("1");
            expect(restored.getRecIdBytes()).to.deep.equal(Uint8Array.of(1));
            expect(restored.getChainIdBytes()).to.deep.equal(Uint8Array.of(1));
        }
        const json = JSON.parse(restored.toString());
        expect(json.nonce).to.equal("20000000000001");
        expect(json.callData).to.equal("000102");
        expect(json.to).to.equal(address);
        expect(restored.toBytes()).to.deep.equal(transaction.toBytes());
    });

    it("distinguishes contract creation from a zero-prefixed destination", function () {
        const transaction = create().setTo(new Uint8Array());
        expect(transaction.getTo()).to.be.null;
        const restored = Envelope.fromBytes(transaction.toBytes());
        expect(restored.getTo()).to.be.null;
        expect(restored.getToBytes()).to.have.length(0);
    });

    it("retains gas prices and fee caps without number precision loss", function () {
        const transaction = create();
        const fee = new BigNumber("9007199254740993");
        if (type === 0 || type === 1) {
            transaction.setGasPrice(fee);
            const restored = Envelope.fromBytes(transaction.toBytes());
            expect(restored.getGasPrice().toFixed()).to.equal(fee.toFixed());
            expect(restored.getGasPriceBytes()).to.deep.equal(
                hex.decode("20000000000001"),
            );
        } else {
            transaction.setMaxPriorityGas(fee).setMaxGas(fee.plus(1));
            const restored = Envelope.fromBytes(transaction.toBytes());
            expect(restored.getMaxPriorityGas().toFixed()).to.equal(
                fee.toFixed(),
            );
            expect(restored.getMaxPriorityGasBytes()).to.deep.equal(
                hex.decode("20000000000001"),
            );
            expect(restored.getMaxGas().toFixed()).to.equal(
                fee.plus(1).toFixed(),
            );
            expect(restored.getMaxGasBytes()).to.deep.equal(
                hex.decode("20000000000002"),
            );
        }
    });

    it("rejects empty and incorrectly shaped RLP envelopes", function () {
        expect(() => Envelope.fromBytes(new Uint8Array())).to.throw(
            "empty bytes",
        );
        const notList =
            type === 0 ? Uint8Array.of(128) : Uint8Array.of(type, 128);
        expect(() => Envelope.fromBytes(notList)).to.throw();
        const wrongLength =
            type === 0 ? rlp.encode([]) : rlp.encodeTyped(type, []);
        expect(() => Envelope.fromBytes(wrongLength)).to.throw(
            "invalid ethereum transaction data",
        );
    });

    if (type !== 0) {
        it("round-trips structured access lists and rejects malformed entries", function () {
            const transaction = create().addAccessListItem(
                new AccessListItem(hex.decode(address), [storageKey]),
            );
            const restored = Envelope.fromBytes(transaction.toBytes());
            expect(
                restored.getAccessList()[0].getAddress().toString(),
            ).to.equal(address);
            expect(restored.getAccessList()[0].getStorageKeys()).to.deep.equal([
                storageKey,
            ]);
            expect(JSON.parse(restored.toString()).accessList).to.deep.equal([
                { address, storageKeys: [hex.encode(storageKey)] },
            ]);

            const decoded = rlp.decode(transaction.toBytes().subarray(1));
            decoded[type === 1 ? 7 : 8] = [[hex.decode(address)]];
            expect(() =>
                Envelope.fromBytes(rlp.encodeTyped(type, decoded)),
            ).to.throw("invalid access list entry");
        });
    }

    if (type === 4) {
        it("serializes authorizations and validates the list and tuple shapes", function () {
            const transaction = create().addAuthorization(
                new Authorization(1, address, 2, 1, "03", "04"),
            );
            const restored = Envelope.fromBytes(transaction.toBytes());
            expect(
                restored.getAuthorizationList()[0].getNonce().toString(),
            ).to.equal("2");
            expect(
                JSON.parse(restored.toString()).authorizationList,
            ).to.deep.equal([["01", address, "02", "01", "03", "04"]]);
            const decoded = rlp.decode(transaction.toBytes().subarray(1));
            decoded[9] = Uint8Array.of(1);
            expect(() =>
                Envelope.fromBytes(rlp.encodeTyped(type, decoded)),
            ).to.throw("authorization list must be an array");
            decoded[9] = [[Uint8Array.of(1)]];
            expect(() =>
                Envelope.fromBytes(rlp.encodeTyped(type, decoded)),
            ).to.throw("invalid authorization list entry");
        });
    }
});
