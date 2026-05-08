import { Mnemonic } from "@hiero-ledger/sdk";

async function main() {
    console.log("Generate ED25519 Key With Mnemonic Phrase Example Start!");

    // 1. 24-word mnemonic → ED25519 private key → public key
    console.log(
        "Generating random 24-word mnemonic from the BIP-39 standard English word list...",
    );
    const mnemonic24 = await Mnemonic.generate();
    console.log(`Generated 24-word mnemonic: ${mnemonic24.toString()}`);

    console.log(
        "Recovering an ED25519 private key from the 24-word mnemonic phrase above...",
    );
    const privateKey24 = await mnemonic24.toStandardEd25519PrivateKey("", 0);
    console.log(`Recovered ED25519 private key: ${privateKey24.toString()}`);

    console.log("Deriving a public key from the above private key...");
    console.log(`Public key: ${privateKey24.publicKey.toString()}`);

    console.log("---");

    // 2. 12-word mnemonic → ED25519 private key → public key
    console.log(
        "Generating random 12-word mnemonic from the BIP-39 standard English word list...",
    );
    const mnemonic12 = await Mnemonic.generate12();
    console.log(`Generated 12-word mnemonic: ${mnemonic12.toString()}`);

    console.log(
        "Recovering an ED25519 private key from the 12-word mnemonic phrase above...",
    );
    const privateKey12 = await mnemonic12.toStandardEd25519PrivateKey("", 0);
    console.log(`Recovered ED25519 private key: ${privateKey12.toString()}`);

    console.log("Deriving a public key from the above private key...");
    console.log(`Public key: ${privateKey12.publicKey.toString()}`);

    console.log("---");

    // 3. Legacy 22-word phrase → legacy private key → public key
    // Note: the legacy mnemonic format does not support a passphrase.
    const legacyString =
        "jolly kidnap tom lawn drunk chick optic lust mutter mole bride galley dense member sage neural widow decide curb aboard margin manure";
    console.log(`Parsing the hardcoded 22-word legacy phrase: ${legacyString}`);
    const legacyMnemonic = await Mnemonic.fromString(legacyString);

    console.log("Deriving the legacy private key from the legacy phrase...");
    const legacyPrivateKey = await legacyMnemonic.toLegacyPrivateKey();
    console.log(`Legacy private key: ${legacyPrivateKey.toString()}`);

    console.log("Deriving a public key from the legacy private key...");
    console.log(`Public key: ${legacyPrivateKey.publicKey.toString()}`);

    console.log("Generate ED25519 Key With Mnemonic Phrase Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
