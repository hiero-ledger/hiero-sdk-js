import { PrivateKey } from "@hiero-ledger/sdk";

/**
 * How to generate an ECDSA (secp256k1) key pair and derive the EVM address from the public key.
 *
 * ECDSA keys with an EVM address derived from the public key are the recommended choice for new
 * Hedera accounts when you want compatibility with Ethereum tooling (wallets, Hardhat, ethers.js,
 * etc.).
 */
function main() {
    console.log("Generate ECDSA key pair and EVM address example start");

    console.log("Generating an ECDSA (secp256k1) private key...");
    const privateKey = PrivateKey.generateECDSA();
    console.log(`Private key: ${privateKey.toString()}`);

    console.log("Deriving the public key from the private key");
    const publicKey = privateKey.publicKey;
    console.log(`Public key: ${publicKey.toString()}`);

    console.log(
        "Deriving the EVM address (last 20 bytes of Keccak-256 of the uncompressed public key)",
    );
    const evmAddress = publicKey.toEvmAddress();
    console.log(`EVM address: 0x${evmAddress}`);

    console.log("Generate ECDSA key pair and EVM address example complete");
}

main();
