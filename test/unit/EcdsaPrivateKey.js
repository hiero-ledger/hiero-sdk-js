import { Mnemonic, PrivateKey } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
import * as bip32 from "../../packages/cryptography/src/primitive/bip32.js";

const RAW_KEY =
    "8776c6b831a1b61ac10dac0304a2843de4716f54b1919bb91a2685d0fe3f3048";
const DER_PRIVATE_KEY =
    "3030020100300706052b8104000a04220420e06ecd79f00124bfc030b0321006683a6a579be7602f2eb52ca73e2901880682";
const DER_PRIVATE_KEY_BYTES = new Uint8Array([
    48, 48, 2, 1, 0, 48, 7, 6, 5, 43, 129, 4, 0, 10, 4, 34, 4, 32, 224, 110,
    205, 121, 240, 1, 36, 191, 192, 48, 176, 50, 16, 6, 104, 58, 106, 87, 155,
    231, 96, 47, 46, 181, 44, 167, 62, 41, 1, 136, 6, 130,
]);
const DER_PUBLIC_KEY =
    "302d300706052b8104000a032200033697a2b3f9f0b9f4831b39986f7f3885636a3e8622a0bc3814a4a56f7ecdc4f1";
const STRESS_TEST_ITERATION_COUNT = 100;

describe("EcdsaPrivateKey", function () {
    it("generate should return object", function () {
        PrivateKey.generateECDSA();
    });

    it("generateAsync should return object", async function () {
        await PrivateKey.generateECDSAAsync();
    });

    it("fromStringRaw and fromStringDer work", function () {
        PrivateKey.fromStringDer(
            hex.encode(PrivateKey.fromStringECDSA(RAW_KEY).toBytesDer()),
        );
    });

    it("should return a public key from a der private key", function () {
        const publicKey =
            PrivateKey.fromStringDer(DER_PRIVATE_KEY).publicKey.toStringDer();
        expect(publicKey).to.be.equal(DER_PUBLIC_KEY);
    });

    it("should return a public key from a raw private key", function () {
        expect(
            PrivateKey.fromStringECDSA(RAW_KEY).publicKey.toStringRaw(),
        ).to.be.equal(
            "02703a9370b0443be6ae7c507b0aec81a55e94e4a863b9655360bd65358caa6588",
        );
    });

    it("SLIP10 test vector 1", async function () {
        // generate master PrivateKey with 'fromSeedECDSAsecp256k1()' and child key derivation
        // and test them against the provided constants which are always the source of truth
        // source - https://github.com/satoshilabs/slips/blob/master/slip-0010.md#test-vector-1-for-secp256k1

        const CHAIN_CODE1 =
            "873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508";
        const PRIVATE_KEY1 =
            "e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35";
        const PUBLIC_KEY1 =
            "0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2";

        const CHAIN_CODE2 =
            "47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141";
        const PRIVATE_KEY2 =
            "edb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea";
        const PUBLIC_KEY2 =
            "035a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc56";

        const CHAIN_CODE3 =
            "2a7857631386ba23dacac34180dd1983734e444fdbf774041578e9b6adb37c19";
        const PRIVATE_KEY3 =
            "3c6cb8d0f6a264c91ea8b5030fadaa8e538b020f0a387421a12de9319dc93368";
        const PUBLIC_KEY3 =
            "03501e454bf00751f24b1b489aa925215d66af2234e3891c3b21a52bedb3cd711c";

        const CHAIN_CODE4 =
            "04466b9cc8e161e966409ca52986c584f07e9dc81f735db683c3ff6ec7b1503f";
        const PRIVATE_KEY4 =
            "cbce0d719ecf7431d88e6a89fa1483e02e35092af60c042b1df2ff59fa424dca";
        const PUBLIC_KEY4 =
            "0357bfe1e341d01c69fe5654309956cbea516822fba8a601743a012a7896ee8dc2";

        const CHAIN_CODE5 =
            "cfb71883f01676f587d023cc53a35bc7f88f724b1f8c2892ac1275ac822a3edd";
        const PRIVATE_KEY5 =
            "0f479245fb19a38a1954c5c7c0ebab2f9bdfd96a17563ef28a6a4b1a2a764ef4";
        const PUBLIC_KEY5 =
            "02e8445082a72f29b75ca48748a914df60622a609cacfce8ed0e35804560741d29";

        const CHAIN_CODE6 =
            "c783e67b921d2beb8f6b389cc646d7263b4145701dadd2161548a8b078e65e9e";
        const PRIVATE_KEY6 =
            "471b76e389e528d6de6d816857e012c5455051cad6660850e58372a6c3e6e7c8";
        const PUBLIC_KEY6 =
            "022a471424da5e657499d1ff51cb43c47481a03b1e77f951fe64cec9f5a48f7011";

        const seed = hex.decode("000102030405060708090a0b0c0d0e0f");

        // Chain m
        const key1 = await PrivateKey.fromSeedECDSAsecp256k1(seed);
        expect(hex.encode(key1.chainCode)).to.be.equal(CHAIN_CODE1);
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(PUBLIC_KEY1).to.contain(key1.publicKey.toStringRaw());

        // Chain m/0'
        const key2 = await key1.derive(bip32.toHardenedIndex(0));
        expect(hex.encode(key2.chainCode)).to.be.equal(CHAIN_CODE2);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(PUBLIC_KEY2).to.contain(key2.publicKey.toStringRaw());

        // Chain m/0'/1
        const key3 = await key2.derive(1);
        expect(hex.encode(key3.chainCode)).to.be.equal(CHAIN_CODE3);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(PUBLIC_KEY3).to.contain(key3.publicKey.toStringRaw());

        // Chain m/0'/1/2'
        const key4 = await key3.derive(bip32.toHardenedIndex(2));
        expect(hex.encode(key4.chainCode)).to.be.equal(CHAIN_CODE4);
        expect(key4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(PUBLIC_KEY4).to.contain(key4.publicKey.toStringRaw());

        // Chain m/0'/1/2'/2
        const key5 = await key4.derive(2);
        expect(hex.encode(key5.chainCode)).to.be.equal(CHAIN_CODE5);
        expect(key5.toStringRaw()).to.be.equal(PRIVATE_KEY5);
        expect(PUBLIC_KEY5).to.contain(key5.publicKey.toStringRaw());

        // Chain m/0'/1/2'/2/1000000000
        const key6 = await key5.derive(1000000000);
        expect(hex.encode(key6.chainCode)).to.be.equal(CHAIN_CODE6);
        expect(key6.toStringRaw()).to.be.equal(PRIVATE_KEY6);
        expect(PUBLIC_KEY6).to.contain(key6.publicKey.toStringRaw());
    });

    it("SLIP10 test vector 2", async function () {
        // generate master PrivateKey with 'fromSeedECDSAsecp256k1()' and child key derivation
        // and test them against the provided constants which are always the source of truth
        // source - https://github.com/satoshilabs/slips/blob/master/slip-0010.md#test-vector-2-for-secp256k1

        const CHAIN_CODE1 =
            "60499f801b896d83179a4374aeb7822aaeaceaa0db1f85ee3e904c4defbd9689";
        const PRIVATE_KEY1 =
            "4b03d6fc340455b363f51020ad3ecca4f0850280cf436c70c727923f6db46c3e";
        const PUBLIC_KEY1 =
            "03cbcaa9c98c877a26977d00825c956a238e8dddfbd322cce4f74b0b5bd6ace4a7";

        const CHAIN_CODE2 =
            "f0909affaa7ee7abe5dd4e100598d4dc53cd709d5a5c2cac40e7412f232f7c9c";
        const PRIVATE_KEY2 =
            "abe74a98f6c7eabee0428f53798f0ab8aa1bd37873999041703c742f15ac7e1e";
        const PUBLIC_KEY2 =
            "02fc9e5af0ac8d9b3cecfe2a888e2117ba3d089d8585886c9c826b6b22a98d12ea";

        const CHAIN_CODE3 =
            "be17a268474a6bb9c61e1d720cf6215e2a88c5406c4aee7b38547f585c9a37d9";
        const PRIVATE_KEY3 =
            "877c779ad9687164e9c2f4f0f4ff0340814392330693ce95a58fe18fd52e6e93";
        const PUBLIC_KEY3 =
            "03c01e7425647bdefa82b12d9bad5e3e6865bee0502694b94ca58b666abc0a5c3b";

        const CHAIN_CODE4 =
            "f366f48f1ea9f2d1d3fe958c95ca84ea18e4c4ddb9366c336c927eb246fb38cb";
        const PRIVATE_KEY4 =
            "704addf544a06e5ee4bea37098463c23613da32020d604506da8c0518e1da4b7";
        const PUBLIC_KEY4 =
            "03a7d1d856deb74c508e05031f9895dab54626251b3806e16b4bd12e781a7df5b9";

        const CHAIN_CODE5 =
            "637807030d55d01f9a0cb3a7839515d796bd07706386a6eddf06cc29a65a0e29";
        const PRIVATE_KEY5 =
            "f1c7c871a54a804afe328b4c83a1c33b8e5ff48f5087273f04efa83b247d6a2d";
        const PUBLIC_KEY5 =
            "02d2b36900396c9282fa14628566582f206a5dd0bcc8d5e892611806cafb0301f0";

        const CHAIN_CODE6 =
            "9452b549be8cea3ecb7a84bec10dcfd94afe4d129ebfd3b3cb58eedf394ed271";
        const PRIVATE_KEY6 =
            "bb7d39bdb83ecf58f2fd82b6d918341cbef428661ef01ab97c28a4842125ac23";
        const PUBLIC_KEY6 =
            "024d902e1a2fc7a8755ab5b694c575fce742c48d9ff192e63df5193e4c7afe1f9c";

        const seed = hex.decode(
            "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542",
        );

        // Chain m
        const key1 = await PrivateKey.fromSeedECDSAsecp256k1(seed);
        expect(hex.encode(key1.chainCode)).to.be.equal(CHAIN_CODE1);
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(PUBLIC_KEY1).to.contain(key1.publicKey.toStringRaw());

        // Chain m/0
        const key2 = await key1.derive(0);
        expect(hex.encode(key2.chainCode)).to.be.equal(CHAIN_CODE2);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(PUBLIC_KEY2).to.contain(key2.publicKey.toStringRaw());

        // Chain m/0/2147483647'
        const key3 = await key2.derive(bip32.toHardenedIndex(2147483647));
        expect(hex.encode(key3.chainCode)).to.be.equal(CHAIN_CODE3);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(PUBLIC_KEY3).to.contain(key3.publicKey.toStringRaw());

        // Chain m/0/2147483647'/1
        const key4 = await key3.derive(1);
        expect(hex.encode(key4.chainCode)).to.be.equal(CHAIN_CODE4);
        expect(key4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(PUBLIC_KEY4).to.contain(key4.publicKey.toStringRaw());

        // Chain m/0/2147483647'/1/2147483646'
        const key5 = await key4.derive(bip32.toHardenedIndex(2147483646));
        expect(hex.encode(key5.chainCode)).to.be.equal(CHAIN_CODE5);
        expect(key5.toStringRaw()).to.be.equal(PRIVATE_KEY5);
        expect(PUBLIC_KEY5).to.contain(key5.publicKey.toStringRaw());

        // Chain m/0/2147483647'/1/2147483646'/2
        const key6 = await key5.derive(2);
        expect(hex.encode(key6.chainCode)).to.be.equal(CHAIN_CODE6);
        expect(key6.toStringRaw()).to.be.equal(PRIVATE_KEY6);
        expect(PUBLIC_KEY6).to.contain(key6.publicKey.toStringRaw());
    });

    it("PEM import test vectors", async function () {
        const TEST_VECTOR_PEM_PASSPHRASE = "asdasd123";

        // https://github.com/hashgraph/hedera-sdk-reference/issues/93#issue-1665972122
        const PRIVATE_KEY_PEM1 =
            "-----BEGIN EC PRIVATE KEY-----\n" +
            "MHQCAQEEIG8I+jKi+iGVa7ttbfnlnML5AdvPugbgBWnseYjrle6qoAcGBSuBBAAK\n" +
            "oUQDQgAEqf5BmMeBzkU1Ra9UAbZJo3tytVOlb7erTc36LRLP20mOLU7+mFY+3Cfe\n" +
            "fAZgBtPXRAmDtRvYGODswAalW85GKA==\n" +
            "-----END EC PRIVATE KEY-----";
        const PRIVATE_KEY1 =
            "6f08fa32a2fa21956bbb6d6df9e59cc2f901dbcfba06e00569ec7988eb95eeaa";
        const PUBLIC_KEY1 =
            "02a9fe4198c781ce453545af5401b649a37b72b553a56fb7ab4dcdfa2d12cfdb49";

        const PRIVATE_KEY_PEM2 =
            "-----BEGIN EC PRIVATE KEY-----\n" +
            "MFQCAQEEIOHyhclwHbha3f281Kvd884rhBzltxGJxCZyaQCagH9joAcGBSuBBAAK\n" +
            "oSQDIgACREr6gFZa4K7hBP+bA25VdgQ+0ABFgM+g5RYw/W6T1Og=\n" +
            "-----END EC PRIVATE KEY-----";
        const PRIVATE_KEY2 =
            "e1f285c9701db85addfdbcd4abddf3ce2b841ce5b71189c4267269009a807f63";
        const PUBLIC_KEY2 =
            "02444afa80565ae0aee104ff9b036e5576043ed0004580cfa0e51630fd6e93d4e8";

        const PRIVATE_KEY_PEM3 =
            "-----BEGIN EC PRIVATE KEY-----\n" +
            "Proc-Type: 4,ENCRYPTED\n" +
            "DEK-Info: AES-128-CBC,0046A9EED8D16F0CAA66A197CE8BE8BD\n" +
            "\n" +
            "9VU9gReUmrn4XywjMx0F0A3oGzpHIksEXma72TCSdcxI7zHy0mtzuGq4Wd25O38s\n" +
            "H9c6kvhTPS1N/c6iNhx154B0HUoND8jvAvfxbGR/R87vpZJsOoKCmRxGqrxG8HER\n" +
            "FIHQ1jy16DrAbU95kDyLsiF1dy2vUY/HoqFZwxl/IVc=\n" +
            "-----END EC PRIVATE KEY-----";
        const PRIVATE_KEY3 =
            "cf49eb5206c1b0468854d6ea7b370590619625514f71ff93608a18465e4012ad";
        const PUBLIC_KEY3 =
            "025f0d14a7562d6319e5b8f91620d2ce9ad13d9abf21cfe9bd0a092c0f35bf1701";

        const PRIVATE_KEY_PEM4 =
            "-----BEGIN EC PRIVATE KEY-----\n" +
            "Proc-Type: 4,ENCRYPTED\n" +
            "DEK-Info: AES-128-CBC,4A9B3B987EC2EFFA405818327D14FFF7\n" +
            "\n" +
            "Wh756RkK5fn1Ke2denR1OYfqE9Kr4BXhgrEMTU/6o0SNhMULUhWGHrCWvmNeEQwp\n" +
            "ZVZYUxgYoTlJBeREzKAZithcvxIcTbQfLABo1NZbjA6YKqAqlGpM6owwL/f9e2ST\n" +
            "-----END EC PRIVATE KEY-----";
        const PRIVATE_KEY4 =
            "c0d3e16ba5a1abbeac4cd327a3c3c1cc10438431d0bac019054e573e67768bb5";
        const PUBLIC_KEY4 =
            "02065f736378134c53c7a2ee46f199fb93b9b32337be4e95660677046476995544";

        const ecdsaPrivateKey1 = await PrivateKey.fromPem(PRIVATE_KEY_PEM1);
        expect(ecdsaPrivateKey1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(ecdsaPrivateKey1.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY1,
        );

        const ecdsaPrivateKey2 = await PrivateKey.fromPem(PRIVATE_KEY_PEM2);
        expect(ecdsaPrivateKey2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(ecdsaPrivateKey2.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY2,
        );

        const ecdsaPrivateKey3 = await PrivateKey.fromPem(
            PRIVATE_KEY_PEM3,
            TEST_VECTOR_PEM_PASSPHRASE,
        );
        expect(ecdsaPrivateKey3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(ecdsaPrivateKey3.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY3,
        );

        const ecdsaPrivateKey4 = await PrivateKey.fromPem(
            PRIVATE_KEY_PEM4,
            TEST_VECTOR_PEM_PASSPHRASE,
        );
        expect(ecdsaPrivateKey4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(ecdsaPrivateKey4.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY4,
        );
    });

    it("DER import test vectors", async function () {
        // https://github.com/hashgraph/hedera-sdk-reference/issues/93#issue-1665972122
        const PRIVATE_KEY_DER1 =
            "3030020100300706052b8104000a042204208c2cdc9575fe67493443967d74958fd7808a3787fd3337e99cfeebbc7566b586";
        const PRIVATE_KEY1 =
            "8c2cdc9575fe67493443967d74958fd7808a3787fd3337e99cfeebbc7566b586";
        const PUBLIC_KEY1 =
            "028173079d2e996ef6b2d064fc82d5fc7094367211e28422bec50a2f75c365f5fd";

        const PRIVATE_KEY_DER2 =
            "30540201010420ac318ea8ff8d991ab2f16172b4738e74dc35a56681199cfb1c0cb2e7cb560ffda00706052b8104000aa124032200036843f5cb338bbb4cdb21b0da4ea739d910951d6e8a5f703d313efe31afe788f4";
        const PRIVATE_KEY2 =
            "ac318ea8ff8d991ab2f16172b4738e74dc35a56681199cfb1c0cb2e7cb560ffd";
        const PUBLIC_KEY2 =
            "036843f5cb338bbb4cdb21b0da4ea739d910951d6e8a5f703d313efe31afe788f4";

        const PRIVATE_KEY_DER3 =
            "307402010104208927647ad12b29646a1d051da8453462937bb2c813c6815cac6c0b720526ffc6a00706052b8104000aa14403420004aaac1c3ac1bea0245b8e00ce1e2018f9eab61b6331fbef7266f2287750a6597795f855ddcad2377e22259d1fcb4e0f1d35e8f2056300c15070bcbfce3759cc9d";
        const PRIVATE_KEY3 =
            "8927647ad12b29646a1d051da8453462937bb2c813c6815cac6c0b720526ffc6";
        const PUBLIC_KEY3 =
            "03aaac1c3ac1bea0245b8e00ce1e2018f9eab61b6331fbef7266f2287750a65977";

        const PRIVATE_KEY_DER4 =
            "302e0201010420a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fea00706052b8104000a";
        const PRIVATE_KEY4 =
            "a6170a6aa6389a5bd3a3a8f9375f57bd91aa7f7d8b8b46ce0b702e000a21a5fe";
        const PUBLIC_KEY4 =
            "03b69a75a5ddb1c0747e995d47555019e5d8a28003ab5202bd92f534361fb4ec8a";

        const ecdsaPrivateKey1 = PrivateKey.fromStringDer(PRIVATE_KEY_DER1);
        expect(ecdsaPrivateKey1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(ecdsaPrivateKey1.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY1,
        );

        const ecdsaPrivateKey2 = PrivateKey.fromStringDer(PRIVATE_KEY_DER2);
        expect(ecdsaPrivateKey2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(ecdsaPrivateKey2.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY2,
        );

        const ecdsaPrivateKey3 = PrivateKey.fromStringDer(PRIVATE_KEY_DER3);
        expect(ecdsaPrivateKey3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(ecdsaPrivateKey3.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY3,
        );

        const ecdsaPrivateKey4 = PrivateKey.fromStringDer(PRIVATE_KEY_DER4);
        expect(ecdsaPrivateKey4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(ecdsaPrivateKey4.publicKey.toStringRaw()).to.be.equal(
            PUBLIC_KEY4,
        );
    });

    it("should return private key from bytes", async function () {
        const privateKeyFromBytes = PrivateKey.fromBytesECDSA(
            DER_PRIVATE_KEY_BYTES,
        );
        const publicKeyDer = privateKeyFromBytes.toStringDer();
        expect(publicKeyDer).to.be.equal(DER_PRIVATE_KEY);
    });

    it("should return a constructed aliasKey accountId", async function () {
        const privateKey = PrivateKey.generateECDSA();
        const publicKey = privateKey.publicKey;

        const aliasAccountId = publicKey.toAccountId(0, 0);

        expect(aliasAccountId.toString()).to.be.equal(
            `0.0.${publicKey.toString()}`,
        );
    });

    it("should return type of the private key", async function () {
        const privateKey = PrivateKey.generateECDSA();

        expect(privateKey.type).to.be.string("secp256k1");
    });

    it("should produce consistent public key from 12 word mnemonic and fromStringECDSA", async function () {
        for (let i = 0; i < STRESS_TEST_ITERATION_COUNT; i++) {
            const mnemonic = await Mnemonic.generate12();
            const privateKeyFromMnemonic =
                await mnemonic.toStandardECDSAsecp256k1PrivateKey();
            const publicKeyFromMnemonic = privateKeyFromMnemonic.publicKey;

            const privateKeyFromString = PrivateKey.fromStringECDSA(
                privateKeyFromMnemonic.toStringDer(),
            );
            const publicKeyFromString = privateKeyFromString.publicKey;

            if (
                publicKeyFromMnemonic.toStringDer() !==
                publicKeyFromString.toStringDer()
            ) {
                console.log(
                    "Public key from mnemonic: ",
                    publicKeyFromMnemonic,
                );
                console.log("Public key from string: ", publicKeyFromString);
                throw new Error("Public key mismatch");
            }
        }
    });

    it("should produce consistent public key from 12 word mnemonic and fromBytesECDSA", async function () {
        for (let i = 0; i < STRESS_TEST_ITERATION_COUNT; i++) {
            const mnemonic = await Mnemonic.generate12();
            const privateKeyFromMnemonic =
                await mnemonic.toStandardECDSAsecp256k1PrivateKey();
            const publicKeyFromMnemonic = privateKeyFromMnemonic.publicKey;

            const privateKeyFromString = PrivateKey.fromBytesECDSA(
                privateKeyFromMnemonic.toBytesDer(),
            );
            const publicKeyFromString = privateKeyFromString.publicKey;

            if (
                publicKeyFromMnemonic.toStringDer() !==
                publicKeyFromString.toStringDer()
            ) {
                console.log(
                    "Public key from mnemonic: ",
                    publicKeyFromMnemonic,
                );
                console.log("Public key from string: ", publicKeyFromString);
                throw new Error("Public key mismatch");
            }
        }
    });

    it("should produce consistent public key from 24 word mnemonic and fromStringECDSA", async function () {
        for (let i = 0; i < STRESS_TEST_ITERATION_COUNT; i++) {
            const mnemonic = await Mnemonic.generate();
            const privateKeyFromMnemonic =
                await mnemonic.toStandardECDSAsecp256k1PrivateKey();
            const publicKeyFromMnemonic = privateKeyFromMnemonic.publicKey;

            const privateKeyFromString = PrivateKey.fromStringECDSA(
                privateKeyFromMnemonic.toStringDer(),
            );
            const publicKeyFromString = privateKeyFromString.publicKey;

            if (
                publicKeyFromMnemonic.toStringDer() !==
                publicKeyFromString.toStringDer()
            ) {
                console.log(
                    "Public key from mnemonic: ",
                    publicKeyFromMnemonic,
                );
                console.log("Public key from string: ", publicKeyFromString);
                throw new Error("Public key mismatch");
            }
        }
    });

    it("should produce consistent public key from 24 word mnemonic and fromBytesECDSA", async function () {
        for (let i = 0; i < STRESS_TEST_ITERATION_COUNT; i++) {
            const mnemonic = await Mnemonic.generate();
            const privateKeyFromMnemonic =
                await mnemonic.toStandardECDSAsecp256k1PrivateKey();
            const publicKeyFromMnemonic = privateKeyFromMnemonic.publicKey;

            const privateKeyFromString = PrivateKey.fromBytesECDSA(
                privateKeyFromMnemonic.toBytesDer(),
            );
            const publicKeyFromString = privateKeyFromString.publicKey;

            if (
                publicKeyFromMnemonic.toStringDer() !==
                publicKeyFromString.toStringDer()
            ) {
                console.log(
                    "Public key from mnemonic: ",
                    publicKeyFromMnemonic,
                );
                console.log("Public key from string: ", publicKeyFromString);
                throw new Error("Public key mismatch");
            }
        }
    });
});
