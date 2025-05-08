import * as hex from "../../src/encoding/hex.js";
import { EthereumTransactionData } from "../../src/index.js";

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
});
