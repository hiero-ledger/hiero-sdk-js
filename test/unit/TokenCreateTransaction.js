import {
    Client,
    PrivateKey,
    Hbar,
    TokenCreateTransaction,
    TransactionId,
    AccountId,
    Timestamp,
    TokenType,
    TokenSupplyType,
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
    TokenId,
    Transaction,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";
import * as HieroProto from "@hiero-ledger/proto";
import { DEFAULT_AUTO_RENEW_PERIOD } from "../../src/transaction/Transaction.js";

describe("TokenCreateTransaction", function () {
    it("encodes to correct protobuf", function () {
        const key1 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204205fc37fbd55631722b7ab5ec8e31696f6d3f818a15c5258a1529de7d4a1def6e2",
        );
        const key2 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420b5e15b70109fe6e11d1d6d06b20d27b494aa05a28a8bc84c627d9be66e179391",
        );
        const key3 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204202b5dc9915d5b6829592f4562a3d099e7b1bdd48da347e351da8d31cd41653016",
        );
        const key4 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204205a8571fe4badbc6bd76f03170f5ec4bdc69f2edb93f133477d0ef8f9e17a0f3a",
        );
        const key5 = PrivateKey.fromStringDer(
            "302e020100300506032b65700422042081c36f46db2bc4e7d993a23718a158c9fffa96719d7e72b3823d8bc9b973d596",
        );
        const key6 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420ff498f69b92ea43a0a8fd6e4a7036e5f8b5f23e527b0443bc309cc4ff5b75303",
        );
        const key7 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420542b4d4a318a1ae5f91071f34c8d900b1150e83d15fe71d22b8581e1203f99ad",
        );
        const key8 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204205447805ce906170817e2bd4e26f4ea1fd5bbc38a2532c7f66b7d7a24f60ee9d5",
        );
        const metadata = new Uint8Array([1, 2, 3, 4, 5]);
        const autoRenewAccountId = new AccountId(10);
        const treasuryAccountId = new AccountId(11);

        const expirationTime = new Timestamp(
            Math.floor(
                Date.now() / 1000 + DEFAULT_AUTO_RENEW_PERIOD.toNumber(),
            ),
            0,
        );

        const transaction = new TokenCreateTransaction()
            .setMaxTransactionFee(new Hbar(30))
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(1),
                    new Timestamp(2, 3),
                ),
            )
            .setTokenName("name")
            .setTokenSymbol("symbol")
            .setTokenMemo("memo")
            .setDecimals(7)
            .setTreasuryAccountId(treasuryAccountId)
            .setAutoRenewAccountId(autoRenewAccountId)
            .setExpirationTime(expirationTime)
            .setAdminKey(key1)
            .setKycKey(key2)
            .setFreezeKey(key3)
            .setPauseKey(key4)
            .setWipeKey(key5)
            .setSupplyKey(key6)
            .setFeeScheduleKey(key7)
            .setMetadata(metadata)
            .setMetadataKey(key8)
            .setNodeAccountIds([new AccountId(4)])
            .setTransactionMemo("random memo")
            .freeze();

        const protobuf = transaction._makeTransactionBody();

        expect(protobuf).to.deep.include({
            tokenCreation: {
                name: "name",
                symbol: "symbol",
                memo: "memo",
                supplyType: null,
                tokenType: null,
                maxSupply: null,
                initialSupply: null,
                freezeDefault: null,
                customFees: [],
                decimals: 7,
                autoRenewAccount: autoRenewAccountId._toProtobuf(),
                autoRenewPeriod: null,
                expiry: expirationTime._toProtobuf(),
                treasury: treasuryAccountId._toProtobuf(),
                adminKey: {
                    ed25519: key1.publicKey.toBytesRaw(),
                },
                kycKey: {
                    ed25519: key2.publicKey.toBytesRaw(),
                },
                freezeKey: {
                    ed25519: key3.publicKey.toBytesRaw(),
                },
                pauseKey: {
                    ed25519: key4.publicKey.toBytesRaw(),
                },
                wipeKey: {
                    ed25519: key5.publicKey.toBytesRaw(),
                },
                supplyKey: {
                    ed25519: key6.publicKey.toBytesRaw(),
                },
                feeScheduleKey: {
                    ed25519: key7.publicKey.toBytesRaw(),
                },
                metadata: metadata,
                metadataKey: {
                    ed25519: key8.publicKey.toBytesRaw(),
                },
            },
            transactionFee: new Hbar(30).toTinybars(),
            memo: "random memo",
            transactionID: {
                accountID: {
                    accountNum: Long.fromNumber(1),
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    alias: null,
                },
                transactionValidStart: {
                    seconds: Long.fromNumber(2),
                    nanos: 3,
                },
                scheduled: false,
                nonce: null,
            },
            nodeAccountID: null,
            transactionValidDuration: {
                seconds: Long.fromNumber(120),
            },
        });
    });

    it("can be decoded from protobuf", function () {
        const key1 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204205fc37fbd55631722b7ab5ec8e31696f6d3f818a15c5258a1529de7d4a1def6e2",
        );
        const key2 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420b5e15b70109fe6e11d1d6d06b20d27b494aa05a28a8bc84c627d9be66e179391",
        );
        const key3 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204202b5dc9915d5b6829592f4562a3d099e7b1bdd48da347e351da8d31cd41653016",
        );
        const key4 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204205a8571fe4badbc6bd76f03170f5ec4bdc69f2edb93f133477d0ef8f9e17a0f3a",
        );
        const key5 = PrivateKey.fromStringDer(
            "302e020100300506032b65700422042081c36f46db2bc4e7d993a23718a158c9fffa96719d7e72b3823d8bc9b973d596",
        );
        const key6 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420ff498f69b92ea43a0a8fd6e4a7036e5f8b5f23e527b0443bc309cc4ff5b75303",
        );
        const key7 = PrivateKey.fromStringDer(
            "302e020100300506032b657004220420542b4d4a318a1ae5f91071f34c8d900b1150e83d15fe71d22b8581e1203f99ad",
        );
        const key8 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204205447805ce906170817e2bd4e26f4ea1fd5bbc38a2532c7f66b7d7a24f60ee9d5",
        );
        const metadata = new Uint8Array([1, 2, 3, 4, 5]);
        const autoRenewAccountId = new AccountId(10);
        const treasuryAccountId = new AccountId(11);

        const expirationTime = new Timestamp(
            Math.floor(
                Date.now() / 1000 + DEFAULT_AUTO_RENEW_PERIOD.toNumber(),
            ),
            0,
        );

        const original = new TokenCreateTransaction()
            .setMaxTransactionFee(new Hbar(30))
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(1),
                    new Timestamp(2, 3),
                ),
            )
            .setTokenName("name")
            .setTokenSymbol("symbol")
            .setTokenMemo("memo")
            .setDecimals(7)
            .setTreasuryAccountId(treasuryAccountId)
            .setAutoRenewAccountId(autoRenewAccountId)
            .setExpirationTime(expirationTime)
            .setAdminKey(key1)
            .setKycKey(key2)
            .setFreezeKey(key3)
            .setPauseKey(key4)
            .setWipeKey(key5)
            .setSupplyKey(key6)
            .setFeeScheduleKey(key7)
            .setMetadata(metadata)
            .setMetadataKey(key8)
            .setNodeAccountIds([new AccountId(4)])
            .setTransactionMemo("random memo")
            .freeze();

        const transactions = [original._makeTransactionBody()];
        const protobufBody = transactions[0];
        const signedTransactions = [];
        const transactionIds = [original.transactionId];
        const nodeIds = [new AccountId(4)];
        const bodies = [protobufBody];

        const reconstructed = TokenCreateTransaction._fromProtobuf(
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );

        expect(reconstructed.tokenName).to.equal("name");
        expect(reconstructed.tokenSymbol).to.equal("symbol");
        expect(reconstructed.tokenMemo).to.equal("memo");
        expect(reconstructed.decimals?.toNumber()).to.equal(7);
        expect(reconstructed.treasuryAccountId?.toString()).to.equal("0.0.11");
        expect(reconstructed.autoRenewAccountId?.toString()).to.equal("0.0.10");
        expect(reconstructed.expirationTime?.seconds.toString()).to.equal(
            expirationTime.seconds.toString(),
        );
        expect(reconstructed.adminKey?.toString()).to.equal(
            key1.publicKey.toString(),
        );
        expect(reconstructed.kycKey?.toString()).to.equal(
            key2.publicKey.toString(),
        );
        expect(reconstructed.freezeKey?.toString()).to.equal(
            key3.publicKey.toString(),
        );
        expect(reconstructed.pauseKey?.toString()).to.equal(
            key4.publicKey.toString(),
        );
        expect(reconstructed.wipeKey?.toString()).to.equal(
            key5.publicKey.toString(),
        );
        expect(reconstructed.supplyKey?.toString()).to.equal(
            key6.publicKey.toString(),
        );
        expect(reconstructed.feeScheduleKey?.toString()).to.equal(
            key7.publicKey.toString(),
        );
        expect(reconstructed.metadataKey?.toString()).to.equal(
            key8.publicKey.toString(),
        );
        expect(reconstructed.metadata).to.deep.equal(metadata);
    });

    it("can be decoded from protobuf with custom fees and additional properties", function () {
        const key1 = PrivateKey.fromStringDer(
            "302e020100300506032b6570042204205fc37fbd55631722b7ab5ec8e31696f6d3f818a15c5258a1529de7d4a1def6e2",
        );
        const customFees = [
            // We'll use a mock object for the custom fees since we're only testing serialization/deserialization
            {
                _toProtobuf: () => ({
                    fixedFee: {
                        amount: Long.fromNumber(10),
                        denominatingTokenId: { tokenNum: Long.fromNumber(123) },
                    },
                }),
            },
        ];
        const metadata = new Uint8Array([1, 2, 3, 4, 5]);
        const treasuryAccountId = new AccountId(11);
        const initialSupply = Long.fromNumber(1000);
        const maxSupply = Long.fromNumber(10000);
        const freezeDefault = true;

        const original = new TokenCreateTransaction()
            .setTokenName("name")
            .setTokenSymbol("symbol")
            .setDecimals(7)
            .setInitialSupply(initialSupply)
            .setMaxSupply(maxSupply)
            .setTreasuryAccountId(treasuryAccountId)
            .setAdminKey(key1)
            .setFreezeDefault(freezeDefault)
            .setCustomFees(customFees)
            .setMetadata(metadata)
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyType(TokenSupplyType.Finite)
            .setNodeAccountIds([new AccountId(4)])
            .setTransactionId(TransactionId.generate(new AccountId(1)))
            .freeze();

        const transactions = [original._makeTransactionBody()];
        const protobufBody = transactions[0];
        const signedTransactions = [];
        const transactionIds = [original.transactionId];
        const nodeIds = [new AccountId(4)];
        const bodies = [protobufBody];

        const reconstructed = TokenCreateTransaction._fromProtobuf(
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );

        expect(reconstructed.tokenName).to.equal("name");
        expect(reconstructed.tokenSymbol).to.equal("symbol");
        expect(reconstructed.decimals?.toNumber()).to.equal(7);
        expect(reconstructed.initialSupply?.toNumber()).to.equal(1000);
        expect(reconstructed.maxSupply?.toNumber()).to.equal(10000);
        expect(reconstructed.treasuryAccountId?.toString()).to.equal("0.0.11");
        expect(reconstructed.adminKey?.toString()).to.equal(
            key1.publicKey.toString(),
        );
        expect(reconstructed.freezeDefault).to.equal(true);
        expect(reconstructed.metadata).to.deep.equal(metadata);
        expect(reconstructed.tokenType?.toString()).to.equal(
            TokenType.NonFungibleUnique.toString(),
        );
        expect(reconstructed.supplyType?.toString()).to.equal(
            TokenSupplyType.Finite.toString(),
        );
        expect(reconstructed.customFees.length).to.be.greaterThan(0);
    });

    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );
        const keys = Array.from(
            { length: 8 },
            () => PrivateKey.generateED25519().publicKey,
        );
        const [
            adminKey,
            kycKey,
            freezeKey,
            pauseKey,
            wipeKey,
            supplyKey,
            feeScheduleKey,
            metadataKey,
        ] = keys;
        const expirationTime = new Timestamp(1700000000, 0);
        const metadata = Uint8Array.of(1, 2, 3);
        const collector = AccountId.fromString("0.0.5007");
        const customFees = [
            new CustomFixedFee()
                .setAmount(10)
                .setDenominatingTokenId(TokenId.fromString("0.0.5008"))
                .setFeeCollectorAccountId(collector),
            new CustomFractionalFee()
                .setNumerator(1)
                .setDenominator(20)
                .setMin(1)
                .setMax(100)
                .setFeeCollectorAccountId(collector),
            new CustomRoyaltyFee()
                .setNumerator(1)
                .setDenominator(10)
                .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)))
                .setFeeCollectorAccountId(collector)
                .setAllCollectorsAreExempt(true),
        ];
        /** @param {import("../../src/token/CustomFee.js").default} fee */
        const encodeFee = (fee) =>
            HieroProto.proto.CustomFee.encode(fee._toProtobuf()).finish();

        // setExpirationTime() clears the auto renew period, so it goes first.
        const tx = new TokenCreateTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTokenName("name")
            .setTokenSymbol("symbol")
            .setDecimals(7)
            .setInitialSupply(1000)
            .setTreasuryAccountId(AccountId.fromString("0.0.5005"))
            .setAdminKey(adminKey)
            .setKycKey(kycKey)
            .setFreezeKey(freezeKey)
            .setPauseKey(pauseKey)
            .setWipeKey(wipeKey)
            .setSupplyKey(supplyKey)
            .setFeeScheduleKey(feeScheduleKey)
            .setMetadataKey(metadataKey)
            .setFreezeDefault(true)
            .setExpirationTime(expirationTime)
            .setAutoRenewAccountId(AccountId.fromString("0.0.5006"))
            .setAutoRenewPeriod(8000000)
            .setTokenMemo("memo")
            .setCustomFees(customFees)
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(10000)
            .setMetadata(metadata)
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TokenCreateTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.tokenName).to.equal("name");
        expect(tx2.tokenSymbol).to.equal("symbol");
        expect(tx2.decimals.toString()).to.equal("7");
        expect(tx2.initialSupply.toString()).to.equal("1000");
        expect(tx2.treasuryAccountId.toString()).to.equal("0.0.5005");
        expect(tx2.adminKey.toString()).to.equal(adminKey.toString());
        expect(tx2.kycKey.toString()).to.equal(kycKey.toString());
        expect(tx2.freezeKey.toString()).to.equal(freezeKey.toString());
        expect(tx2.pauseKey.toString()).to.equal(pauseKey.toString());
        expect(tx2.wipeKey.toString()).to.equal(wipeKey.toString());
        expect(tx2.supplyKey.toString()).to.equal(supplyKey.toString());
        expect(tx2.feeScheduleKey.toString()).to.equal(
            feeScheduleKey.toString(),
        );
        expect(tx2.metadataKey.toString()).to.equal(metadataKey.toString());
        expect(tx2.freezeDefault).to.equal(true);
        expect(tx2.expirationTime.toString()).to.equal(
            expirationTime.toString(),
        );
        expect(tx2.autoRenewAccountId.toString()).to.equal("0.0.5006");
        expect(tx2.autoRenewPeriod.seconds.toString()).to.equal("8000000");
        expect(tx2.tokenMemo).to.equal("memo");
        expect(tx2.customFees.map(encodeFee)).to.deep.equal(
            customFees.map(encodeFee),
        );
        expect(tx2.tokenType).to.equal(TokenType.NonFungibleUnique);
        expect(tx2.supplyType).to.equal(TokenSupplyType.Finite);
        expect(tx2.maxSupply.toString()).to.equal("10000");
        expect(tx2.metadata).to.deep.equal(metadata);
    });

    describe("_validateChecksums", function () {
        let mainnet, testnet;

        beforeEach(function () {
            mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
            testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
        });

        afterEach(function () {
            mainnet.close();
            testnet.close();
        });

        it("should check the treasury account checksum", function () {
            const treasury = new AccountId(0, 0, 123);
            treasury._checksum = "vfmkw";

            const tx = new TokenCreateTransaction().setTreasuryAccountId(
                treasury,
            );

            expect(() => tx._validateChecksums(mainnet)).to.not.throw();
            expect(() => tx._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should check the auto renew account checksum", function () {
            const autoRenew = new AccountId(0, 0, 123);
            autoRenew._checksum = "vfmkw";

            const tx = new TokenCreateTransaction().setAutoRenewAccountId(
                autoRenew,
            );

            expect(() => tx._validateChecksums(mainnet)).to.not.throw();
            expect(() => tx._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip unset fields", function () {
            expect(() =>
                new TokenCreateTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.createToken() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    createToken: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenCreateTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const tx = new TokenCreateTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(tx._getLogId()).to.equal(
                `TokenCreateTransaction:${validStart.toString()}`,
            );
        });
    });
});
