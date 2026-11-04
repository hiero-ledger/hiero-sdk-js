// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import * as hex from "../../../src/encoding/hex.js";

export function makeThrottleLimits() {
    return {
        maxMessagesPerBundle: 8,
        maxMessagePayloadBytes: 1024,
        maxGasPerMessage: Long.fromString("9007199254740993", true),
        maxQueueDepth: 16,
        maxSyncBytes: Long.fromString("66560", true),
        maxLocalEndpoints: 2,
        maxPeerEndpoints: 3,
    };
}

export function makeLedgerConfigurationResponse() {
    return {
        header: { nodeTransactionPrecheckCode: 0 },
        configuration: {
            protocolVersion: 1,
            chainId: "hedera:testnet",
            serviceAddress: hex.decode(
                "000000000000000000000000000000000000016e",
            ),
            timestamp: {
                seconds: Long.fromString("1700000000"),
                nanos: 123456789,
            },
            throttles: makeThrottleLimits(),
            initialTrustAnchor: hex.decode("01020304"),
            initialTrustAnchorId: hex.decode("05060708"),
        },
        configurationStateProof: hex.decode("090a0b0c"),
    };
}
