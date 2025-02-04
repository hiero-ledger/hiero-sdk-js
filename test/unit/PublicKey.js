import {
    AccountId,
    PrivateKey,
    PublicKey,
    TransactionId,
    TransferTransaction,
    Transaction,
} from "../../src/index.js";

const CURVE_ORDER_ED25519 =
    7237005577332262213973186563042994240857116359379907606001950938285454250989n;
const CURVE_ORDER_ECDSA =
    115792089237316195423570985008687907852837564279074904382605163141518161494337n;

describe("PublicKey", function () {
    it("`verifyTransaction` works", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateECDSA();
        const nodeAccountId = new AccountId(6);

        let transaction = new TransferTransaction()
            .setTransactionId(TransactionId.generate(new AccountId(5)))
            .setNodeAccountIds([nodeAccountId])
            .addHbarTransfer("0.0.3", -1)
            .addHbarTransfer("0.0.4", 1)
            .freeze();

        await transaction.sign(key1);
        await transaction.sign(key2);

        expect(key1.publicKey.verifyTransaction(transaction)).to.be.true;
        expect(key2.publicKey.verifyTransaction(transaction)).to.be.true;

        let signaturesNodeId = transaction.getSignatures().get(nodeAccountId);
        let txSignatures = signaturesNodeId.get(transaction.transactionId);
        expect(txSignatures.size).to.be.equal(2);

        for (const [publicKey, ,] of txSignatures) {
            expect(publicKey.verifyTransaction(transaction)).to.be.true;
        }

        const bytes = transaction.toBytes();

        transaction = Transaction.fromBytes(bytes);

        expect(key1.publicKey.verifyTransaction(transaction)).to.be.true;
        expect(key2.publicKey.verifyTransaction(transaction)).to.be.true;

        const sigMap = transaction.getSignatures();
        expect(sigMap.size).to.be.equal(1);

        txSignatures = signaturesNodeId.get(transaction.transactionId);
        expect(txSignatures.size).to.be.equal(2);
        for (const [publicKey, ,] of txSignatures) {
            expect(publicKey.verifyTransaction(transaction)).to.be.true;
        }
    });

    it("verify `fromStringECDSA()` works", async function () {
        const ecdsaStringKey =
            "302d300706052b8104000a0322000245f219afdfc8e61b9f6879fa7c8a16a94b35471662afa302993d7d9a29564f81";
        const publicKeyECDSA = PublicKey.fromStringECDSA(ecdsaStringKey);

        expect(publicKeyECDSA.toString()).to.be.equal(ecdsaStringKey);
    });

    it("verify `fromStringED25519()` works", async function () {
        const ed25519StringKey =
            "302a300506032b6570032100bc46c36d8aeb94270064edb8d3d4d5d29446e1bb2f36cc47b2c9b755ef0aac25";
        const publicKeyED25519 = PublicKey.fromStringED25519(
            "302a300506032b6570032100bc46c36d8aeb94270064edb8d3d4d5d29446e1bb2f36cc47b2c9b755ef0aac25",
        );

        expect(publicKeyED25519.toString()).to.be.equal(ed25519StringKey);
    });

    it("ECDSA DER import test vectors", async function () {
        // https://github.com/hashgraph/hedera-sdk-reference/issues/93#issue-1665972122
        const PUBLIC_KEY_DER1 =
            "302d300706052b8104000a032200028173079d2e996ef6b2d064fc82d5fc7094367211e28422bec50a2f75c365f5fd";
        const PUBLIC_KEY1 =
            "028173079d2e996ef6b2d064fc82d5fc7094367211e28422bec50a2f75c365f5fd";

        const PUBLIC_KEY_DER2 =
            "3036301006072a8648ce3d020106052b8104000a032200036843f5cb338bbb4cdb21b0da4ea739d910951d6e8a5f703d313efe31afe788f4";
        const PUBLIC_KEY2 =
            "036843f5cb338bbb4cdb21b0da4ea739d910951d6e8a5f703d313efe31afe788f4";

        const PUBLIC_KEY_DER3 =
            "3056301006072a8648ce3d020106052b8104000a03420004aaac1c3ac1bea0245b8e00ce1e2018f9eab61b6331fbef7266f2287750a6597795f855ddcad2377e22259d1fcb4e0f1d35e8f2056300c15070bcbfce3759cc9d";
        const PUBLIC_KEY3 =
            "03aaac1c3ac1bea0245b8e00ce1e2018f9eab61b6331fbef7266f2287750a65977";

        const ecdsaPublicKey1 = PublicKey.fromString(PUBLIC_KEY_DER1);
        expect(ecdsaPublicKey1.toStringRaw()).to.be.equal(PUBLIC_KEY1);

        const ecdsaPublicKey2 = PublicKey.fromString(PUBLIC_KEY_DER2);
        expect(ecdsaPublicKey2.toStringRaw()).to.be.equal(PUBLIC_KEY2);

        const ecdsaPublicKey3 = PublicKey.fromString(PUBLIC_KEY_DER3);
        expect(ecdsaPublicKey3.toStringRaw()).to.be.equal(PUBLIC_KEY3);
    });

    it("ED25519 DER import test vectors", async function () {
        // https://github.com/hashgraph/hedera-sdk-reference/issues/93#issue-1665972122
        const PUBLIC_KEY_DER1 =
            "302a300506032b65700321008ccd31b53d1835b467aac795dab19b274dd3b37e3daf12fcec6bc02bac87b53d";
        const PUBLIC_KEY1 =
            "8ccd31b53d1835b467aac795dab19b274dd3b37e3daf12fcec6bc02bac87b53d";

        const ed25519PublicKey1 = PublicKey.fromString(PUBLIC_KEY_DER1);
        expect(ed25519PublicKey1.toStringRaw()).to.be.equal(PUBLIC_KEY1);
    });

    it("should throw error when creating ED25519 key from invalid bytes", function () {
        // Test cases with invalid byte

        const invalidKey = (CURVE_ORDER_ED25519 + 1n).toString(16);
        const invalidKeyBuffer = Buffer.from(invalidKey, "hex");
        const invalidPrivateKeyBytes = Uint8Array.from(invalidKeyBuffer);

        expect(() => {
            PublicKey.fromBytesED25519(invalidPrivateKeyBytes);
        }).to.throw;
    });

    it("should throw error when creating ECDSA key from invalid bytes", function () {
        // Test cases with invalid byte

        const invalidKey = (CURVE_ORDER_ECDSA + 1n).toString(16);
        const invalidKeyBuffer = Buffer.from(invalidKey, "hex");
        const invalidPrivateKeyBytes = Uint8Array.from(invalidKeyBuffer);

        expect(() => {
            PublicKey.fromBytesECDSA(invalidPrivateKeyBytes);
        }).to.throw;
    });

    it("should be able to create ECDSA key from valid bytes", function () {
        const validPubKey = PrivateKey.generateECDSA().publicKey;
        const bytes = validPubKey.toBytes();
        const publicKey = PublicKey.fromBytes(bytes);
        expect(publicKey.toString()).to.be.equal(validPubKey.toString());
    });

    it("should be able to create ED25519 key from valid bytes", function () {
        const validPubKey = PrivateKey.generateED25519().publicKey;
        const bytes = validPubKey.toBytes();
        const publicKey = PublicKey.fromBytes(bytes);
        expect(publicKey.toString()).to.be.equal(validPubKey.toString());
    });
});
