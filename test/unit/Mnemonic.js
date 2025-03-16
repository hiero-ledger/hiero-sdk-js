import { expect } from "chai";

import { Mnemonic } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
import * as bip32 from "../../packages/cryptography/src/primitive/bip32.js";

const MNEMONIC_LEGACY_V1_STRING =
    "jolly kidnap tom lawn drunk chick optic lust mutter mole bride galley dense member sage neural widow decide curb aboard margin manure";
const MNEMONIC_LEGACY_V2_STRING =
    "obvious favorite remain caution remove laptop base vacant increase video erase pass sniff sausage knock grid argue salt romance way alone fever slush dune";
const MNEMONIC_24_WORD_STRING =
    "inmate flip alley wear offer often piece magnet surge toddler submit right radio absent pear floor belt raven price stove replace reduce plate home";
const MNEMONIC_12_WORD_STRING =
    "finish furnace tomorrow wine mass goose festival air palm easy region guilt";

describe("Mnemonic", function () {
    it("Legacy V1 mnemonic test", async function () {
        const PRIVATE_KEY1 =
            "00c2f59212cb3417f0ee0d38e7bd876810d04f2dd2cb5c2d8f26ff406573f2bd";
        const PUBLIC_KEY1 =
            "0c5bb4624df6b64c2f07a8cb8753945dd42d4b9a2ed4c0bf98e87ef154f473e9";

        const PRIVATE_KEY2 =
            "fae0002d2716ea3a60c9cd05ee3c4bb88723b196341b68a02d20975f9d049dc6";
        const PUBLIC_KEY2 =
            "f40f9fdb1f161c31ed656794ada7af8025e8b5c70e538f38a4dfb46a0a6b0392";

        const PRIVATE_KEY3 =
            "882a565ad8cb45643892b5366c1ee1c1ef4a730c5ce821a219ff49b6bf173ddf";
        const PUBLIC_KEY3 =
            "53c6b451e695d6abc52168a269316a0d20deee2331f612d4fb8b2b379e5c6854";

        const PRIVATE_KEY4 =
            "6890dc311754ce9d3fc36bdf83301aa1c8f2556e035a6d0d13c2cccdbbab1242";
        const PUBLIC_KEY4 =
            "45f3a673984a0b4ee404a1f4404ed058475ecd177729daa042e437702f7791e9";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_LEGACY_V1_STRING);

        // Chain m
        const key1 = await mnemonic.toLegacyPrivateKey();
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(key1.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY1);

        // Chain m/0
        const key2 = await key1.legacyDerive(0);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(key2.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY2);

        // Chain m/-1
        const key3 = await key1.legacyDerive(-1);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(key3.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY3);

        // Chain m/1099511627775
        const key4 = await key1.legacyDerive(parseInt("1099511627775L"));
        expect(key4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(key4.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY4);
    });

    it("Legacy V2 mnemonic test", async function () {
        const PRIVATE_KEY1 =
            "98aa82d6125b5efa04bf8372be7931d05cd77f5ef3330b97d6ee7c006eaaf312";
        const PUBLIC_KEY1 =
            "e0ce688d614f22f96d9d213ca513d58a7d03d954fe45790006e6e86b25456465";

        const PRIVATE_KEY2 =
            "2b7345f302a10c2a6d55bf8b7af40f125ec41d780957826006d30776f0c441fb";
        const PUBLIC_KEY2 =
            "0e19f99800b007cc7c82f9d85b73e0f6e48799469450caf43f253b48c4d0d91a";

        const PRIVATE_KEY3 =
            "caffc03fdb9853e6a91a5b3c57a5c0031d164ce1c464dea88f3114786b5199e5";
        const PUBLIC_KEY3 =
            "9fe11da3fcfba5d28a6645ecb611a9a43dbe6014b102279ba1d34506ea86974b";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_LEGACY_V2_STRING);

        // Chain m
        const key1 = await mnemonic.toLegacyPrivateKey();
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(key1.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY1);

        // Chain m/0
        const key2 = await key1.legacyDerive(0);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(key2.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY2);

        // Chain m/-1
        const key3 = await key1.legacyDerive(-1);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(key3.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY3);
    });

    it("Mnemonic test", async function () {
        const expectedPrivateKey =
            "302e020100300506032b657004220420853f15aecd22706b105da1d709b4ac05b4906170c2b9c7495dff9af49e1391da";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const key = await mnemonic.toEd25519PrivateKey();

        expect(expectedPrivateKey).to.contain(key.toStringRaw());
        expect(key.toStringDer()).to.be.equal(expectedPrivateKey);
    });

    it("Mnemonic passphrase test", async function () {
        const passphrase = "\u03B4\u03BF\u03BA\u03B9\u03BC\u03AE";
        const expectedPrivateKey =
            "302e020100300506032b6570042204203fefe1000db9485372851d542453b07e7970de4e2ecede7187d733ac037f4d2c";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const key = await mnemonic.toEd25519PrivateKey(passphrase);

        expect(expectedPrivateKey).to.contain(key.toStringRaw());
        expect(key.toStringDer()).to.be.equal(expectedPrivateKey);
    });

    it("BIP39 test vector", async function () {
        const PASSPHRASE = "TREZOR";

        // The 18-word mnemonics are not supported by the SDK
        const MNEMONIC_STRINGS = [
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            "legal winner thank year wave sausage worth useful legal winner thank yellow",
            "letter advice cage absurd amount doctor acoustic avoid letter advice cage above",
            "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong",
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art",
            "legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth title",
            "letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic bless",
            "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote",
            "ozone drill grab fiber curtain grace pudding thank cruise elder eight picnic",
            "hamster diagram private dutch cause delay private meat slide toddler razor book happy fancy gospel tennis maple dilemma loan word shrug inflict delay length",
            "scheme spot photo card baby mountain device kick cradle pact join borrow",
            "panda eyebrow bullet gorilla call smoke muffin taste mesh discover soft ostrich alcohol speed nation flash devote level hobby quick inner drive ghost inside",
            "cat swing flag economy stadium alone churn speed unique patch report train",
            "all hour make first leader extend hole alien behind guard gospel lava path output census museum junior mass reopen famous sing advance salt reform",
            "vessel ladder alter error federal sibling chat ability sun glass valve picture",
            "void come effort suffer camp survey warrior heavy shoot primary clutch crush open amazing screen patrol group space point ten exist slush involve unfold",
        ];

        const EXPECTED_SEEDS = [
            "c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04",
            "2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607",
            "d71de856f81a8acc65e6fc851a38d4d7ec216fd0796d0a6827a3ad6ed5511a30fa280f12eb2e47ed2ac03b5c462a0358d18d69fe4f985ec81778c1b370b652a8",
            "ac27495480225222079d7be181583751e86f571027b0497b5b5d11218e0a8a13332572917f0f8e5a589620c6f15b11c61dee327651a14c34e18231052e48c069",
            "bda85446c68413707090a52022edd26a1c9462295029f2e60cd7c4f2bbd3097170af7a4d73245cafa9c3cca8d561a7c3de6f5d4a10be8ed2a5e608d68f92fcc8",
            "bc09fca1804f7e69da93c2f2028eb238c227f2e9dda30cd63699232578480a4021b146ad717fbb7e451ce9eb835f43620bf5c514db0f8add49f5d121449d3e87",
            "c0c519bd0e91a2ed54357d9d1ebef6f5af218a153624cf4f2da911a0ed8f7a09e2ef61af0aca007096df430022f7a2b6fb91661a9589097069720d015e4e982f",
            "dd48c104698c30cfe2b6142103248622fb7bb0ff692eebb00089b32d22484e1613912f0a5b694407be899ffd31ed3992c456cdf60f5d4564b8ba3f05a69890ad",
            "274ddc525802f7c828d8ef7ddbcdc5304e87ac3535913611fbbfa986d0c9e5476c91689f9c8a54fd55bd38606aa6a8595ad213d4c9c9f9aca3fb217069a41028",
            "64c87cde7e12ecf6704ab95bb1408bef047c22db4cc7491c4271d170a1b213d20b385bc1588d9c7b38f1b39d415665b8a9030c9ec653d75e65f847d8fc1fc440",
            "ea725895aaae8d4c1cf682c1bfd2d358d52ed9f0f0591131b559e2724bb234fca05aa9c02c57407e04ee9dc3b454aa63fbff483a8b11de949624b9f1831a9612",
            "72be8e052fc4919d2adf28d5306b5474b0069df35b02303de8c1729c9538dbb6fc2d731d5f832193cd9fb6aeecbc469594a70e3dd50811b5067f3b88b28c3e8d",
            "deb5f45449e615feff5640f2e49f933ff51895de3b4381832b3139941c57b59205a42480c52175b6efcffaa58a2503887c1e8b363a707256bdd2b587b46541f5",
            "26e975ec644423f4a4c4f4215ef09b4bd7ef924e85d1d17c4cf3f136c2863cf6df0a475045652c57eb5fb41513ca2a2d67722b77e954b4b3fc11f7590449191d",
            "2aaa9242daafcee6aa9d7269f17d4efe271e1b9a529178d7dc139cd18747090bf9d60295d0ce74309a78852a9caadf0af48aae1c6253839624076224374bc63f",
            "01f5bced59dec48e362f2c45b5de68b9fd6c92c6634f44d6d40aab69056506f0e35524a518034ddc1192e1dacd32c1ed3eaa3c3b131c88ed8e7e54c49a5d0998",
        ];

        for (let i = 0; i < MNEMONIC_STRINGS.length; i++) {
            const seed = await (
                await Mnemonic.fromString(MNEMONIC_STRINGS[i])
            ).toSeed(PASSPHRASE);
            expect(hex.encode(seed)).to.be.equal(EXPECTED_SEEDS[i]);
        }
    });

    it("Mnemonic.toStandardED25519PrivateKey() test vector 1", async function () {
        // https://github.com/hashgraph/hedera-sdk-reference/issues/73#issuecomment-1422330626
        const CHAIN_CODE1 =
            "404914563637c92d688deb9d41f3f25cbe8d6659d859cc743712fcfac72d7eda";
        const PRIVATE_KEY1 =
            "f8dcc99a1ced1cc59bc2fee161c26ca6d6af657da9aa654da724441343ecd16f";
        const PUBLIC_KEY1 =
            "2e42c9f5a5cdbde64afa65ce3dbaf013d5f9ff8d177f6ef4eb89fbe8c084ec0d";

        const CHAIN_CODE2 =
            "9c2b0073ac934696cd0b52c6c521b9bd1902aac134380a737282fdfe29014bf1";
        const PRIVATE_KEY2 =
            "e978a6407b74a0730f7aeb722ad64ab449b308e56006c8bff9aad070b9b66ddf";
        const PUBLIC_KEY2 =
            "c4b33dca1f83509f17b69b2686ee46b8556143f79f4b9df7fe7ed3864c0c64d0";

        const CHAIN_CODE3 =
            "699344acc5e07c77eb63b154b4c5c3d33cab8bf85ee21bea4cc29ab7f0502259";
        const PRIVATE_KEY3 =
            "abeca64d2337db386e289482a252334c68c7536daaefff55dc169ddb77fbae28";
        const PUBLIC_KEY3 =
            "fd311925a7a04b38f7508931c6ae6a93e5dc4394d83dafda49b051c0017d3380";

        const CHAIN_CODE4 =
            "e5af7c95043a912af57a6e031ddcad191677c265d75c39954152a2733c750a3b";
        const PRIVATE_KEY4 =
            "9a601db3e24b199912cec6573e6a3d01ffd3600d50524f998b8169c105165ae5";
        const PUBLIC_KEY4 =
            "cf525500706faa7752dca65a086c9381d30d72cc67f23bf334f330579074a890";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const passphrase = "some pass";

        // Chain m/44'/3030'/0'/0'/0'
        const key1 = await mnemonic.toStandardEd25519PrivateKey("", 0);
        expect(hex.encode(key1.chainCode)).to.be.equal(CHAIN_CODE1);
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(key1.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY1);

        // Chain m/44'/3030'/0'/0'/2147483647'
        const key2 = await mnemonic.toStandardEd25519PrivateKey("", 2147483647);
        expect(hex.encode(key2.chainCode)).to.be.equal(CHAIN_CODE2);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(key2.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY2);

        // Chain m/44'/3030'/0'/0'/0', passphrase: "some pass"
        const key3 = await mnemonic.toStandardEd25519PrivateKey(passphrase, 0);
        expect(hex.encode(key3.chainCode)).to.be.equal(CHAIN_CODE3);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(key3.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY3);

        // Chain m/44'/3030'/0'/0'/2147483647', passphrase: "some pass"
        const key4 = await mnemonic.toStandardEd25519PrivateKey(
            passphrase,
            2147483647,
        );
        expect(hex.encode(key4.chainCode)).to.be.equal(CHAIN_CODE4);
        expect(key4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(key4.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY4);
    });

    it("Mnemonic.toStandardED25519PrivateKey() test vector 2", async function () {
        // https://github.com/hashgraph/hedera-sdk-reference/issues/73#issuecomment-1424761224
        const CHAIN_CODE1 =
            "48c89d67e9920e443f09d2b14525213ff83b245c8b98d63747ea0801e6d0ff3f";
        const PRIVATE_KEY1 =
            "020487611f3167a68482b0f4aacdeb02cc30c52e53852af7b73779f67eeca3c5";
        const PUBLIC_KEY1 =
            "2d047ff02a2091f860633f849ea2024b23e7803cfd628c9bdd635010cbd782d3";

        const CHAIN_CODE2 =
            "c0bcdbd9df6d8a4f214f20f3e5c7856415b68be34a1f406398c04690818bea16";
        const PRIVATE_KEY2 =
            "d0c4484480944db698dd51936b7ecc81b0b87e8eafc3d5563c76339338f9611a";
        const PUBLIC_KEY2 =
            "a1a2573c2c45bd57b0fd054865b5b3d8f492a6e1572bf04b44471e07e2f589b2";

        const CHAIN_CODE3 =
            "998a156855ab5398afcde06164b63c5523ff2c8900db53962cc2af191df59e1c";
        const PRIVATE_KEY3 =
            "d06630d6e4c17942155819bbbe0db8306cd989ba7baf3c29985c8455fbefc37f";
        const PUBLIC_KEY3 =
            "6bd0a51e0ca6fcc8b13cf25efd0b4814978bcaca7d1cf7dbedf538eb02969acb";

        const CHAIN_CODE4 =
            "19d99506a5ce2dc0080092068d278fe29b85ffb8d9c26f8956bfca876307c79c";
        const PRIVATE_KEY4 =
            "a095ef77ee88da28f373246e9ae143f76e5839f680746c3f921e90bf76c81b08";
        const PUBLIC_KEY4 =
            "35be6a2a37ff6bbb142e9f4d9b558308f4f75d7c51d5632c6a084257455e1461";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_12_WORD_STRING);
        const passphrase = "some pass";

        // Chain m/44'/3030'/0'/0'/0'
        const key1 = await mnemonic.toStandardEd25519PrivateKey("", 0);
        expect(hex.encode(key1.chainCode)).to.be.equal(CHAIN_CODE1);
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(key1.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY1);

        // Chain m/44'/3030'/0'/0'/2147483647'
        const key2 = await mnemonic.toStandardEd25519PrivateKey("", 2147483647);
        expect(hex.encode(key2.chainCode)).to.be.equal(CHAIN_CODE2);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(key2.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY2);

        // Chain m/44'/3030'/0'/0'/0', passphrase: "some pass"
        const key3 = await mnemonic.toStandardEd25519PrivateKey(passphrase, 0);
        expect(hex.encode(key3.chainCode)).to.be.equal(CHAIN_CODE3);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(key3.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY3);

        // Chain m/44'/3030'/0'/0'/2147483647', passphrase: "some pass"
        const key4 = await mnemonic.toStandardEd25519PrivateKey(
            passphrase,
            2147483647,
        );
        expect(hex.encode(key4.chainCode)).to.be.equal(CHAIN_CODE4);
        expect(key4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(key4.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY4);
    });

    it("Mnemonic.toStandardED25519PrivateKey() should fail when index is pre-hardened", async function () {
        const mnemonic = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const hardenedIndex = bip32.toHardenedIndex(10);
        const expectedError = new Error("the index should not be pre-hardened");

        try {
            await mnemonic.toStandardEd25519PrivateKey("", hardenedIndex);
        } catch (error) {
            expect(error.message).to.be.equal(expectedError.message);
        }
    });

    it("Mnemonic.toStandardECDSAsecp256k1PrivateKey() test vector", async function () {
        // https://github.com/hashgraph/hedera-sdk-reference/issues/73#issuecomment-1422330626
        const CHAIN_CODE1 =
            "7717bc71194c257d4b233e16cf48c24adef630052f874a262d19aeb2b527620d";
        const PRIVATE_KEY1 =
            "0fde7bfd57ae6ec310bdd8b95967d98e8762a2c02da6f694b152cf9860860ab8";
        const PUBLIC_KEY1 =
            "03b1c064b4d04d52e51f6c8e8bb1bff75d62fa7b1446412d5901d424f6aedd6fd4";

        const CHAIN_CODE2 =
            "e333da4bd9e21b5dbd2b0f6d88bad02f0fa24cf4b70b2fb613368d0364cdf8af";
        const PRIVATE_KEY2 =
            "aab7d720a32c2d1ea6123f58b074c865bb07f6c621f14cb012f66c08e64996bb";
        const PUBLIC_KEY2 =
            "03a0ea31bb3562f8a309b1436bc4b2f537301778e8a5e12b68cec26052f567a235";

        const CHAIN_CODE3 =
            "0ff552587f6baef1f0818136bacac0bb37236473f6ecb5a8c1cc68a716726ed1";
        const PRIVATE_KEY3 =
            "6df5ed217cf6d5586fdf9c69d39c843eb9d152ca19d3e41f7bab483e62f6ac25";
        const PUBLIC_KEY3 =
            "0357d69bb36fee569838fe7b325c07ca511e8c1b222873cde93fc6bb541eb7ecea";

        const CHAIN_CODE4 =
            "3a5048e93aad88f1c42907163ba4dce914d3aaf2eea87b4dd247ca7da7530f0b";
        const PRIVATE_KEY4 =
            "80df01f79ee1b1f4e9ab80491c592c0ef912194ccca1e58346c3d35cb5b7c098";
        const PUBLIC_KEY4 =
            "039ebe79f85573baa065af5883d0509a5634245f7864ddead76a008c9e42aa758d";

        const CHAIN_CODE5 =
            "e54254940db58ef4913a377062ac6e411daebf435ad592d262d5a66d808a8b94";
        const PRIVATE_KEY5 =
            "60cb2496a623e1201d4e0e7ce5da3833cd4ec7d6c2c06bce2bcbcbc9dfef22d6";
        const PUBLIC_KEY5 =
            "02b59f348a6b69bd97afa80115e2d5331749b3c89c61297255430c487d6677f404";

        const CHAIN_CODE6 =
            "cb23165e9d2d798c85effddc901a248a1a273fab2a56fe7976df97b016e7bb77";
        const PRIVATE_KEY6 =
            "100477c333028c8849250035be2a0a166a347a5074a8a727bce1db1c65181a50";
        const PUBLIC_KEY6 =
            "03d10ebfa2d8ff2cd34aa96e5ef59ca2e69316b4c0996e6d5f54b6932fe51be560";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const passphrase = "some pass";

        // Chain m/44'/3030'/0'/0/0
        const key1 = await mnemonic.toStandardECDSAsecp256k1PrivateKey("", 0);
        expect(hex.encode(key1.chainCode)).to.be.equal(CHAIN_CODE1);
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(key1.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY1);

        // Chain m/44'/3030'/0'/0/0'
        const key2 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            "",
            bip32.toHardenedIndex(0),
        );
        expect(hex.encode(key2.chainCode)).to.be.equal(CHAIN_CODE2);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(key2.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY2);

        // Chain m/44'/3030'/0'/0/0, passphrase "some pass"
        const key3 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            0,
        );
        expect(hex.encode(key3.chainCode)).to.be.equal(CHAIN_CODE3);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(key3.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY3);

        // Chain m/44'/3030'/0'/0/0', passphrase "some pass"
        const key4 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            bip32.toHardenedIndex(0),
        );
        expect(hex.encode(key4.chainCode)).to.be.equal(CHAIN_CODE4);
        expect(key4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(key4.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY4);

        // Chain m/44'/3030'/0'/0/2147483647, passphrase "some pass"
        const key5 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            2147483647,
        );
        expect(hex.encode(key5.chainCode)).to.be.equal(CHAIN_CODE5);
        expect(key5.toStringRaw()).to.be.equal(PRIVATE_KEY5);
        expect(key5.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY5);

        // Chain m/44'/3030'/0'/0/2147483647', passphrase "some pass"
        const key6 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            bip32.toHardenedIndex(2147483647),
        );
        expect(hex.encode(key6.chainCode)).to.be.equal(CHAIN_CODE6);
        expect(key6.toStringRaw()).to.be.equal(PRIVATE_KEY6);
        expect(key6.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY6);
    });

    it("Mnemonic.toStandardECDSAsecp256k1PrivateKey() test vector 2", async function () {
        // https://github.com/hashgraph/hedera-sdk-reference/issues/73#issuecomment-1424761224
        const CHAIN_CODE1 =
            "e76e0480faf2790e62dc1a7bac9dce51db1b3571fd74d8e264abc0d240a55d09";
        const PRIVATE_KEY1 =
            "f033824c20dd9949ad7a4440f67120ee02a826559ed5884077361d69b2ad51dd";
        const PUBLIC_KEY1 =
            "0294bf84a54806989a74ca4b76291d386914610b40b610d303162b9e495bc06416";

        const CHAIN_CODE2 =
            "60c39c6a77bd68c0aaabfe2f4711dc9c2247214c4f4dae15ad4cb76905f5f544";
        const PRIVATE_KEY2 =
            "962f549dafe2d9c8091ac918cb4fc348ab0767353f37501067897efbc84e7651";
        const PUBLIC_KEY2 =
            "027123855357fd41d28130fbc59053192b771800d28ef47319ef277a1a032af78f";

        const CHAIN_CODE3 =
            "911a1095b64b01f7f3a06198df3d618654e5ed65862b211997c67515e3167892";
        const PRIVATE_KEY3 =
            "c139ebb363d7f441ccbdd7f58883809ec0cc3ee7a122ef67974eec8534de65e8";
        const PUBLIC_KEY3 =
            "0293bdb1507a26542ed9c1ec42afe959cf8b34f39daab4bf842cdac5fa36d50ef7";

        const CHAIN_CODE4 =
            "64173f2dcb1d65e15e787ef882fa15f54db00209e2dab16fa1661244cd98e95c";
        const PRIVATE_KEY4 =
            "87c1d8d4bb0cebb4e230852f2a6d16f6847881294b14eb1d6058b729604afea0";
        const PUBLIC_KEY4 =
            "03358e7761a422ca1c577f145fe845c77563f164b2c93b5b34516a8fa13c2c0888";

        const CHAIN_CODE5 =
            "a7250c2b07b368a054f5c91e6a3dbe6ca3bbe01eb0489fe8778304bd0a19c711";
        const PRIVATE_KEY5 =
            "2583170ee745191d2bb83474b1de41a1621c47f6e23db3f2bf413a1acb5709e4";
        const PUBLIC_KEY5 =
            "03f9eb27cc73f751e8e476dd1db79037a7df2c749fa75b6cc6951031370d2f95a5";

        const CHAIN_CODE6 =
            "66a1175e7690e3714d53ffce16ee6bb4eb02065516be2c2ad6bf6c9df81ec394";
        const PRIVATE_KEY6 =
            "f2d008cd7349bdab19ed85b523ba218048f35ca141a3ecbc66377ad50819e961";
        const PUBLIC_KEY6 =
            "027b653d04958d4bf83dd913a9379b4f9a1a1e64025a691830a67383bc3157c044";

        const mnemonic = await Mnemonic.fromString(MNEMONIC_12_WORD_STRING);
        const passphrase = "some pass";

        // Chain m/44'/3030'/0'/0/0
        const key1 = await mnemonic.toStandardECDSAsecp256k1PrivateKey("", 0);
        expect(hex.encode(key1.chainCode)).to.be.equal(CHAIN_CODE1);
        expect(key1.toStringRaw()).to.be.equal(PRIVATE_KEY1);
        expect(key1.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY1);

        // Chain m/44'/3030'/0'/0/0'
        const key2 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            "",
            bip32.toHardenedIndex(0),
        );
        expect(hex.encode(key2.chainCode)).to.be.equal(CHAIN_CODE2);
        expect(key2.toStringRaw()).to.be.equal(PRIVATE_KEY2);
        expect(key2.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY2);

        // Chain m/44'/3030'/0'/0/0, passphrase "some pass"
        const key3 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            0,
        );
        expect(hex.encode(key3.chainCode)).to.be.equal(CHAIN_CODE3);
        expect(key3.toStringRaw()).to.be.equal(PRIVATE_KEY3);
        expect(key3.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY3);

        // Chain m/44'/3030'/0'/0/0', passphrase "some pass"
        const key4 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            bip32.toHardenedIndex(0),
        );
        expect(hex.encode(key4.chainCode)).to.be.equal(CHAIN_CODE4);
        expect(key4.toStringRaw()).to.be.equal(PRIVATE_KEY4);
        expect(key4.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY4);

        // Chain m/44'/3030'/0'/0/2147483647, passphrase "some pass"
        const key5 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            2147483647,
        );
        expect(hex.encode(key5.chainCode)).to.be.equal(CHAIN_CODE5);
        expect(key5.toStringRaw()).to.be.equal(PRIVATE_KEY5);
        expect(key5.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY5);

        // Chain m/44'/3030'/0'/0/2147483647', passphrase "some pass"
        const key6 = await mnemonic.toStandardECDSAsecp256k1PrivateKey(
            passphrase,
            bip32.toHardenedIndex(2147483647),
        );
        expect(hex.encode(key6.chainCode)).to.be.equal(CHAIN_CODE6);
        expect(key6.toStringRaw()).to.be.equal(PRIVATE_KEY6);
        expect(key6.publicKey.toStringRaw()).to.be.equal(PUBLIC_KEY6);
    });

    it("Mnemonic.calculateDerivationPathValues() test vector", async function () {
        const DPATH_1 = "m/44'/60'/0'/0/0";
        const DPATH_2 = "m/44/60/0/2147483647'/2147483646'";

        const mnemonic1 = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const result1 = await mnemonic1.calculateDerivationPathValues(DPATH_1);
        const result2 = await mnemonic1.calculateDerivationPathValues(DPATH_2);

        // NOTE that 0x80000000 == 2147483648
        expect(result1).to.deep.equal([
            -2147483604, -2147483588, -2147483648, 0, 0,
        ]);
        expect(result2).to.deep.equal([44, 60, 0, -1, -2]);
    });

    it("Mnemonic.toStandardECDSAsecp256k1PrivateKeyCustomDerivationPath() test vector", async function () {
        const DPATH_1 = "m/44'/60'/0'/0/0";
        const PASSPHRASE_1 = "";
        const CHAIN_CODE_1 =
            "58a9ee31eaf7499abc01952b44dbf0a2a5d6447512367f09d99381c9605bf9e8";
        const PRIVATE_KEY_1 =
            "78f9545e40025cf7da9126a4d6a861ae34031d1c74c3404df06110c9fde371ad";
        const PUBLIC_KEY_1 =
            "02a8f4c22eea66617d4f119e3a951b93f584949bbfee90bd555305402da6c4e569";

        const DPATH_2 = "m/44'/60'/0'/0/1";
        const PASSPHRASE_2 = "";
        const CHAIN_CODE_2 =
            "6dcfc7a4914bd0e75b94a2f38afee8c247b34810202a2c64fe599ee1b88afdc9";
        const PRIVATE_KEY_2 =
            "77ca263661ebdd5a8b33c224aeff5e7bf67eedacee68a1699d97ee8929d7b130";
        const PUBLIC_KEY_2 =
            "03e84c9be9be53ad722038cc1943e79df27e5c1d31088adb4f0e62444f4dece683";

        const DPATH_3 = "m/44'/60'/0'/0/2";
        const PASSPHRASE_3 = "";
        const CHAIN_CODE_3 =
            "c8c798d2b3696be1e7a29d1cea205507eedc2057006b9ef1cde1b4e346089e17";
        const PRIVATE_KEY_3 =
            "31c24292eac951279b659c335e44a2e812d0f1a228b1d4d87034874d376e605a";
        const PUBLIC_KEY_3 =
            "0207ff3faf4055c1aa7a5ad94d6ff561fac35b9ae695ef486706243667d2b4d10e";

        const mnemonic1 = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const key1 =
            await mnemonic1.toStandardECDSAsecp256k1PrivateKeyCustomDerivationPath(
                PASSPHRASE_1,
                DPATH_1,
            );
        expect(hex.encode(key1.chainCode)).to.equal(CHAIN_CODE_1);
        expect(key1.toStringRaw()).to.equal(PRIVATE_KEY_1);
        expect(key1.publicKey.toStringRaw()).to.include(PUBLIC_KEY_1);

        const mnemonic2 = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const key2 =
            await mnemonic2.toStandardECDSAsecp256k1PrivateKeyCustomDerivationPath(
                PASSPHRASE_2,
                DPATH_2,
            );
        expect(hex.encode(key2.chainCode)).to.equal(CHAIN_CODE_2);
        expect(key2.toStringRaw()).to.equal(PRIVATE_KEY_2);
        expect(key2.publicKey.toStringRaw()).to.include(PUBLIC_KEY_2);

        const mnemonic3 = await Mnemonic.fromString(MNEMONIC_24_WORD_STRING);
        const key3 =
            await mnemonic3.toStandardECDSAsecp256k1PrivateKeyCustomDerivationPath(
                PASSPHRASE_3,
                DPATH_3,
            );
        expect(hex.encode(key3.chainCode)).to.equal(CHAIN_CODE_3);
        expect(key3.toStringRaw()).to.equal(PRIVATE_KEY_3);
        expect(key3.publicKey.toStringRaw()).to.include(PUBLIC_KEY_3);
    });
});
