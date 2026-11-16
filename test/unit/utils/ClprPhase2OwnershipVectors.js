// SPDX-License-Identifier: Apache-2.0

// PUBLIC TEST KEYS ONLY. Provisional CN #28017/#28019 vectors, not final EAP-0.2.
// Independently generated with ethers and Node Ed25519 from the pinned preimages.
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
                "0fb81d4ae470ad5473621e5017ae83d6f2e8100f7a079fe9144065e75f5fd371",
            channelSignature:
                "8ba2aa84fdb30273e8f474c5fc0b72a0c83e4239e4adb4ee84f14f0e205c960f0bafa18a5a5c77ee3afc2aeebf52aa6a47128947087453038aee7b636930b318",
            connectorId:
                "532a8331032028874f4d7fa1953636f8b076876c493606f93a86d8880058b4a6",
            connectorCommitment:
                "647e3f78cfdbceb3714e6c4d043f60e3169cabae3d90be168aeb58796ed6533d",
            connectorDigest:
                "bd4edcb1f9ae3e87d27b3e37aa624951700d80de51d5125e6071f182cf981b72",
            connectorSignature:
                "f60b0f496a88c0aede1515e19969bad6b5796076c2cc5c5f95052ac0dacb0bb02a64fa3fc9c5d59a8ba0c8e837928d11d114b775a972d4e6f272b671479062aa",
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
                "0fb81d4ae470ad5473621e5017ae83d6f2e8100f7a079fe9144065e75f5fd371",
            channelSignature:
                "477fd2041b62f819757e1a02b58917f857324a79b25b993baf204dbafa51a27496e7c731a4bdbc28d475e10dfd6f43dd1e683ad978a18c49aadead2df433430a",
            connectorId:
                "488d7b7fdcc061f1de9fe98666c1337f0fc90275889f2450d59e1e6e837e74b1",
            connectorCommitment:
                "a36b6836b720019a9fb1846df6bb4b76d13a1f276da0ebc2371b4d0eb8e30618",
            connectorDigest:
                "170146342e149de3245c2cde022ee774c62c29b7c8952337b987b349ef95b681",
            connectorSignature:
                "bc2705527b342fa6ac2c90ca6c973ce11ee2b7aea35e3ce374ceeba35cc047b10df05c450792f370fd0a94c643123bd600b5d2745bbd9b82193e84f674636206",
        },
    ],
    baseline: {
        channel: "807100e235decc60c9d7ce28504488c62733f8fc",
        connector: "453306c6570fafb6435346b22f0a63362f29d928",
    },
    verifierContract: "1.2.345",
    contractProto: "0801100218d902",
    adminKeyProto:
        "2a4d080112490a233a210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980a221220d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    configProofBytes: "ff0007",
    endpointManifestProofBytes: "800009ff",
};
