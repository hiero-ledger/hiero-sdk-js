// SPDX-License-Identifier: Apache-2.0

// Public test keys only. Never use these keys for accounts or funds.
// Source: hiero-ledger/sdk-collaboration-hub, proposals/hips/hip-1535.md
// Ref: d04df37ca47fe67efc11fe2838b51f22f55cfe8e, Ownership test vectors.
export default {
    notice: "PUBLIC TEST KEYS ONLY. Never use these keys for accounts or funds.",
    encoding:
        "Hex without 0x; concatenation is raw bytes; keccak256 is not SHA3-256.",
    channelId:
        "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
    salt: "202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f",
    clprServiceAddress: "000000000000000000000000000000000000016e",
    vectors: [
        {
            signatureScheme: "ECDSA_SECP256K1",
            privateKeyOrSeed:
                "0000000000000000000000000000000000000000000000000000000000000001",
            publicKey:
                "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
            channelCommitment:
                "f476ca287a171dd8aa94165fb27fadee1fc61f051840382aed326e1fd41d41b3",
            channelDigest:
                "8ae1aa597fa146ebd3aa2ceddf360668dea5e526567e92b0321816a4e895bd2d",
            channelSignature:
                "cd52448f226a599c8d61d568a6186d50bb263a2559e08c1c8389233e632d2a5839232b91d7b8974b862ff5540bae836c08792936ebd708682413e0c8e2884086",
            connectorId:
                "532a8331032028874f4d7fa1953636f8b076876c493606f93a86d8880058b4a6",
            connectorCommitment:
                "647e3f78cfdbceb3714e6c4d043f60e3169cabae3d90be168aeb58796ed6533d",
            connectorDigest:
                "ba76a200dbda978d3be9120def504046d2d378bc85c8da3ac8a1c80710faee01",
            connectorSignature:
                "4b133aadf1d8a8c8bc6509842e245e01f71639e6e09fa2ed8ddf315faa38926f29e87b0cf850345f9cf74e82de367c7e31c96dfde6cb4603afb42750a551197d",
        },
        {
            signatureScheme: "ED25519",
            privateKeyOrSeed:
                "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
            publicKey:
                "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
            channelCommitment:
                "4816bb408545af511a22953026b40500890c7fa0a44c83682e251b114a0b6496",
            channelDigest:
                "8ae1aa597fa146ebd3aa2ceddf360668dea5e526567e92b0321816a4e895bd2d",
            channelSignature:
                "8ef8546b7a464125e9bda37b52203c8a8f1c59c51deae85c6178632b4050141226d6018ed52fcf8afd2a4c141a04109220eb8c7cd9d923a06a2fff23155cab0f",
            connectorId:
                "488d7b7fdcc061f1de9fe98666c1337f0fc90275889f2450d59e1e6e837e74b1",
            connectorCommitment:
                "a36b6836b720019a9fb1846df6bb4b76d13a1f276da0ebc2371b4d0eb8e30618",
            connectorDigest:
                "e4b51c24e102cf97db8b2c5320d5b2664693789b2de186a4e8cd67c2f2cb0fca",
            connectorSignature:
                "7374599d239cc8300e8f8f99057656a0c4b3e42f7fbaa99ab8cd3907da4d9fbe1ef28f12b7af9cd3f126fa513e3d6661b24fe790c1bd8a80275e8eaf69f1c70f",
        },
    ],
};
