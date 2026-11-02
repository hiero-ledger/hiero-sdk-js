import {
    AccountId,
    FileAppendTransaction,
    PrivateKey,
    Timestamp,
    Transaction,
    TransactionId,
    TransferTransaction,
} from "../../src/index.js";
import SignatureMap from "../../src/transaction/SignatureMap.js";
import * as hex from "../../src/encoding/hex.js";

describe("PrivateKey", function () {
    describe("PrivateKey getRecoveryId", function () {
        it("should throw if the key is not an ECDSA key", function () {
            const nonECDSAPrivateKey = PrivateKey.generateED25519();
            const message = new TextEncoder().encode("Invalid signature test");
            const signature = nonECDSAPrivateKey.sign(message);

            const r = signature.slice(0, 32);
            const s = signature.slice(32, 64);

            expect(() =>
                nonECDSAPrivateKey.getRecoveryId(r, s, message),
            ).to.throw("Invalid key type, must be ECDSA secp256k1.");
        });

        it("should return a valid recovery ID for proper r and s signature components", function () {
            const validECDSAkey = PrivateKey.generateECDSA();
            const message = new TextEncoder().encode("Test message");
            const signature = validECDSAkey.sign(message);

            const r = signature.slice(0, 32);
            const s = signature.slice(32, 64);

            const recId = validECDSAkey.getRecoveryId(r, s, message);

            expect(recId).to.be.at.least(0);
            expect(recId).to.be.lessThan(4);
        });

        it("should throw if r is not 32 bytes", function () {
            const key = PrivateKey.generateECDSA();
            const message = new TextEncoder().encode("Bad r");
            const signature = key.sign(message);

            const r = signature.slice(0, 31); // shorten r
            const s = signature.slice(32, 64);

            expect(() => key.getRecoveryId(r, s, message)).to.throw(
                "Invalid signature components.",
            );
        });

        it("should throw if s is not 32 bytes", function () {
            const key = PrivateKey.generateECDSA();
            const message = new TextEncoder().encode("Bad s ");
            const signature = key.sign(message);

            const r = signature.slice(0, 32);
            const s = new Uint8Array([...signature.slice(32, 64), 0x00]); // 33 bytes

            expect(() => key.getRecoveryId(r, s, message)).to.throw(
                "Invalid signature components.",
            );
        });

        it("should throw for tampered r component of signature", function () {
            const validECDSAkey = PrivateKey.generateECDSA();
            const message = new TextEncoder().encode("Test message");
            const signature = validECDSAkey.sign(message);

            const r = signature.slice(0, 32);
            const s = signature.slice(32, 64);
            r[5] ^= 0xff; // Flip byte

            expect(() => validECDSAkey.getRecoveryId(r, s, message)).to.throw(
                "Unexpected error: could not construct a recoverable key.",
            );
        });

        it("should throw for tampered s component of signature", function () {
            const validECDSAkey = PrivateKey.generateECDSA();
            const message = new TextEncoder().encode("Test message");
            const signature = validECDSAkey.sign(message);

            const r = signature.slice(0, 32);
            const s = signature.slice(32, 64);
            s[6] ^= 0xff; // Flip byte

            expect(() => validECDSAkey.getRecoveryId(r, s, message)).to.throw(
                "Unexpected error: could not construct a recoverable key.",
            );
        });
    });

    describe("PrivateKey signTransaction", function () {
        let privateKey, transaction;

        beforeEach(function () {
            const validStart = new Timestamp(Math.floor(Date.now() / 1000), 0);
            const txId = new TransactionId(new AccountId(0), validStart);
            privateKey = PrivateKey.generate();
            transaction = new TransferTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(txId)
                .freeze();
        });

        it("should add zeroes at the beginning of <32 bytes private key", async function () {
            const EXPECTED_PRIVATE_KEY =
                "0000000000000000fd2fe3d732d3412140accab21b4b7303ff05f9c9127542cd";
            const derPrefix = "3030020100300706052b8104000a04220420";
            const EXPECTED_DER_PRIVATE_KEY = derPrefix + EXPECTED_PRIVATE_KEY;

            const SHORT_PRIVATE_KEY =
                PrivateKey.fromStringECDSA(EXPECTED_PRIVATE_KEY);

            expect(SHORT_PRIVATE_KEY.toStringRaw()).to.equal(
                EXPECTED_PRIVATE_KEY,
            );
            expect(SHORT_PRIVATE_KEY.toStringDer()).to.equal(
                EXPECTED_DER_PRIVATE_KEY,
            );
        });

        it("should sign transaction and add signature", function () {
            const { bodyBytes } = transaction._signedTransactions.list[0];
            const sig = privateKey.sign(bodyBytes);

            const sigMap = new SignatureMap().addSignature(
                new AccountId(3),
                transaction.transactionId,
                privateKey.publicKey,
                sig,
            );

            transaction.addSignature(privateKey.publicKey, sigMap);

            const sigPairMaps = transaction
                .getSignatures()
                .getFlatSignatureList();
            for (const sigPairMap of sigPairMaps) {
                expect(sigPairMap.get(privateKey.publicKey)).to.equal(sig);
            }
        });

        it("should throw an error if bodyBytes are missing", async function () {
            // Set bodyBytes to null to simulate missing bodyBytes
            const mockedTransaction = new Transaction();
            mockedTransaction._signedTransactions.setList([
                {
                    sigMap: {
                        sigPair: [],
                    },
                    bodyBytes: null,
                },
            ]);

            try {
                privateKey.signTransaction(mockedTransaction);
            } catch (err) {
                expect(err.message).to.equal("Body bytes are missing");
            }
            const sigs = mockedTransaction
                .getSignatures()
                .getFlatSignatureList();
            expect(sigs.length).to.equal(0);
        });

        it("should sign transaction and add multiple signature", function () {
            const contents = "Hello, World!";
            const multisignatureTransaction = new FileAppendTransaction()
                .setContents(contents)
                .setChunkSize(1)
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(
                    new TransactionId(new AccountId(0), new Timestamp(0, 0)),
                )
                .freeze();

            const sigs = multisignatureTransaction._signedTransactions.list.map(
                (tx) => {
                    return privateKey.sign(tx.bodyBytes);
                },
            );

            const sigMap = new SignatureMap();
            sigs.forEach((sig, index) => {
                const txId =
                    multisignatureTransaction._transactionIds.list[index];
                sigMap.addSignature(
                    new AccountId(3),
                    txId,
                    privateKey.publicKey,
                    sig,
                );
            });
            multisignatureTransaction.addSignature(
                privateKey.publicKey,
                sigMap,
            );

            const txSigPairMaps = multisignatureTransaction
                .getSignatures()
                .getFlatSignatureList();

            /*  Check if all the signatures are added to the transaction. This works 
                because the transaction signatures are added in the same order as the
                sigmap signatures.
            */
            for (const txSigPairMap of txSigPairMaps) {
                expect(txSigPairMap.get(privateKey.publicKey)).to.equal(
                    sigs.shift(),
                );
            }
            expect(txSigPairMaps.length).to.equal(contents.length);
        });
    });

    describe("DER encoded functions", function () {
        // Raw 32-byte keys that start like an ASN.1 element: INTEGER, BIT
        // STRING, OCTET STRING, OBJECT IDENTIFIER, SEQUENCE and the [0] and
        // [1] tags, each with a length that fits. About 1 in 50 random raw
        // keys look like this.
        const rawKeysThatLookLikeAsn1 = [
            "021e" + "11".repeat(30),
            "031e" + "11".repeat(30),
            "041e" + "11".repeat(30),
            "061e" + "11".repeat(30),
            "301e041c" + "11".repeat(28),
            "a01e041c" + "11".repeat(28),
            "a11e041c" + "11".repeat(28),
        ];

        // SEC1 (RFC 5915) secp256k1 keys: with the curve only, and with the
        // curve and the public key, as `openssl ecparam -genkey` writes it.
        const sec1Keys = [
            {
                der: "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a",
                raw: "a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fe",
            },
            {
                der: "30740201010420edd580d7ca2f40596ff6fecb31f51c720f3b4b6ce3d2e6760126c3787812d53aa00706052b8104000aa1440342000457390ed9b1ed92bf6dd5d3619c894a84f4f43e4ce9ee6a1a19b686c11ce6c260facabc2cab8e20a97a3308e5bb9e013efdf316444adfb6242fd95ffaa705e923",
                raw: "edd580d7ca2f40596ff6fecb31f51c720f3b4b6ce3d2e6760126c3787812d53a",
            },
        ];

        it("should return true if the key is a DER key", function () {
            const derKey = PrivateKey.generateECDSA().toStringDer();
            expect(PrivateKey.isDerKey(derKey)).to.be.true;
        });

        it("should return true for an ed25519 DER key", function () {
            const derKey = PrivateKey.generateED25519().toStringDer();
            expect(PrivateKey.isDerKey(derKey)).to.be.true;
        });

        it("should return true for SEC1 ecdsa keys", function () {
            for (const { der, raw } of sec1Keys) {
                expect(PrivateKey.isDerKey(der)).to.be.true;
                expect(PrivateKey.getAlgorithm(der)).to.equal("ecdsa");
                expect(PrivateKey.fromStringDer(der).toStringRaw()).to.equal(
                    raw,
                );
            }
        });

        it("should return false if the key is not a DER key", function () {
            for (const rawKey of rawKeysThatLookLikeAsn1) {
                expect(PrivateKey.isDerKey(rawKey), rawKey).to.be.false;
            }
        });

        it("should return false for a DER key with bytes missing or added", function () {
            const derKey = PrivateKey.generateED25519().toStringDer();
            expect(PrivateKey.isDerKey(derKey.slice(0, -2))).to.be.false;
            expect(PrivateKey.isDerKey(derKey + "00")).to.be.false;
        });

        it("should read raw keys that look like ASN.1 as raw keys", function () {
            for (const rawKey of rawKeysThatLookLikeAsn1) {
                expect(() => PrivateKey.getAlgorithm(rawKey)).to.throw(
                    "Only der keys are supported",
                );
                // Without a DER header the key type is unknown and defaults
                // to ED25519, as for any other raw key.
                const key = PrivateKey.fromBytes(hex.decode(rawKey));
                expect(key.type).to.equal("ED25519");
                expect(key.toStringRaw()).to.equal(rawKey);
                expect(
                    PrivateKey.fromStringECDSA(rawKey).toStringRaw(),
                ).to.equal(rawKey);
            }
        });

        it("should generate key from der string on ecdsa", function () {
            const derKey = PrivateKey.generateECDSA().toStringDer();
            const key = PrivateKey.fromStringDer(derKey);
            expect(key.toStringDer()).to.equal(derKey);
        });

        it("should generate key from der string on ed25519", function () {
            const derKey = PrivateKey.generateED25519().toStringDer();
            const key = PrivateKey.fromStringDer(derKey);
            expect(key.toStringDer()).to.equal(derKey);
        });

        it("should generate key from der bytes on ecdsa", function () {
            const derKey = PrivateKey.generateECDSA().toBytesDer();
            const key = PrivateKey.fromBytes(derKey);

            expect(key.toBytesDer()).to.deep.equal(derKey);
        });

        it("should generate key from der bytes on ed25519", function () {
            const derKey = PrivateKey.generateED25519().toBytesDer();
            const key = PrivateKey.fromBytes(derKey);
            expect(key.toBytesDer()).to.deep.equal(derKey);
        });

        it("should get ecdsa algorithm from der key", function () {
            const derKey = PrivateKey.generateECDSA().toStringDer();
            expect(PrivateKey.getAlgorithm(derKey)).to.equal("ecdsa");
        });

        it("should get ed25519algorithm from der key", function () {
            const derKey = PrivateKey.generateED25519().toStringDer();
            expect(PrivateKey.getAlgorithm(derKey)).to.equal("ed25519");
        });

        it("should throw error if invalid der key", function () {
            const derKey = "invalid";
            expect(() => PrivateKey.getAlgorithm(derKey)).to.throw(
                "Only der keys are supported",
            );
        });
    });
});
