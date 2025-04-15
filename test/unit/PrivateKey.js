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
});
