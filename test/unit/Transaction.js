import {
    AccountCreateTransaction,
    AccountId,
    FileAppendTransaction,
    FileCreateTransaction,
    FileId,
    Hbar,
    HbarUnit,
    PrivateKey,
    Timestamp,
    Transaction,
    TransactionId,
    TransferTransaction,
} from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
import Client from "../../src/client/NodeClient.js";
import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import BigNumber from "bignumber.js";
import SignatureMap from "../../src/transaction/SignatureMap.js";
import SignableNodeTransactionBodyBytes from "../../src/transaction/SignableNodeTransactionBodyBytes.js";

const HEX_BYTES_VALID_START_YEAR_2125 =
    "0acc012ac9010a5f0a0d0a0608808fb19c12120318d209120218031880c2d72f2202087832235472616e73616374696f6e20776974682076616c6964537461727420696e2032313235721c0a1a0a0b0a0318d20910ffa7d6b9070a0b0a0318ae2c1080a8d6b90712660a640a205afd59dfc4401b63272c050535457495841ba2d414891cb8609549d3f08ef6671a40a82b1257b5476a98c65fe73e802150e9526eed77c11b377da642893e0004db096c258636a47327d986084a5044409220d68dde2ea34b1b1b097b39129d83d302";

describe("Transaction", function () {
    it("toBytes", async function () {
        const key = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420a58d361e61756ee809686255fda09bacb846ea8aa589c67ac39cfbcf82dd511c",
        );
        const account = AccountId.fromString("0.0.1004");
        const validStart = new Timestamp(1451, 590);
        const transactionId = new TransactionId(account, validStart);

        const hexBytes =
            "0adb012ad8010a6e0a130a0608ab0b10ce0412070800100018ec0718001206080010001803188084af5f2202087832005a440a2212206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc4830ffffffffffffffff7f38ffffffffffffffff7f40004a050880ceda0388010012660a640a206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc481a406f7b1823defed495205f67504243abd623bef1eb9dc4053b879b5e25fff382814172d0676464a6a5b7adfc7968ae8af236ac91fd751d632c0412b5f77431930d0adb012ad8010a6e0a130a0608ab0b10ce0412070800100018ec0718001206080010001804188084af5f2202087832005a440a2212206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc4830ffffffffffffffff7f38ffffffffffffffff7f40004a050880ceda0388010012660a640a206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc481a408d3fb2b8da90457cc447771361b0e27f784b70664604a5490a135595a69f2bbf2fd725a703174999d25f6f295cd58f116210dffefb94703c34fc8107be0a7908";

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setNodeAccountIds([new AccountId(3), new AccountId(4)])
            .setTransactionId(transactionId)
            .freeze()
            .sign(key);

        const transactionBytesHex = hex.encode(transaction.toBytes());
        expect(transactionBytesHex).to.eql(hexBytes);

        const transactionFromBytes = Transaction.fromBytes(
            transaction.toBytes(),
        );
        const transactionFromBytesToBytes = hex.encode(
            transactionFromBytes.toBytes(),
        );

        expect(transactionFromBytesToBytes).to.eql(hexBytes);
    });

    it("getTransactionHash", async function () {
        const hexHash =
            "c0a5795719f786f055d30c5881ea56165560cb6ab0615fc627d93dc7d4b6674b281dd826c4984aa868c97bd8bbf92178";

        const hexBytes =
            "0ad8012ad5010a6b0a130a0608ab0b10ce0412070800100018ec0718001206080010001803188084af5f2202087832005a410a2212206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc4830ffffffffffffffff7f38ffffffffffffffff7f40004a050880ceda0312660a640a206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc481a40adf8af54cee6bdd27d7fc40c992bb120daffad9a808aaf7900d44dae61313615b9cc692710bd1e872985ceecebcd7d75b662eb7a6a2853f53c8bac7bb9ec30020ad8012ad5010a6b0a130a0608ab0b10ce0412070800100018ec0718001206080010001804188084af5f2202087832005a410a2212206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc4830ffffffffffffffff7f38ffffffffffffffff7f40004a050880ceda0312660a640a206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc481a40e9eeb92c37b44f6a1ee51ff573034cd8393066409575e758f99a13124adb897c0b354e23e949558898f7c4f0be59ddf4603f408247ccf9f003408df860d8070b";

        const transaction = Transaction.fromBytes(hex.decode(hexBytes));

        const hash = await transaction.getTransactionHash();

        expect(hexHash).to.be.equal(hex.encode(hash));
    });

    it("can decode raw protobuf transaction bytes", async function () {
        const hexBytes =
            "1acc010a640a2046fe5013b6f6fc796c3e65ec10d2a10d03c07188fc3de13d46caad6b8ec4dfb81a4045f1186be5746c9783f68cb71d6a71becd3ffb024906b855ac1fa3a2601273d41b58446e5d6a0aaf421c229885f9e70417353fab2ce6e9d8e7b162e9944e19020a640a20f102e75ff7dc3d72c9b7075bb246fcc54e714c59714814011e8f4b922d2a6f0a1a40f2e5f061349ab03fa21075020c75cf876d80498ae4bac767f35941b8e3c393b0e0a886ede328e44c1df7028ea1474722f2dcd493812d04db339480909076a10122500a180a0c08a1cc98830610c092d09e0312080800100018e4881d120608001000180418b293072202087872240a220a0f0a080800100018e4881d10ff83af5f0a0f0a080800100018eb881d108084af5f";

        const transaction = Transaction.fromBytes(hex.decode(hexBytes));

        expect(
            transaction.hbarTransfers
                .get(new AccountId(476260))
                .toTinybars()
                .toString(),
        ).to.be.equal(new Hbar(1).negated().toTinybars().toString());
        expect(
            transaction.hbarTransfers
                .get(new AccountId(476267))
                .toTinybars()
                .toString(),
        ).to.be.equal(new Hbar(1).toTinybars().toString());
    });

    describe("fromBytes with 64-bit validStart (e.g. year 2125 in seconds)", function () {
        it("decodes hex bytes without throwing", function () {
            const bytes = hex.decode(HEX_BYTES_VALID_START_YEAR_2125);
            expect(() => Transaction.fromBytes(bytes)).to.not.throw();
        });

        it("decoded transaction has transactionId and validStart", function () {
            const bytes = hex.decode(HEX_BYTES_VALID_START_YEAR_2125);
            const tx = Transaction.fromBytes(bytes);
            expect(tx.transactionId).to.not.be.undefined;
            expect(tx.transactionId.validStart).to.not.be.undefined;
        });

        it("validStart toDate() decodes to year 2125 (seconds > 2^31-1)", function () {
            const bytes = hex.decode(HEX_BYTES_VALID_START_YEAR_2125);
            const tx = Transaction.fromBytes(bytes);
            const d = tx.transactionId.validStart.toDate();
            expect(d.getUTCFullYear()).to.equal(2125);
        });

        it("round-trip toBytes has consistent length", function () {
            const bytes = hex.decode(HEX_BYTES_VALID_START_YEAR_2125);
            const tx = Transaction.fromBytes(bytes);
            const reencoded = tx.toBytes();
            expect(reencoded.length).to.be.greaterThan(0);
        });
    });

    it("sign", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateECDSA();

        const transaction = new AccountCreateTransaction()
            .setNodeAccountIds([new AccountId(6)])
            .setTransactionId(TransactionId.generate(new AccountId(7)))
            .freeze();

        await transaction.sign(key1);
        await transaction.sign(key2);

        expect(key1.publicKey.verifyTransaction(transaction)).to.be.true;
        expect(key2.publicKey.verifyTransaction(transaction)).to.be.true;

        const sigMap = transaction.getSignatures();
        expect(sigMap.size).to.be.equal(1);

        for (const [nodeAccountId, nodeSignatures] of sigMap) {
            const transactionSignatures = nodeSignatures.get(
                transaction.transactionId,
            );
            expect(nodeAccountId.toString()).equals("0.0.6");
            expect(transactionSignatures.size).to.be.equal(2);
            expect(transactionSignatures.get(key1.publicKey)).to.not.be.null;
            expect(transactionSignatures.get(key2.publicKey)).to.not.be.null;

            for (const [publicKey] of transactionSignatures) {
                expect(publicKey.verifyTransaction(transaction)).to.be.true;
            }
        }
    });

    it("sets max transaction fee", async function () {
        const nodeAccountId = new AccountId(3);
        const client = Client.forTestnet({
            scheduleNetworkUpdate: false,
        }).setDefaultMaxTransactionFee(Hbar.fromTinybars(1));

        const transaction = new FileCreateTransaction()
            .setNodeAccountIds([nodeAccountId])
            .setTransactionId(TransactionId.generate(nodeAccountId))
            .setContents("Hello world")
            .freezeWith(client);

        expect(transaction.maxTransactionFee.toTinybars().toInt()).to.be.equal(
            1,
        );
    });

    it("fromBytes fails when bodies differ", function () {
        const key1 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420a58d361e61756ee809686255fda09bacb846ea8aa589c67ac39cfbcf82dd511c",
        );
        const key2 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420a58d361e61756ee809686255fda09bacb846ea8aa589c67ac39cfbcf82dd511d",
        );

        const transactionID = TransactionId.withValidStart(
            new AccountId(9),
            new Timestamp(10, 11),
        );
        const nodeAccountID1 = new AccountId(3);
        const nodeAccountID2 = new AccountId(4);

        /** @type {proto.ITransactionBody} */
        const body1 = {
            transactionID: transactionID._toProtobuf(),
            nodeAccountID: nodeAccountID1._toProtobuf(),
            transactionFee: Long.fromNumber(1),
            transactionValidDuration: { seconds: 120 },
            cryptoCreateAccount: {
                key: key1.publicKey._toProtobufKey(),
            },
        };

        /** @type {proto.ITransactionBody} */
        const body2 = {
            transactionID: transactionID._toProtobuf(),
            nodeAccountID: nodeAccountID2._toProtobuf(),
            transactionFee: Long.fromNumber(1),
            transactionValidDuration: { seconds: 120 },
            cryptoCreateAccount: {
                key: key2.publicKey._toProtobufKey(),
            },
        };

        const bodyBytes1 =
            HieroProto.proto.TransactionBody.encode(body1).finish();
        const bodyBytes2 =
            HieroProto.proto.TransactionBody.encode(body2).finish();

        const signedTransaction1 = HieroProto.proto.SignedTransaction.encode({
            bodyBytes: bodyBytes1,
        }).finish();
        const signedTransaction2 = HieroProto.proto.SignedTransaction.encode({
            bodyBytes: bodyBytes2,
        }).finish();

        const transaction1 = { signedTransactionBytes: signedTransaction1 };
        const transaction2 = { signedTransactionBytes: signedTransaction2 };

        const list = HieroProto.proto.TransactionList.encode({
            transactionList: [transaction1, transaction2],
        }).finish();

        let err = false;

        try {
            Transaction.fromBytes(list);
        } catch (error) {
            err =
                error.toString() ===
                "Error: failed to validate transaction bodies";
        }

        if (!err) {
            throw new Error(
                "transaction successfully built from invalid bytes",
            );
        }
    });

    describe("balance must be the same before and after serialization/deserialization", function () {
        // Declare float number
        const FLOAT_NUMBER = 8.02341424;

        // Declare integer number from float number
        const INTEGER_NUMBER = Math.floor(FLOAT_NUMBER);

        // Declare diffrent number types
        const NUMBERS = {
            INTEGER: INTEGER_NUMBER,
            FLOAT: FLOAT_NUMBER,
        };
        const NUMBER_TYPES = Object.keys(NUMBERS);

        // Loop through different numbers
        NUMBER_TYPES.forEach((number_type) => {
            // Declare number
            const number = NUMBERS[number_type];
            const isNumberInteger = Number.isInteger(number);

            describe(`when ${number_type.toLowerCase()} number of ${number} is passed:`, function () {
                // Declare different types of parameter
                const PARAMETERS = {
                    STRING: `${number}`,
                    NUMBER: number,
                    LONG_NUMBER: Long.fromValue(number),
                    BIG_NUMBER: new BigNumber(number),
                    ...(isNumberInteger && {
                        HBAR: (unit) => Hbar.fromString(`${number}`, unit),
                    }),
                };
                const PARAMETERS_TYPES = Object.keys(PARAMETERS);

                // Loop through different parameter types
                PARAMETERS_TYPES.forEach((parameter_type) => {
                    // Declare parameter
                    const parameter = PARAMETERS[parameter_type];

                    // If the parameter is instance of Hbar then pass the unit
                    if (typeof parameter == "function") {
                        // Declare different units
                        const UNITS_NAMES = Object.keys(HbarUnit);
                        // Loop through different units
                        UNITS_NAMES.forEach((unit) => {
                            it(`as ${parameter_type
                                .split("_")
                                .join(" ")
                                .toLowerCase()} in ${unit}`, function () {
                                // Create transaction
                                const transaction =
                                    new AccountCreateTransaction();

                                // Set initial balance
                                transaction.setInitialBalance(
                                    parameter(HbarUnit[unit]),
                                );

                                // Serialize transaction
                                const transactionBytes = transaction.toBytes();

                                // Deserialize transaction
                                const transactionFromBytes =
                                    Transaction.fromBytes(transactionBytes);

                                // Compare balance before and after serialization/deserialization
                                expect(
                                    transaction.initialBalance.toString(
                                        HbarUnit[unit],
                                    ),
                                ).to.be.equal(
                                    transactionFromBytes.initialBalance.toString(
                                        HbarUnit[unit],
                                    ),
                                );
                            });
                        });
                    } else {
                        it(`as ${parameter_type
                            .split("_")
                            .join(" ")
                            .toLowerCase()}`, function () {
                            // Create transaction
                            const transaction = new AccountCreateTransaction();

                            // Set initial balance
                            transaction.setInitialBalance(parameter);

                            // Serialize transaction
                            const transactionBytes = transaction.toBytes();

                            // Deserialize transaction
                            const transactionFromBytes =
                                Transaction.fromBytes(transactionBytes);

                            // Compare balance before and after serialization/deserialization
                            expect(
                                transaction.initialBalance.toString(
                                    HbarUnit.Hbar,
                                ),
                            ).to.be.equal(
                                transactionFromBytes.initialBalance.toString(
                                    HbarUnit.Hbar,
                                ),
                            );
                        });
                    }
                });
            });
        });
    });

    describe("addSignature tests", function () {
        let transaction, nodeAccountIds, account, txId;

        beforeEach(function () {
            account = PrivateKey.generateED25519();
            nodeAccountIds = [new AccountId(3), new AccountId(4)];
            txId = TransactionId.generate(nodeAccountIds[0]);

            transaction = new AccountCreateTransaction()
                .setKeyWithoutAlias(account.publicKey)
                .setNodeAccountIds(nodeAccountIds)
                .setTransactionId(txId)
                .freeze();
        });

        it("should add a single signature when one transaction is present", async function () {
            const sigMap = new SignatureMap();
            const pubKey = account.publicKey;

            const signaturesArray = [];
            for (const tx of transaction._signedTransactions.list) {
                //                const sig = op.sign(txChunk.bodyBytes);
                const txBody = HieroProto.proto.TransactionBody.decode(
                    tx.bodyBytes,
                );
                const txId = TransactionId._fromProtobuf(txBody.transactionID);
                const nodeAccountId = AccountId._fromProtobuf(
                    txBody.nodeAccountID,
                );
                const sig = account.sign(tx.bodyBytes);
                sigMap.addSignature(nodeAccountId, txId, pubKey, sig);
                signaturesArray.push(sig);
            }

            transaction.addSignature(pubKey, sigMap);

            const sigPairMap = transaction
                .getSignatures()
                .getFlatSignatureList();

            expect(sigPairMap.length).to.equal(
                transaction._signedTransactions.length,
            );

            /*
             This works because the order of the signatures in the sigPairMap
             is the same as the order of the signatures in the transaction.
            */
            for (const sigPair of sigPairMap) {
                expect(sigPair.get(pubKey)).to.equal(signaturesArray.shift());
            }
        });
    });

    describe("Transaction removeSignature/removeAllSignatures methods", function () {
        let key1, key2, key3;
        let transaction, transactionId, nodeAccountId;

        beforeEach(async function () {
            const account = AccountId.fromString("0.0.1004");
            const validStart = new Timestamp(1451, 590);
            transactionId = new TransactionId(account, validStart);
            nodeAccountId = new AccountId(3);

            key1 = PrivateKey.generateED25519();
            key2 = PrivateKey.generateED25519();
            key3 = PrivateKey.generateED25519();

            transaction = new AccountCreateTransaction()
                .setInitialBalance(new Hbar(2))
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();
        });

        const signAndAddSignatures = (transaction, ...keys) => {
            for (const key of keys) {
                const sigMap = createSigmap(transaction, key);
                transaction.addSignature(key.publicKey, sigMap);
            }

            return transaction.getSignatures();
        };

        const createSigmap = (transaction, key) => {
            const sigMap = new SignatureMap();
            for (const tx of transaction._signedTransactions.list) {
                const txBody = HieroProto.proto.TransactionBody.decode(
                    tx.bodyBytes,
                );
                const txId = TransactionId._fromProtobuf(txBody.transactionID);
                const nodeAccountId = AccountId._fromProtobuf(
                    txBody.nodeAccountID,
                );
                const sig = key.sign(tx.bodyBytes);

                sigMap.addSignature(nodeAccountId, txId, key.publicKey, sig);
            }
            return sigMap;
        };

        it("should remove a specific signature", function () {
            // Sign the transaction with multiple keys
            signAndAddSignatures(transaction, key1);
            //Check if the transaction internal tracking of signer public keys is correct
            expect(transaction._signerPublicKeys.size).to.equal(1);
            expect(transaction._publicKeys.length).to.equal(1);
            expect(transaction._transactionSigners.length).to.equal(1);

            // Ensure all signatures are present before removal
            const signaturesBefore = transaction
                .getSignatures()
                .getFlatSignatureList();

            expect(signaturesBefore.length).to.equal(1);

            // Remove one signature
            transaction.removeSignature(key1.publicKey);

            //Check if the transaction is frozen
            expect(transaction.isFrozen()).to.be.true;

            //Check if the transaction internal tracking of signer public keys is correct
            expect(transaction._signerPublicKeys.size).to.equal(0);
            expect(transaction._publicKeys.length).to.equal(0);
            expect(transaction._transactionSigners.length).to.equal(0);

            // Ensure the specific signature has been removed
            const signaturesAfter = transaction.getSignatures();
            expect(
                signaturesAfter
                    .get(new AccountId(3))
                    .get(transaction.transactionId).size,
            ).to.equal(0);
        });

        it("should clear all signatures", function () {
            // Sign the transaction with multiple keys
            signAndAddSignatures(transaction, key1, key2, key3);

            // Ensure all signatures are present before clearing
            const signaturesBefore = transaction.getSignatures();
            expect(
                signaturesBefore
                    .get(new AccountId(3))
                    .get(transaction.transactionId).size,
            ).to.equal(3);

            // Clear all signatures
            transaction.removeAllSignatures();

            //Check if the transaction is frozen
            expect(transaction.isFrozen()).to.be.true;

            //Check if the transaction internal tracking of signer public keys is cleared
            expect(transaction._signerPublicKeys.size).to.equal(0);
            expect(transaction._publicKeys.length).to.equal(0);
            expect(transaction._transactionSigners.length).to.equal(0);

            // Ensure all signatures have been cleared
            const signaturesAfter = transaction.getSignatures();
            expect(
                signaturesAfter
                    .get(new AccountId(3))
                    .get(transaction.transactionId).size,
            ).to.equal(0);
        });

        it("should not remove a non-existing signature", function () {
            // Sign the transaction with multiple keys
            signAndAddSignatures(transaction, key1, key2);

            // Attempt to remove a non-existing signature
            expect(() => {
                transaction.removeSignature(key3.publicKey);
            }).to.throw("The public key has not signed this transaction");

            // Ensure signatures are not affected
            const signaturesAfter = transaction
                .getSignatures()
                .get(new AccountId(3))
                .get(transaction.transactionId);
            expect(signaturesAfter.size).to.equal(2);
        });

        it("should clear and re-sign after all signatures are cleared", function () {
            // Sign the transaction with multiple keys
            signAndAddSignatures(transaction, key1, key2);

            // Ensure all signatures are present before clearing
            const signaturesBefore = transaction
                .getSignatures()
                .get(new AccountId(3))
                .get(transaction.transactionId);
            expect(signaturesBefore.size).to.equal(2);

            // Clear all signatures
            transaction.removeAllSignatures();

            // Ensure all signatures have been cleared
            const signaturesAfterClear = transaction
                .getSignatures()
                .get(new AccountId(3))
                .get(transaction.transactionId);
            expect(signaturesAfterClear.size).to.equal(0);

            // Re-sign the transaction with a different key
            const signature3 = key3.signTransaction(transaction);
            transaction.addSignature(key3.publicKey, signature3);

            // Ensure only one signature exists after re-signing
            const signaturesAfterResign = transaction.getSignatures();
            expect(signaturesAfterResign.get(new AccountId(3)).size).to.equal(
                1,
            );
        });

        it("should return the removed signature in Uint8Array format when removing a specific signature", function () {
            // Sign the transaction with multiple keys
            signAndAddSignatures(transaction, key1);

            // Remove one signature and capture the returned value
            const removedSignatures = transaction.removeSignature(
                key1.publicKey,
            );

            // Check the format of the returned value
            expect(removedSignatures).to.be.an("array");
            expect(removedSignatures.length).to.equal(1);
            expect(removedSignatures[0]).to.be.instanceOf(Uint8Array);
        });

        it("should return all removed signatures in the expected Map format when clearing all signatures", function () {
            // Sign the transaction with multiple keys
            signAndAddSignatures(transaction, key1, key2, key3);

            // Clear all signatures and capture the returned Map
            const removedSignatures = transaction.removeAllSignatures();

            // Check the format of the returned value
            expect(removedSignatures).to.be.instanceOf(Map);

            // Check if the Map contains keys using the toString() method
            const key1Exists = Array.from(removedSignatures.keys()).some(
                (key) => key.toString() === key1.publicKey.toString(),
            );
            const key2Exists = Array.from(removedSignatures.keys()).some(
                (key) => key.toString() === key2.publicKey.toString(),
            );
            const key3Exists = Array.from(removedSignatures.keys()).some(
                (key) => key.toString() === key3.publicKey.toString(),
            );

            // Assert that all keys exist
            expect(key1Exists).to.be.true;
            expect(key2Exists).to.be.true;
            expect(key3Exists).to.be.true;

            // Retrieve values using the keys and convert them to strings for comparison
            const signaturesArray1 = removedSignatures.get(
                Array.from(removedSignatures.keys()).find(
                    (key) => key.toString() === key1.publicKey.toString(),
                ),
            );

            const signaturesArray2 = removedSignatures.get(
                Array.from(removedSignatures.keys()).find(
                    (key) => key.toString() === key2.publicKey.toString(),
                ),
            );

            const signaturesArray3 = removedSignatures.get(
                Array.from(removedSignatures.keys()).find(
                    (key) => key.toString() === key3.publicKey.toString(),
                ),
            );

            // Validate that the retrieved arrays are present
            expect(signaturesArray1).to.be.an("array").that.is.not.empty;
            expect(signaturesArray2).to.be.an("array").that.is.not.empty;
            expect(signaturesArray3).to.be.an("array").that.is.not.empty;

            // Ensure the removed signatures are in the expected format
            [signaturesArray1, signaturesArray2, signaturesArray3].forEach(
                (signaturesArray) => {
                    signaturesArray.forEach((sig) => {
                        expect(sig).to.be.instanceOf(Uint8Array);
                    });
                },
            );
        });

        it("should return an empty object when no signatures are present", function () {
            expect(transaction._signerPublicKeys.size).to.equal(0);

            // Clear all signatures and capture the returned value
            const removedSignatures = transaction.removeAllSignatures();

            // Check the format of the returned value
            expect(removedSignatures).to.be.instanceOf(Map);
            expect(Object.keys(removedSignatures)).to.have.lengthOf(0);
        });

        it("should return an empty Map if transaction.sigMap is undefined", function () {
            transaction._signedTransactions.list = [1];

            const result = transaction.removeAllSignatures();
            expect(result).to.be.instanceOf(Map);
            expect(result.size).to.equal(0);
        });

        it("should return an empty Map if sigPair.pubKeyPrefix is undefined", function () {
            transaction._signedTransactions.list[0].sigMap = { sigPair: [1] };

            const result = transaction.removeAllSignatures();
            expect(result).to.be.instanceOf(Map);
            expect(result.size).to.equal(0);
        });
    });

    it("toBytesAsync", async function () {
        const key = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420a58d361e61756ee809686255fda09bacb846ea8aa589c67ac39cfbcf82dd511c",
        );
        const account = AccountId.fromString("0.0.1004");
        const validStart = new Timestamp(1451, 590);
        const transactionId = new TransactionId(account, validStart);

        const hexBytes =
            "0adb012ad8010a6e0a130a0608ab0b10ce0412070800100018ec0718001206080010001803188084af5f2202087832005a440a2212206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc4830ffffffffffffffff7f38ffffffffffffffff7f40004a050880ceda0388010012660a640a206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc481a406f7b1823defed495205f67504243abd623bef1eb9dc4053b879b5e25fff382814172d0676464a6a5b7adfc7968ae8af236ac91fd751d632c0412b5f77431930d0adb012ad8010a6e0a130a0608ab0b10ce0412070800100018ec0718001206080010001804188084af5f2202087832005a440a2212206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc4830ffffffffffffffff7f38ffffffffffffffff7f40004a050880ceda0388010012660a640a206e0433faf04e8a674a114ed04d27bd43b0549a2ed69c9709a5a2058922c0cc481a408d3fb2b8da90457cc447771361b0e27f784b70664604a5490a135595a69f2bbf2fd725a703174999d25f6f295cd58f116210dffefb94703c34fc8107be0a7908";

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setNodeAccountIds([new AccountId(3), new AccountId(4)])
            .setTransactionId(transactionId)
            .freeze()
            .sign(key);

        const transactionBytesHex = await transaction
            .toBytesAsync()
            .then((bytes) => hex.encode(bytes));
        expect(transactionBytesHex).to.eql(hexBytes);

        const transactionFromBytes = Transaction.fromBytes(
            await transaction.toBytesAsync(),
        );
        const transactionFromBytesToBytes = hex.encode(
            await transactionFromBytes.toBytesAsync(),
        );

        expect(transactionFromBytesToBytes).to.eql(hexBytes);
    });

    it("getSignaturesAsync", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateECDSA();

        const transaction = new AccountCreateTransaction()
            .setNodeAccountIds([new AccountId(6)])
            .setTransactionId(TransactionId.generate(new AccountId(7)))
            .freeze();

        await transaction.sign(key1);
        await transaction.sign(key2);

        const sigMap = await transaction.getSignaturesAsync();
        expect(sigMap.size).to.be.equal(1);

        for (const [nodeAccountId, nodeSignatures] of sigMap) {
            const transactionSignatures = nodeSignatures.get(
                transaction.transactionId,
            );
            expect(nodeAccountId.toString()).equals("0.0.6");
            expect(transactionSignatures.size).to.be.equal(2);
            expect(transactionSignatures.get(key1.publicKey)).to.not.be.null;
            expect(transactionSignatures.get(key2.publicKey)).to.not.be.null;

            for (const [publicKey] of transactionSignatures) {
                expect(publicKey.verifyTransaction(transaction)).to.be.true;
            }
        }
    });

    it("getTransactionHashPerNode", async function () {
        const transaction = new AccountCreateTransaction()
            .setKeyWithoutAlias(PrivateKey.generateED25519())
            .setNodeAccountIds([new AccountId(3), new AccountId(4)])
            .setTransactionId(TransactionId.generate(new AccountId(7)))
            .freeze();

        const hashesPerNode = await transaction.getTransactionHashPerNode();

        expect(hashesPerNode.size).to.be.equal(2);
        expect(hashesPerNode.get(new AccountId(3))).to.be.not.null;
        expect(hashesPerNode.get(new AccountId(4))).to.be.not.null;
    });

    describe("size", function () {
        let transaction;
        let account;
        let nodeAccountId;
        let transactionId;

        beforeEach(function () {
            account = AccountId.fromString("0.0.1004");
            nodeAccountId = new AccountId(3);
            const validStart = new Timestamp(1451, 590);
            transactionId = new TransactionId(account, validStart);

            transaction = new AccountCreateTransaction()
                .setInitialBalance(new Hbar(2))
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();
        });

        it("should return the correct transaction size in bytes", async function () {
            const size = await transaction.size;
            expect(size).to.be.a("number");
            expect(size).to.be.greaterThan(0);
        });

        it("should return proper sizes for FileAppend transactions when chunked tx", async function () {
            const content = new Uint8Array(2048).fill("a".charCodeAt(0)); // 97 is ASCII for 'a'

            const fileAppendTx = new FileAppendTransaction()
                .setFileId(new FileId(1))
                .setContents(content)
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();

            // Get size of the chunked transaction
            const size = await fileAppendTx.size;

            // Since content is 2KB and CHUNK_SIZE is 1KB, this should create 2 chunks
            // Each chunk should have its own transaction, so size should reflect total size of all chunks
            expect(size).to.be.greaterThan(1024); // Size should be greater than single chunk

            // Create a small content transaction for comparison
            const smallContent = new Uint8Array(512).fill("a".charCodeAt(0));
            const smallFileAppendTx = new FileAppendTransaction()
                .setFileId(new FileId(1))
                .setContents(smallContent)
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();

            const smallSize = await smallFileAppendTx.size;

            // The larger chunked transaction should be bigger than the small single-chunk transaction
            expect(size).to.be.greaterThan(smallSize);
        });

        it("should return different sizes for transactions with different signatures", async function () {
            const key = PrivateKey.generateED25519();
            const sizeBeforeSign = await transaction.size;

            await transaction.sign(key);
            const sizeAfterSign = await transaction.size;

            expect(sizeAfterSign).to.be.greaterThan(sizeBeforeSign);
        });

        it("should return the same size for identical transactions", async function () {
            const size1 = await transaction.size;
            const size2 = await transaction.size;

            expect(size1).to.equal(size2);
        });

        it("should return the correct transaction body size in bytes", function () {
            const bodySize = transaction.bodySize;
            expect(bodySize).to.be.a("number");
            expect(bodySize).to.be.greaterThan(0);
        });

        it("should return different sizes for transactions with different contents", function () {
            const transaction1 = new FileCreateTransaction().setContents(
                new TextEncoder().encode("a"),
            );

            const transaction2 = new FileCreateTransaction().setContents(
                new TextEncoder().encode("abcdefghjk"),
            );
            expect(transaction1.bodySize).to.not.equal(transaction2.bodySize);
        });

        it("should return the same size for identical transaction bodies", function () {
            const bodySize1 = transaction.bodySize;
            const bodySize2 = transaction.bodySize;

            expect(bodySize1).to.equal(bodySize2);
        });

        it("should be smaller than total transaction size", async function () {
            const totalSize = await transaction.size;
            const bodySize = transaction.bodySize;

            expect(bodySize).to.be.lessThan(totalSize);
        });

        it("should handle empty optional fields", function () {
            const minimalTx = new AccountCreateTransaction()
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();

            const fullTx = new AccountCreateTransaction()
                .setInitialBalance(new Hbar(1))
                .setTransactionMemo("memo")
                .setMaxTransactionFee(new Hbar(1))
                .setTransactionValidDuration(120)
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();

            expect(minimalTx.bodySize).to.be.lessThan(fullTx.bodySize);
        });

        it("should return array of body sizes for multi-chunk transaction", function () {
            // Create content larger than chunk size to force multiple chunks
            const CHUNK_SIZE = 1024;
            const content = new Uint8Array(CHUNK_SIZE * 3).fill(
                "a".charCodeAt(0),
            ); // Will create 3 chunks

            const fileAppendTx = new FileAppendTransaction()
                .setFileId(new FileId(1))
                .setChunkSize(CHUNK_SIZE)
                .setContents(content)
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();

            const bodySizes = fileAppendTx.bodySizeAllChunks;

            // Verify we got an array of sizes
            expect(Array.isArray(bodySizes)).to.be.true;
            expect(bodySizes).to.have.lengthOf(3);
            bodySizes.forEach((size) => {
                expect(size).to.be.a("number").and.be.greaterThan(0);
            });
        });

        it("should return array of one size for single-chunk transaction", function () {
            const smallContent = new Uint8Array(500).fill("a".charCodeAt(0));

            const fileAppendTx = new FileAppendTransaction()
                .setFileId(new FileId(1))
                .setContents(smallContent)
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();

            const bodySizes = fileAppendTx.bodySizeAllChunks;

            expect(Array.isArray(bodySizes)).to.be.true;
            expect(bodySizes).to.have.lengthOf(1);
            expect(bodySizes[0]).to.be.a("number").and.be.greaterThan(0);
        });

        it("should return empty array for transaction with no content", function () {
            const fileAppendTx = new FileAppendTransaction()
                .setFileId(new FileId(1))
                .setTransactionId(transactionId)
                .setNodeAccountIds([nodeAccountId])
                .freeze();

            const bodySizes = fileAppendTx.bodySizeAllChunks;

            expect(Array.isArray(bodySizes)).to.be.true;
            expect(bodySizes).to.have.lengthOf(1); // Should still have one empty chunk
        });
    });
    describe("signableNodeBodyBytesList getter", function () {
        it("should throw error when transaction is not frozen", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(2), new Hbar(-1))
                .addHbarTransfer(new AccountId(3), new Hbar(1))
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(2)));

            expect(() => transaction.signableNodeBodyBytesList).to.throw(
                "transaction must have been frozen before calculating the hash will be stable, try calling `freeze`",
            );
        });

        it("should return correct signable bytes for single node transaction", function () {
            const nodeAccountId = new AccountId(3);
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(2), new Hbar(-1))
                .addHbarTransfer(new AccountId(3), new Hbar(1))
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();

            const signableBytesList = transaction.signableNodeBodyBytesList;

            expect(signableBytesList).to.be.an("array");
            expect(signableBytesList.length).to.equal(1);

            const signableBytes = signableBytesList[0];
            expect(signableBytes).to.be.instanceOf(
                SignableNodeTransactionBodyBytes,
            );
            expect(signableBytes.nodeAccountId.toString()).to.equal(
                nodeAccountId.toString(),
            );
            expect(signableBytes.transactionId.accountId.toString()).to.equal(
                "0.0.2",
            );
            expect(signableBytes.signableTransactionBodyBytes).to.be.instanceOf(
                Uint8Array,
            );
        });

        it("should return correct transaction body contents", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(2), new Hbar(-1))
                .addHbarTransfer(new AccountId(3), new Hbar(1))
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();

            const signableBytesList = transaction.signableNodeBodyBytesList;
            const body = HieroProto.proto.TransactionBody.decode(
                signableBytesList[0].signableTransactionBodyBytes,
            );

            expect(body).to.have.property("cryptoTransfer");
            expect(body.nodeAccountID).to.not.be.null;
            expect(body.transactionID).to.not.be.null;
        });

        it("should return correct signable bytes for multiple nodes", function () {
            const nodeAccountIds = [new AccountId(3), new AccountId(4)];
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(2), new Hbar(-1))
                .addHbarTransfer(new AccountId(3), new Hbar(1))
                .setNodeAccountIds(nodeAccountIds)
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();

            const signableBytesList = transaction.signableNodeBodyBytesList;

            expect(signableBytesList).to.be.an("array");
            expect(signableBytesList.length).to.equal(2);

            for (let i = 0; i < signableBytesList.length; i++) {
                const signableBytes = signableBytesList[i];
                expect(signableBytes).to.be.instanceOf(
                    SignableNodeTransactionBodyBytes,
                );
                expect(signableBytes.nodeAccountId.toString()).to.equal(
                    nodeAccountIds[i].toString(),
                );
                expect(
                    signableBytes.transactionId.accountId.toString(),
                ).to.equal("0.0.2");
                expect(
                    signableBytes.signableTransactionBodyBytes,
                ).to.be.instanceOf(Uint8Array);

                const body = HieroProto.proto.TransactionBody.decode(
                    signableBytes.signableTransactionBodyBytes,
                );
                expect(body.nodeAccountID).to.not.be.null;
                expect(body.transactionID).to.not.be.null;
            }
        });

        it("should return correct signable bytes for file append with multiple chunks", function () {
            // Create test content
            const bigContents = Array(1000)
                .fill("Lorem ipsum dolor sit amet. ")
                .join("");

            const nodeAccountIds = [new AccountId(3), new AccountId(4)];
            const transaction = new FileAppendTransaction()
                .setFileId(new AccountId(5))
                .setContents(bigContents)
                .setNodeAccountIds(nodeAccountIds)
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();

            const expectedSignableBytesListLength = Math.ceil(
                (bigContents.length / transaction.chunkSize) *
                    nodeAccountIds.length,
            );

            const signableBytesList = transaction.signableNodeBodyBytesList;

            expect(signableBytesList).to.be.an("array");
            expect(signableBytesList.length).to.equal(
                expectedSignableBytesListLength,
            );
        });

        it("should throw error if bodyBytes is missing in signed transaction", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(2), new Hbar(-1))
                .addHbarTransfer(new AccountId(3), new Hbar(1))
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();

            transaction._signedTransactions.list[0].bodyBytes = null;

            expect(() => transaction.signableNodeBodyBytesList).to.throw(
                "Missing bodyBytes in signed transaction.",
            );
        });

        it("should throw error if nodeAccountID is missing in transaction body", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(2), new Hbar(-1))
                .addHbarTransfer(new AccountId(3), new Hbar(1))
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();

            const body = HieroProto.proto.TransactionBody.decode(
                transaction._signedTransactions.list[0].bodyBytes,
            );
            body.nodeAccountID = null;
            transaction._signedTransactions.list[0].bodyBytes =
                HieroProto.proto.TransactionBody.encode(body).finish();

            expect(() => transaction.signableNodeBodyBytesList).to.throw(
                "Missing nodeAccountID in transaction body.",
            );
        });

        it("should throw error if transactionID is missing in transaction body", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(2), new Hbar(-1))
                .addHbarTransfer(new AccountId(3), new Hbar(1))
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();

            const body = HieroProto.proto.TransactionBody.decode(
                transaction._signedTransactions.list[0].bodyBytes,
            );
            body.transactionID = null;
            transaction._signedTransactions.list[0].bodyBytes =
                HieroProto.proto.TransactionBody.encode(body).finish();

            expect(() => transaction.signableNodeBodyBytesList).to.throw(
                "Missing transactionID in transaction body.",
            );
        });
    });
    it("fromBytes fails when chunked file append has different contents", function () {
        const bigContents = Array(1000)
            .fill("Lorem ipsum dolor sit amet. ")
            .join("");

        // Create a FileAppendTransaction with the big contents
        const transaction = new FileAppendTransaction()
            .setFileId(new FileId(1, 2, 3))
            .setContents(bigContents)
            .setNodeAccountIds([new AccountId(3), new AccountId(4)])
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(9),
                    new Timestamp(10, 11),
                ),
            )
            .freeze();

        // Serialize the transaction
        const bytes = transaction.toBytes();

        // Decode the transaction list
        const transactionList = HieroProto.proto.TransactionList.decode(bytes);

        // Modify one of the chunks by changing its contents
        const firstTransaction = transactionList.transactionList[0];
        const signedTransaction = HieroProto.proto.SignedTransaction.decode(
            firstTransaction.signedTransactionBytes,
        );
        const body = HieroProto.proto.TransactionBody.decode(
            signedTransaction.bodyBytes,
        );

        // Modify the contents by changing the first chunk
        if (body.fileAppend && body.fileAppend.contents) {
            // Replace the first chunk with different content
            body.fileAppend.contents = new TextEncoder().encode(
                "Modified content that should cause failure",
            );
        }

        // Re-encode the modified body
        const modifiedBodyBytes =
            HieroProto.proto.TransactionBody.encode(body).finish();
        const modifiedSignedTransaction =
            HieroProto.proto.SignedTransaction.encode({
                bodyBytes: modifiedBodyBytes,
                sigMap: signedTransaction.sigMap,
            }).finish();

        // Replace the first transaction with the modified one
        transactionList.transactionList[0] = {
            signedTransactionBytes: modifiedSignedTransaction,
        };

        // Re-encode the entire transaction list
        const modifiedBytes =
            HieroProto.proto.TransactionList.encode(transactionList).finish();

        // Attempt to deserialize should throw an error
        let err = false;
        try {
            Transaction.fromBytes(modifiedBytes);
        } catch (error) {
            err =
                error.toString() ===
                "Error: failed to validate transaction bodies";
        }

        if (!err) {
            throw new Error(
                "transaction successfully built from invalid bytes",
            );
        }
    });

    describe("Transaction node management", function () {
        /** @type {Client} */
        let client;

        beforeEach(function () {
            client = Client.forTestnet({
                scheduleNetworkUpdate: false,
            });
        });

        describe("With explicit setNodeAccountIds (freeze())", function () {
            it("should have correct counts for transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create transaction with explicit node IDs
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // Sign the transaction
                await transaction.sign(key);

                // Verify initial state before _beforeExecute
                expect(transaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                // Call _beforeExecute
                await transaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged since no maxNodesPerTransaction is set
                expect(transaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._transactionIds.length).to.equal(1);
                expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                // Verify node IDs are correct and in the same order
                for (let i = 0; i < nodeAccountIds.length; i++) {
                    expect(
                        transaction._nodeAccountIds.list[i].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify transaction ID is preserved
                expect(transaction._transactionIds.list[0]).to.not.be.null;
                expect(
                    transaction._transactionIds.list[0].accountId.toString(),
                ).to.equal("0.0.2");

                // Verify signature is still valid
                expect(key.publicKey.verifyTransaction(transaction)).to.be.true;
            });

            it("should have correct counts for chunked transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create chunked transaction with large content
                const largeContent = new Uint8Array(8192).fill(65); // 8KB content to ensure chunking
                const transaction = new FileAppendTransaction()
                    .setFileId(new FileId(123))
                    .setContents(largeContent)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // Sign the transaction
                await transaction.sign(key);

                // Get expected chunk count
                const expectedChunkCount = transaction.getRequiredChunks();
                expect(expectedChunkCount).to.be.greaterThan(1); // Ensure it's actually chunked

                // Verify initial state before _beforeExecute
                expect(transaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    nodeAccountIds.length * expectedChunkCount,
                );
                expect(transaction._transactionIds.length).to.equal(
                    expectedChunkCount,
                );
                expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                // Call _beforeExecute
                await transaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged since no maxNodesPerTransaction is set
                expect(transaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    nodeAccountIds.length * expectedChunkCount,
                );
                expect(transaction._transactionIds.length).to.equal(
                    expectedChunkCount,
                );
                expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                // Verify node IDs are correct and in the same order
                for (let i = 0; i < nodeAccountIds.length; i++) {
                    expect(
                        transaction._nodeAccountIds.list[i].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify all transaction IDs are preserved
                for (let i = 0; i < expectedChunkCount; i++) {
                    expect(transaction._transactionIds.list[i]).to.not.be.null;
                    expect(
                        transaction._transactionIds.list[
                            i
                        ].accountId.toString(),
                    ).to.equal("0.0.2");
                }

                // Verify signature is still valid
                expect(key.publicKey.verifyTransaction(transaction)).to.be.true;
            });

            it("should have correct counts for transactions without signatures when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create transaction with explicit node IDs (NO signing)
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // DO NOT sign the transaction - test unsigned transaction behavior

                // Verify initial state before _beforeExecute
                expect(transaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                // Call _beforeExecute
                await transaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged since no maxNodesPerTransaction is set
                expect(transaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(transaction._transactionIds.length).to.equal(1);
                expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                // Verify node IDs are correct and in the same order
                for (let i = 0; i < nodeAccountIds.length; i++) {
                    expect(
                        transaction._nodeAccountIds.list[i].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify transaction ID is preserved
                expect(transaction._transactionIds.list[0]).to.not.be.null;
                expect(
                    transaction._transactionIds.list[0].accountId.toString(),
                ).to.equal("0.0.2");

                // Verify no signatures exist (transaction was not signed)
                const signatures = transaction.getSignatures();
                let totalSignatures = 0;
                for (const [, nodeSignatures] of signatures) {
                    for (const [, transactionSignatures] of nodeSignatures) {
                        totalSignatures += transactionSignatures.size;
                    }
                }
                expect(totalSignatures).to.equal(0);
            });
        });

        describe("With client set nodes (testnet) (freezeWith(client))", function () {
            it("should have correct counts for transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();

                // Create transaction with client-selected nodes (testnet)
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freezeWith(client);

                // Sign the transaction
                await transaction.sign(key);

                // Get the client-selected node count
                const clientSelectedNodeCount =
                    transaction._nodeAccountIds.length;
                expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet

                // Verify initial state before _beforeExecute
                expect(transaction._nodeAccountIds.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                // Call _beforeExecute
                await transaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged since no maxNodesPerTransaction is set
                expect(transaction._nodeAccountIds.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._transactionIds.length).to.equal(1);
                expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                // Verify transaction ID is preserved
                expect(transaction._transactionIds.list[0]).to.not.be.null;
                expect(
                    transaction._transactionIds.list[0].accountId.toString(),
                ).to.equal("0.0.2");

                // Verify signature is still valid
                expect(key.publicKey.verifyTransaction(transaction)).to.be.true;
            });

            it("should have correct counts for chunked transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();

                // Create chunked transaction with client-selected nodes (testnet)
                const largeContent = new Uint8Array(8192).fill(65); // 8KB content to ensure chunking
                const transaction = new FileAppendTransaction()
                    .setFileId(new FileId(123))
                    .setContents(largeContent)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freezeWith(client);

                // Sign the transaction
                await transaction.sign(key);

                // Get the client-selected node count and expected chunk count
                const clientSelectedNodeCount =
                    transaction._nodeAccountIds.length;
                const expectedChunkCount = transaction.getRequiredChunks();
                expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet
                expect(expectedChunkCount).to.be.greaterThan(1); // Ensure it's actually chunked

                // Verify initial state before _beforeExecute
                expect(transaction._nodeAccountIds.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    clientSelectedNodeCount * expectedChunkCount,
                );
                expect(transaction._transactionIds.length).to.equal(
                    expectedChunkCount,
                );
                expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                // Call _beforeExecute
                await transaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged since no maxNodesPerTransaction is set
                expect(transaction._nodeAccountIds.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    clientSelectedNodeCount * expectedChunkCount,
                );
                expect(transaction._transactionIds.length).to.equal(
                    expectedChunkCount,
                );
                expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                // Verify all transaction IDs are preserved
                for (let i = 0; i < expectedChunkCount; i++) {
                    expect(transaction._transactionIds.list[i]).to.not.be.null;
                    expect(
                        transaction._transactionIds.list[
                            i
                        ].accountId.toString(),
                    ).to.equal("0.0.2");
                }

                // Verify signature is still valid
                expect(key.publicKey.verifyTransaction(transaction)).to.be.true;
            });

            it("should have correct counts for transactions without signatures when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();

                // Create transaction with client-selected nodes (testnet) (NO signing)
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freezeWith(client);

                // DO NOT sign the transaction - test unsigned transaction behavior

                // Get the client-selected node count
                const clientSelectedNodeCount =
                    transaction._nodeAccountIds.length;
                expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet

                // Verify initial state before _beforeExecute
                expect(transaction._nodeAccountIds.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                // Call _beforeExecute
                await transaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged since no maxNodesPerTransaction is set
                expect(transaction._nodeAccountIds.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._signedTransactions.length).to.equal(
                    clientSelectedNodeCount,
                );
                expect(transaction._transactionIds.length).to.equal(1);
                expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                // Verify transaction ID is preserved
                expect(transaction._transactionIds.list[0]).to.not.be.null;
                expect(
                    transaction._transactionIds.list[0].accountId.toString(),
                ).to.equal("0.0.2");

                // Verify no signatures exist (transaction was not signed)
                const signatures = transaction.getSignatures();
                let totalSignatures = 0;
                for (const [, nodeSignatures] of signatures) {
                    for (const [, transactionSignatures] of nodeSignatures) {
                        totalSignatures += transactionSignatures.size;
                    }
                }
                expect(totalSignatures).to.equal(0);
            });
        });

        describe("With (client.setMaxNodesPerTransaction) set before transaction frozen and signed", function () {
            describe("With explicit setNodeAccountIds (freeze())", function () {
                it("should have correct counts for transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                    const key = PrivateKey.generateED25519();
                    const nodeAccountIds = [
                        new AccountId(3),
                        new AccountId(4),
                        new AccountId(5),
                        new AccountId(6),
                    ];

                    // Set maxNodesPerTransaction BEFORE freezing
                    client.setMaxNodesPerTransaction(2);

                    // Create transaction with explicit node IDs
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setNodeAccountIds(nodeAccountIds)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freeze();

                    // Verify initial state before _beforeExecute - should still have all original nodes
                    expect(transaction._nodeAccountIds.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                    expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                    const expectedNodeCount = 2; // client.setMaxNodesPerTransaction(2)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(1);
                    expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                    // Verify node IDs are correct and in the same order (first N nodes)
                    for (let i = 0; i < expectedNodeCount; i++) {
                        expect(
                            transaction._nodeAccountIds.list[i].toString(),
                        ).to.equal(nodeAccountIds[i].toString());
                    }

                    // Verify transaction ID is preserved
                    expect(transaction._transactionIds.list[0]).to.not.be.null;
                    expect(
                        transaction._transactionIds.list[0].accountId.toString(),
                    ).to.equal("0.0.2");

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should have correct counts for chunked transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                    const key = PrivateKey.generateED25519();
                    const nodeAccountIds = [
                        new AccountId(3),
                        new AccountId(4),
                        new AccountId(5),
                        new AccountId(6),
                    ];

                    // Set maxNodesPerTransaction BEFORE freezing
                    client.setMaxNodesPerTransaction(2);

                    // Create chunked transaction with large content
                    const largeContent = new Uint8Array(8192).fill(65); // 8KB content to ensure chunking
                    const transaction = new FileAppendTransaction()
                        .setFileId(new FileId(123))
                        .setContents(largeContent)
                        .setNodeAccountIds(nodeAccountIds)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freeze();

                    // Get expected chunk count
                    const expectedChunkCount = transaction.getRequiredChunks();
                    expect(expectedChunkCount).to.be.greaterThan(1); // Ensure it's actually chunked

                    // Verify initial state before _beforeExecute - should still have all original nodes
                    expect(transaction._nodeAccountIds.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        nodeAccountIds.length * expectedChunkCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(
                        expectedChunkCount,
                    );
                    expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                    const expectedNodeCount = 2; // client.setMaxNodesPerTransaction(2)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        expectedNodeCount * expectedChunkCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(
                        expectedChunkCount,
                    );
                    expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                    // Verify node IDs are correct and in the same order (first N nodes)
                    for (let i = 0; i < expectedNodeCount; i++) {
                        expect(
                            transaction._nodeAccountIds.list[i].toString(),
                        ).to.equal(nodeAccountIds[i].toString());
                    }

                    // Verify all transaction IDs are preserved
                    for (let i = 0; i < expectedChunkCount; i++) {
                        expect(transaction._transactionIds.list[i]).to.not.be
                            .null;
                        expect(
                            transaction._transactionIds.list[
                                i
                            ].accountId.toString(),
                        ).to.equal("0.0.2");
                    }

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should not modify when setMaxNodesPerTransaction is explicitly set to 0", async function () {
                    const key = PrivateKey.generateED25519();
                    const nodeAccountIds = [
                        new AccountId(3),
                        new AccountId(4),
                        new AccountId(5),
                        new AccountId(6),
                    ];

                    // Set maxNodesPerTransaction to 0 BEFORE freezing (should disable limiting)
                    client.setMaxNodesPerTransaction(0);

                    // Create transaction with explicit node IDs
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setNodeAccountIds(nodeAccountIds)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freeze();

                    // Verify initial state before _beforeExecute
                    expect(transaction._nodeAccountIds.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        nodeAccountIds.length,
                    );

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should remain unchanged (0 disables limiting)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        nodeAccountIds.length,
                    );

                    // Verify all node IDs are preserved
                    for (let i = 0; i < nodeAccountIds.length; i++) {
                        expect(
                            transaction._nodeAccountIds.list[i].toString(),
                        ).to.equal(nodeAccountIds[i].toString());
                    }

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should not modify when setMaxNodesPerTransaction is greater than the number of nodeIds in the transaction", async function () {
                    const key = PrivateKey.generateED25519();
                    const nodeAccountIds = [
                        new AccountId(3),
                        new AccountId(4),
                        new AccountId(5),
                        new AccountId(6),
                    ];

                    // Set maxNodesPerTransaction greater than nodeAccountIds.length BEFORE freezing
                    client.setMaxNodesPerTransaction(10); // Greater than 4 nodes

                    // Create transaction with explicit node IDs
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setNodeAccountIds(nodeAccountIds)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freeze();

                    // Verify initial state before _beforeExecute
                    expect(transaction._nodeAccountIds.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        nodeAccountIds.length,
                    );

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should remain unchanged (limit > actual nodes)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        nodeAccountIds.length,
                    );

                    // Verify all node IDs are preserved
                    for (let i = 0; i < nodeAccountIds.length; i++) {
                        expect(
                            transaction._nodeAccountIds.list[i].toString(),
                        ).to.equal(nodeAccountIds[i].toString());
                    }

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should have correct counts for transactions without signatures when _beforeExecute is called", async function () {
                    const key = PrivateKey.generateED25519();
                    const nodeAccountIds = [
                        new AccountId(3),
                        new AccountId(4),
                        new AccountId(5),
                        new AccountId(6),
                    ];

                    // Set maxNodesPerTransaction BEFORE freezing
                    client.setMaxNodesPerTransaction(2);

                    // Create transaction with explicit node IDs (NO signing)
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setNodeAccountIds(nodeAccountIds)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freeze();

                    // DO NOT sign the transaction - test unsigned transaction behavior

                    // Verify initial state before _beforeExecute - should still have all original nodes
                    expect(transaction._nodeAccountIds.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        nodeAccountIds.length,
                    );
                    expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                    expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                    // Call _beforeExecute
                    await transaction._beforeExecute(client);

                    // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                    const expectedNodeCount = 2; // client.setMaxNodesPerTransaction(2)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(1);
                    expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                    // Verify node IDs are correct and in the same order (first N nodes)
                    for (let i = 0; i < expectedNodeCount; i++) {
                        expect(
                            transaction._nodeAccountIds.list[i].toString(),
                        ).to.equal(nodeAccountIds[i].toString());
                    }

                    // Verify transaction ID is preserved
                    expect(transaction._transactionIds.list[0]).to.not.be.null;
                    expect(
                        transaction._transactionIds.list[0].accountId.toString(),
                    ).to.equal("0.0.2");

                    // Verify no signatures exist (transaction was not signed)
                    const signatures = transaction.getSignatures();
                    let totalSignatures = 0;
                    for (const [, nodeSignatures] of signatures) {
                        for (const [
                            ,
                            transactionSignatures,
                        ] of nodeSignatures) {
                            totalSignatures += transactionSignatures.size;
                        }
                    }
                    expect(totalSignatures).to.equal(0);
                });
            });

            describe("With client set nodes (testnet) (freezeWith(client))", function () {
                it("should have correct counts for transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                    const key = PrivateKey.generateED25519();

                    // Set maxNodesPerTransaction BEFORE freezing
                    client.setMaxNodesPerTransaction(2);

                    // Create transaction with client-selected nodes (testnet)
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freezeWith(client);

                    // Get the client-selected node count
                    const clientSelectedNodeCount =
                        transaction._nodeAccountIds.length;
                    expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet

                    // Verify initial state before _beforeExecute - should still have all client-selected nodes
                    expect(transaction._nodeAccountIds.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                    expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                    const expectedNodeCount = Math.min(
                        2,
                        clientSelectedNodeCount,
                    ); // min(maxNodes, actualNodes)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(1);
                    expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                    // Verify transaction ID is preserved
                    expect(transaction._transactionIds.list[0]).to.not.be.null;
                    expect(
                        transaction._transactionIds.list[0].accountId.toString(),
                    ).to.equal("0.0.2");

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should have correct counts for chunked transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                    const key = PrivateKey.generateED25519();

                    // Set maxNodesPerTransaction BEFORE freezing
                    client.setMaxNodesPerTransaction(2);

                    // Create chunked transaction with client-selected nodes (testnet)
                    const largeContent = new Uint8Array(8192).fill(65); // 8KB content to ensure chunking
                    const transaction = new FileAppendTransaction()
                        .setFileId(new FileId(123))
                        .setContents(largeContent)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freezeWith(client);

                    // Get the client-selected node count and expected chunk count
                    const clientSelectedNodeCount =
                        transaction._nodeAccountIds.length;
                    const expectedChunkCount = transaction.getRequiredChunks();
                    expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet
                    expect(expectedChunkCount).to.be.greaterThan(1); // Ensure it's actually chunked

                    // Verify initial state before _beforeExecute - should still have all client-selected nodes
                    expect(transaction._nodeAccountIds.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        clientSelectedNodeCount * expectedChunkCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(
                        expectedChunkCount,
                    );
                    expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                    const expectedNodeCount = Math.min(
                        2,
                        clientSelectedNodeCount,
                    ); // min(maxNodes, actualNodes)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        expectedNodeCount * expectedChunkCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(
                        expectedChunkCount,
                    );
                    expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                    // Verify all transaction IDs are preserved
                    for (let i = 0; i < expectedChunkCount; i++) {
                        expect(transaction._transactionIds.list[i]).to.not.be
                            .null;
                        expect(
                            transaction._transactionIds.list[
                                i
                            ].accountId.toString(),
                        ).to.equal("0.0.2");
                    }

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should not modify when setMaxNodesPerTransaction is explicitly set to 0", async function () {
                    const key = PrivateKey.generateED25519();

                    // Set maxNodesPerTransaction to 0 BEFORE freezing (should disable limiting)
                    client.setMaxNodesPerTransaction(0);

                    // Create transaction with client-selected nodes (testnet)
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freezeWith(client);

                    // Get the client-selected node count
                    const clientSelectedNodeCount =
                        transaction._nodeAccountIds.length;
                    expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet

                    // Verify initial state before _beforeExecute
                    expect(transaction._nodeAccountIds.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        clientSelectedNodeCount,
                    );

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should remain unchanged (0 disables limiting)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        clientSelectedNodeCount,
                    );

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should not modify when setMaxNodesPerTransaction is greater than the number of nodeIds in the transaction", async function () {
                    const key = PrivateKey.generateED25519();

                    // Set maxNodesPerTransaction greater than expected client nodes BEFORE freezing
                    client.setMaxNodesPerTransaction(100); // Much greater than typical testnet node count

                    // Create transaction with client-selected nodes (testnet)
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freezeWith(client);

                    // Get the client-selected node count
                    const clientSelectedNodeCount =
                        transaction._nodeAccountIds.length;
                    expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet

                    // Verify initial state before _beforeExecute
                    expect(transaction._nodeAccountIds.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        clientSelectedNodeCount,
                    );

                    // Call _beforeExecute (this applies maxNodesPerTransaction trimming)
                    await transaction._beforeExecute(client);

                    // Sign the transaction AFTER trimming has been applied
                    await transaction.sign(key);

                    // Verify state after _beforeExecute - should remain unchanged (limit > actual nodes)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        clientSelectedNodeCount,
                    );

                    // Verify signature is still valid
                    expect(key.publicKey.verifyTransaction(transaction)).to.be
                        .true;
                });

                it("should have correct counts for transactions without signatures when _beforeExecute is called", async function () {
                    const key = PrivateKey.generateED25519();

                    // Set maxNodesPerTransaction BEFORE freezing
                    client.setMaxNodesPerTransaction(2);

                    // Create transaction with client-selected nodes (testnet) (NO signing)
                    const transaction = new AccountCreateTransaction()
                        .setKey(key.publicKey)
                        .setTransactionId(
                            TransactionId.generate(new AccountId(2)),
                        )
                        .freezeWith(client);

                    // DO NOT sign the transaction - test unsigned transaction behavior

                    // Get the client-selected node count
                    const clientSelectedNodeCount =
                        transaction._nodeAccountIds.length;
                    expect(clientSelectedNodeCount).to.be.greaterThan(0); // Should have nodes from testnet

                    // Verify initial state before _beforeExecute - should still have all client-selected nodes
                    expect(transaction._nodeAccountIds.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        clientSelectedNodeCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(1); // Single transaction ID for non-chunked
                    expect(transaction._transactions.length).to.equal(0); // Should be empty initially

                    // Call _beforeExecute
                    await transaction._beforeExecute(client);

                    // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                    const expectedNodeCount = Math.min(
                        2,
                        clientSelectedNodeCount,
                    ); // min(maxNodes, actualNodes)
                    expect(transaction._nodeAccountIds.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._signedTransactions.length).to.equal(
                        expectedNodeCount,
                    );
                    expect(transaction._transactionIds.length).to.equal(1);
                    expect(transaction._transactions.length).to.equal(0); // Still empty as no _buildAllTransactions called

                    // Verify transaction ID is preserved
                    expect(transaction._transactionIds.list[0]).to.not.be.null;
                    expect(
                        transaction._transactionIds.list[0].accountId.toString(),
                    ).to.equal("0.0.2");

                    // Verify no signatures exist (transaction was not signed)
                    const signatures = transaction.getSignatures();
                    let totalSignatures = 0;
                    for (const [, nodeSignatures] of signatures) {
                        for (const [
                            ,
                            transactionSignatures,
                        ] of nodeSignatures) {
                            totalSignatures += transactionSignatures.size;
                        }
                    }
                    expect(totalSignatures).to.equal(0);
                });
            });
        });

        describe("With (client.setMaxNodesPerTransaction) set after transaction frozen, signed, serialised and deserialised", function () {
            it("should have correct counts for transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create transaction with explicit node IDs (NO maxNodes set initially)
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // Sign the transaction
                await transaction.sign(key);

                // Serialize and deserialize the transaction
                const transactionBytes = transaction.toBytes();
                const deserializedTransaction =
                    Transaction.fromBytes(transactionBytes);

                // Set maxNodesPerTransaction AFTER serialization/deserialization
                client.setMaxNodesPerTransaction(2);

                // Verify initial state before _beforeExecute - should have all original nodes
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(nodeAccountIds.length);
                expect(deserializedTransaction._transactionIds.length).to.equal(
                    1,
                ); // Single transaction ID for non-chunked
                expect(deserializedTransaction._transactions.length).to.equal(
                    nodeAccountIds.length,
                );

                // Call _beforeExecute
                await deserializedTransaction._beforeExecute(client);

                // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                const expectedNodeCount = 2; // client.setMaxNodesPerTransaction(2)
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    expectedNodeCount,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(expectedNodeCount);
                expect(deserializedTransaction._transactionIds.length).to.equal(
                    1,
                );
                expect(deserializedTransaction._transactions.length).to.equal(
                    0,
                ); // Still empty as no _buildAllTransactions called

                // Verify node IDs are correct and in the same order (first N nodes)
                for (let i = 0; i < expectedNodeCount; i++) {
                    expect(
                        deserializedTransaction._nodeAccountIds.list[
                            i
                        ].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify transaction ID is preserved
                expect(deserializedTransaction._transactionIds.list[0]).to.not
                    .be.null;
                expect(
                    deserializedTransaction._transactionIds.list[0].accountId.toString(),
                ).to.equal("0.0.2");

                // Verify signature is still valid after serialization/deserialization and trimming
                expect(key.publicKey.verifyTransaction(deserializedTransaction))
                    .to.be.true;
            });

            it("should have correct counts for chunked transactions, _signedTransactions, nodeIds and transactionIds when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create chunked transaction with large content (NO maxNodes set initially)
                const largeContent = new Uint8Array(8192).fill(65); // 8KB content to ensure chunking
                const transaction = new FileAppendTransaction()
                    .setFileId(new FileId(123))
                    .setContents(largeContent)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // Sign the transaction
                await transaction.sign(key);

                // Get expected chunk count
                const expectedChunkCount = transaction.getRequiredChunks();
                expect(expectedChunkCount).to.be.greaterThan(1); // Ensure it's actually chunked

                // Serialize and deserialize the transaction
                const transactionBytes = transaction.toBytes();
                const deserializedTransaction =
                    Transaction.fromBytes(transactionBytes);

                // Set maxNodesPerTransaction AFTER serialization/deserialization
                client.setMaxNodesPerTransaction(2);

                // Verify initial state before _beforeExecute - should have all original nodes
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(nodeAccountIds.length * expectedChunkCount);
                expect(deserializedTransaction._transactionIds.length).to.equal(
                    expectedChunkCount,
                );
                expect(deserializedTransaction._transactions.length).to.equal(
                    nodeAccountIds.length * expectedChunkCount,
                );
                // Call _beforeExecute
                await deserializedTransaction._beforeExecute(client);

                // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                const expectedNodeCount = 2; // client.setMaxNodesPerTransaction(2)
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    expectedNodeCount,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(expectedNodeCount * expectedChunkCount);
                expect(deserializedTransaction._transactionIds.length).to.equal(
                    expectedChunkCount,
                );
                expect(deserializedTransaction._transactions.length).to.equal(
                    0,
                ); // Still empty as no _buildAllTransactions called

                // Verify node IDs are correct and in the same order (first N nodes)
                for (let i = 0; i < expectedNodeCount; i++) {
                    expect(
                        deserializedTransaction._nodeAccountIds.list[
                            i
                        ].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify all transaction IDs are preserved
                for (let i = 0; i < expectedChunkCount; i++) {
                    expect(deserializedTransaction._transactionIds.list[i]).to
                        .not.be.null;
                    expect(
                        deserializedTransaction._transactionIds.list[
                            i
                        ].accountId.toString(),
                    ).to.equal("0.0.2");
                }

                // Verify signature is still valid after serialization/deserialization and trimming
                expect(key.publicKey.verifyTransaction(deserializedTransaction))
                    .to.be.true;
            });

            it("should not modify when setMaxNodesPerTransaction is explicitly set to 0", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create transaction with explicit node IDs (NO maxNodes set initially)
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // Sign the transaction
                await transaction.sign(key);

                // Serialize and deserialize the transaction
                const transactionBytes = transaction.toBytes();
                const deserializedTransaction =
                    Transaction.fromBytes(transactionBytes);

                // Set maxNodesPerTransaction to 0 AFTER serialization/deserialization (should disable limiting)
                client.setMaxNodesPerTransaction(0);

                // Verify initial state before _beforeExecute
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(nodeAccountIds.length);

                // Call _beforeExecute
                await deserializedTransaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged (0 disables limiting)
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(nodeAccountIds.length);

                // Verify all node IDs are preserved
                for (let i = 0; i < nodeAccountIds.length; i++) {
                    expect(
                        deserializedTransaction._nodeAccountIds.list[
                            i
                        ].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify signature is still valid after serialization/deserialization
                expect(key.publicKey.verifyTransaction(deserializedTransaction))
                    .to.be.true;
            });

            it("should not modify when setMaxNodesPerTransaction is greater than the number of nodeIds in the transaction", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create transaction with explicit node IDs (NO maxNodes set initially)
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // Sign the transaction
                await transaction.sign(key);

                // Serialize and deserialize the transaction
                const transactionBytes = transaction.toBytes();
                const deserializedTransaction =
                    Transaction.fromBytes(transactionBytes);

                // Set maxNodesPerTransaction greater than nodeAccountIds.length AFTER serialization/deserialization
                client.setMaxNodesPerTransaction(10); // Greater than 4 nodes

                // Verify initial state before _beforeExecute
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(nodeAccountIds.length);

                // Call _beforeExecute
                await deserializedTransaction._beforeExecute(client);

                // Verify state after _beforeExecute - should remain unchanged (limit > actual nodes)
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(nodeAccountIds.length);

                // Verify all node IDs are preserved
                for (let i = 0; i < nodeAccountIds.length; i++) {
                    expect(
                        deserializedTransaction._nodeAccountIds.list[
                            i
                        ].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify signature is still valid after serialization/deserialization
                expect(key.publicKey.verifyTransaction(deserializedTransaction))
                    .to.be.true;
            });

            it("should have correct counts for transactions without signatures when _beforeExecute is called", async function () {
                const key = PrivateKey.generateED25519();
                const nodeAccountIds = [
                    new AccountId(3),
                    new AccountId(4),
                    new AccountId(5),
                    new AccountId(6),
                ];

                // Create transaction with explicit node IDs (NO maxNodes set initially, NO signing)
                const transaction = new AccountCreateTransaction()
                    .setKey(key.publicKey)
                    .setNodeAccountIds(nodeAccountIds)
                    .setTransactionId(TransactionId.generate(new AccountId(2)))
                    .freeze();

                // DO NOT sign the transaction - test unsigned transaction behavior

                // Serialize and deserialize the transaction
                const transactionBytes = transaction.toBytes();
                const deserializedTransaction =
                    Transaction.fromBytes(transactionBytes);

                // Set maxNodesPerTransaction AFTER serialization/deserialization
                client.setMaxNodesPerTransaction(2);

                // Verify initial state before _beforeExecute - should have all original nodes
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    nodeAccountIds.length,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(nodeAccountIds.length);
                expect(deserializedTransaction._transactionIds.length).to.equal(
                    1,
                ); // Single transaction ID for non-chunked
                expect(deserializedTransaction._transactions.length).to.equal(
                    nodeAccountIds.length,
                );

                // Call _beforeExecute
                await deserializedTransaction._beforeExecute(client);

                // Verify state after _beforeExecute - should be trimmed to maxNodesPerTransaction
                const expectedNodeCount = 2; // client.setMaxNodesPerTransaction(2)
                expect(deserializedTransaction._nodeAccountIds.length).to.equal(
                    expectedNodeCount,
                );
                expect(
                    deserializedTransaction._signedTransactions.length,
                ).to.equal(expectedNodeCount);
                expect(deserializedTransaction._transactionIds.length).to.equal(
                    1,
                );
                expect(deserializedTransaction._transactions.length).to.equal(
                    0,
                ); // Still empty as no _buildAllTransactions called

                // Verify node IDs are correct and in the same order (first N nodes)
                for (let i = 0; i < expectedNodeCount; i++) {
                    expect(
                        deserializedTransaction._nodeAccountIds.list[
                            i
                        ].toString(),
                    ).to.equal(nodeAccountIds[i].toString());
                }

                // Verify transaction ID is preserved
                expect(deserializedTransaction._transactionIds.list[0]).to.not
                    .be.null;
                expect(
                    deserializedTransaction._transactionIds.list[0].accountId.toString(),
                ).to.equal("0.0.2");

                // Verify no signatures exist (transaction was not signed)
                const signatures = deserializedTransaction.getSignatures();
                let totalSignatures = 0;
                for (const [, nodeSignatures] of signatures) {
                    for (const [, transactionSignatures] of nodeSignatures) {
                        totalSignatures += transactionSignatures.size;
                    }
                }
                expect(totalSignatures).to.equal(0);
            });
        });
    });
});
