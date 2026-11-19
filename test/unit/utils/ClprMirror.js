// SPDX-License-Identifier: Apache-2.0

export const CHANNEL = "11".repeat(32);
export const CONNECTOR = "22".repeat(32);
export const BASE = "https://mirror.example.com:443/api/v1";
export const ED_KEY = "aa".repeat(32);
export const channelRow = () => ({
    channel_id: `0x${CHANNEL}`,
    chain_id: "eip155:1",
    status: "ACTIVE",
    verifier_contract_id: "1.2.456",
    verifier_fingerprint: `0x${"33".repeat(32)}`,
    trust_anchor_id: `0x${"44".repeat(32)}`,
    next_message_id: "18446744073709551615",
    acked_message_id: "9007199254740993",
    received_message_id: 0,
    created_timestamp: "1726874200.000000001",
    timestamp: { from: "1726874345.123456789", to: null },
});
export const connectorRow = () => ({
    channel_id: `0x${CHANNEL}`,
    connector_id: `0x${CONNECTOR}`,
    connector_contract_id: "1.2.789",
    admin_key: { _type: "ED25519", key: ED_KEY },
    locked_stake: "9223372036854775807",
    in_flight_message_count: "18446744073709551615",
    slash_count: 0,
    created_timestamp: "1726874345.123456789",
    status: "ACTIVE",
});
