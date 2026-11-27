// SPDX-License-Identifier: Apache-2.0

import { proto } from "@hiero-ledger/proto";
import ContractId from "../contract/ContractId.js";
import Key from "../Key.js";

/**
 * Copies mutable Long and byte fields as well as the ContractID container.
 * @param {ContractId} contract
 * @returns {ContractId}
 */
export function copyContractId(contract) {
    const copy = ContractId._fromProtobuf(
        proto.ContractID.decode(
            proto.ContractID.encode(contract._toProtobuf()).finish(),
        ),
    );
    copy._checksum = contract._checksum;
    return copy;
}

/**
 * Copies mutable fields inside compound keys in transaction inputs and mirror models.
 * @param {Key} key
 * @returns {Key}
 */
export function copyKey(key) {
    return Key._fromProtobufKey(
        proto.Key.decode(proto.Key.encode(key._toProtobufKey()).finish()),
    );
}
