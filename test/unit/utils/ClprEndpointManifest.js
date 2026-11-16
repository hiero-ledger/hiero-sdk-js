// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import * as hex from "../../../src/encoding/hex.js";

export function makeEndpointManifestResponse() {
    return {
        header: { nodeTransactionPrecheckCode: 0 },
        manifest: {
            version: Long.fromString("9007199254740993", true),
            serviceAddress: hex.decode(
                "000000000000000000000000000000000000016e",
            ),
            endpoints: [
                {
                    serviceEndpoint: { ipAddress: "192.0.2.1", port: 50211 },
                    tlsCertificate: hex.decode("01020304"),
                    accountId: hex.decode("ff00807f"),
                },
                {
                    serviceEndpoint: {
                        ipAddress: "2001:db8::2",
                        port: 50212,
                    },
                    tlsCertificate: hex.decode("05060708"),
                    accountId: hex.decode("aabbccdd"),
                },
            ],
        },
        manifestStateProof: hex.decode("090a0b0c"),
    };
}
