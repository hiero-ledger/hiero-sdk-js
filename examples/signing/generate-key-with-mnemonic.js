import { Mnemonic } from "@hiero-ledger/sdk";

/**
 *
 */
async function main() {
    console.log("Generate ECDSA Key With Mnemonic Phrase Example Start!");

    // 1. 24-word mnemonic → ECDSA private key → public key
    console.log(
        "Generating random 24-word mnemonic from the BIP-39 standard English word list...",
    );
    const mnemonic24 = await Mnemonic.generate();
    console.log(`Generated 24-word mnemonic: ${mnemonic24.toString()}`);

    console.log(
        "Recovering an ECDSA private key from the 24-word mnemonic phrase above...",
    );
    const privateKey24 = await mnemonic24.toStandardECDSAsecp256k1PrivateKey(
        "",
        0,
    );
    console.log(`Recovered ECDSA private key: ${privateKey24.toString()}`);

    console.log("Deriving a public key from the above private key...");
    console.log(`Public key: ${privateKey24.publicKey.toString()}`);

    console.log("---");

    // 2. 12-word mnemonic → ECDSA private key → public key
    console.log(
        "Generating random 12-word mnemonic from the BIP-39 standard English word list...",
    );
    const mnemonic12 = await Mnemonic.generate12();
    console.log(`Generated 12-word mnemonic: ${mnemonic12.toString()}`);

    console.log(
        "Recovering an ECDSA private key from the 12-word mnemonic phrase above...",
    );
    const privateKey12 = await mnemonic12.toStandardECDSAsecp256k1PrivateKey(
        "",
        0,
    );
    console.log(`Recovered ECDSA private key: ${privateKey12.toString()}`);

    console.log("Deriving a public key from the above private key...");
    console.log(`Public key: ${privateKey12.publicKey.toString()}`);

    console.log("Generate ECDSA Key With Mnemonic Phrase Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
