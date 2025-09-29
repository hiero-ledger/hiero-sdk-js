// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import * as EntityIdHelper from "../EntityIdHelper.js";
import * as HieroProto from "@hashgraph/proto";
import Key from "../Key.js";
import PublicKey from "../PublicKey.js";
import CACHE from "../Cache.js";
import EvmAddress from "../EvmAddress.js";
import * as hex from ".././encoding/hex.js";
import { isLongZeroAddress } from "../util.js";

/**
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * The ID for a crypto-currency account on Hedera.
 */
export default class AccountId {
    /**
     * @param {number | Long | import("../EntityIdHelper").IEntityId} props
     * @param {(number | Long)=} realm
     * @param {(number | Long)=} num
     * @param {(PublicKey)=} aliasKey
     * @param {(EvmAddress)=} evmAddress
     */
    constructor(props, realm, num, aliasKey, evmAddress) {
        const result = EntityIdHelper.constructor(props, realm, num);

        this.shard = result.shard;
        this.realm = result.realm;
        this.num = result.num;
        this.aliasKey = aliasKey != null ? aliasKey : null;
        this.evmAddress = evmAddress != null ? evmAddress : null;

        /**
         * @type {string | null}
         */
        this._checksum = null;
    }

    /**
     * @description Accepts the following formats as string:
     *      - as stand alone nubmers
     *      - as shard.realm.num
     *      - as shard.realm.hex (wo 0x prefix)
     *      - hex (w/wo 0x prefix)
     * @param {string} text
     * @returns {AccountId}
     */
    static fromString(text) {
        let shard = Long.ZERO;
        let realm = Long.ZERO;
        let num = Long.ZERO;
        let aliasKey = undefined;
        let evmAddress = undefined;

        if ((text.startsWith("0x") && text.length == 42) || text.length == 40) {
            evmAddress = EvmAddress.fromString(text);
        } else {
            const result = EntityIdHelper.fromStringSplitter(text);

            if (Number.isNaN(result.shard) || Number.isNaN(result.realm)) {
                throw new Error("invalid format for entity ID");
            }

            if (result.shard != null) shard = Long.fromString(result.shard);
            if (result.realm != null) realm = Long.fromString(result.realm);

            if (result.numOrHex.length < 20) {
                num = Long.fromString(result.numOrHex);
            } else if (result.numOrHex.length == 40) {
                evmAddress = EvmAddress.fromString(result.numOrHex);
            } else {
                aliasKey = PublicKey.fromString(result.numOrHex);
            }
        }

        return new AccountId(shard, realm, num, aliasKey, evmAddress);
    }

    /**
     * @description This handles both long-zero format and evm address format addresses.
     * If an actual evm address is passed, please use `AccountId.populateAccountNum(client)` method
     * to get the actual `num` value, since there is no cryptographic relation to the evm address
     * and cannot be populated directly
     * @param {Long | number} shard
     * @param {Long | number} realm
     * @param {EvmAddress | string} evmAddress
     * @returns {AccountId}
     */
    static fromEvmAddress(shard, realm, evmAddress) {
        const evmAddressObj =
            typeof evmAddress === "string"
                ? EvmAddress.fromString(evmAddress)
                : evmAddress;

        const [shardLong, realmLong, num, address] =
            EntityIdHelper.fromEvmAddress(
                shard,
                realm,
                evmAddressObj.toString(),
            );

        return new AccountId(
            shardLong,
            realmLong,
            num,
            undefined,
            address || undefined,
        );
    }

    /**
     * @deprecated - Use `fromEvmAddress` instead
     * @summary Accepts an evm address only as `EvmAddress` type
     * @param {EvmAddress} evmAddress
     * @returns {AccountId}
     */
    static fromEvmPublicAddress(evmAddress) {
        return new AccountId(0, 0, 0, undefined, evmAddress);
    }

    /**
     * @internal
     * @param {HieroProto.proto.IAccountID} id
     * @returns {AccountId}
     */
    static _fromProtobuf(id) {
        let aliasKey = undefined;
        let evmAddress = undefined;

        if (id.alias != null) {
            if (id.alias.length === 20) {
                evmAddress = EvmAddress.fromBytes(id.alias);
            } else {
                aliasKey = Key._fromProtobufKey(
                    HieroProto.proto.Key.decode(id.alias),
                );
            }
        }

        if (!(aliasKey instanceof PublicKey)) {
            aliasKey = undefined;
        }

        return new AccountId(
            id.shardNum != null ? id.shardNum : 0,
            id.realmNum != null ? id.realmNum : 0,
            id.accountNum != null ? id.accountNum : 0,
            aliasKey,
            evmAddress,
        );
    }

    /**
     * @returns {string | null}
     */
    get checksum() {
        return this._checksum;
    }

    /**
     * @returns {?EvmAddress}
     */
    getEvmAddress() {
        return this.evmAddress;
    }

    /**
     * @description Gets the actual `num` field of the `AccountId` from the Mirror Node.
     * Should be used after generating `AccountId.fromEvmAddress()` because it sets the `num` field to `0`
     * automatically since there is no connection between the `num` and the `evmAddress`
     * @param {Client} client
     * @returns {Promise<AccountId>}
     */
    async populateAccountNum(client) {
        if (this.evmAddress === null) {
            throw new Error("field `evmAddress` should not be null");
        }
        const mirrorRestApiBaseUrl = client.mirrorRestApiBaseUrl;

        const url = `${mirrorRestApiBaseUrl}/accounts/${this.evmAddress.toString()}`;

        await new Promise((resolve) => {
            setTimeout(resolve, 3000);
        });

        /* eslint-disable */
        const response = await fetch(url);
        const data = await response.json();
        const mirrorAccountId = data.account;

        this.num = Long.fromString(
            mirrorAccountId.slice(mirrorAccountId.lastIndexOf(".") + 1),
        );
        /* eslint-enable */

        return this;
    }

    /**
     * @description Populates `evmAddress` field of the `AccountId` extracted from the Mirror Node.
     * @param {Client} client
     * @returns {Promise<AccountId>}
     */
    async populateAccountEvmAddress(client) {
        if (this.num === null) {
            throw new Error("field `num` should not be null");
        }
        const mirrorRestApiBaseUrl = client.mirrorRestApiBaseUrl;

        const url = `${mirrorRestApiBaseUrl}/accounts/${this.num.toString()}`;

        await new Promise((resolve) => {
            setTimeout(resolve, 3000);
        });

        /* eslint-disable */
        const response = await fetch(url);
        const data = await response.json();
        const mirrorAccountId = data.evm_address;

        this.evmAddress = EvmAddress.fromString(mirrorAccountId);
        /* eslint-enable */

        return this;
    }

    /**
     * @deprecated - Use `validateChecksum` instead
     * @param {Client} client
     */
    validate(client) {
        console.warn("Deprecated: Use `validateChecksum` instead");
        this.validateChecksum(client);
    }

    /**
     * @param {Client} client
     */
    validateChecksum(client) {
        if (this.aliasKey != null) {
            throw new Error(
                "cannot calculate checksum with an account ID that has a aliasKey",
            );
        }

        EntityIdHelper.validateChecksum(
            this.shard,
            this.realm,
            this.num,
            this._checksum,
            client,
        );
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {AccountId}
     */
    static fromBytes(bytes) {
        return AccountId._fromProtobuf(
            HieroProto.proto.AccountID.decode(bytes),
        );
    }

    /**
     * @deprecated - Use `fromEvmAddress` instead
     * @param {string} address
     * @returns {AccountId}
     */
    static fromSolidityAddress(address) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if (isLongZeroAddress(hex.decode(address))) {
            return new AccountId(
                ...EntityIdHelper.fromSolidityAddress(address),
            );
        } else {
            return this.fromEvmAddress(0, 0, address);
        }
    }

    /**
     * @description Statically compute the EVM address. Use only with non-native EVM accounts.
     * @deprecated - Use `toEvmAddress` instead
     * If the account is EVM-native, the EVM address depends on the public key and is not directly related to the account ID.
     * @returns {string}
     */
    toSolidityAddress() {
        if (this.evmAddress != null) {
            return this.evmAddress.toString();
        } else if (
            this.aliasKey != null &&
            this.aliasKey._key._type == "secp256k1"
        ) {
            return this.aliasKey.toEvmAddress();
        } else {
            return EntityIdHelper.toSolidityAddress([
                this.shard,
                this.realm,
                this.num,
            ]);
        }
    }

    /**
     * @returns {string} EVM-compatible address representation of the entity
     */
    toEvmAddress() {
        if (this.evmAddress != null) {
            return EntityIdHelper.toEvmAddress(this.evmAddress.toBytes());
        }

        return EntityIdHelper.toEvmAddress(this.num);
    }

    //TODO remove the comments after we get to HIP-631
    /**
     * @internal
     * @returns {HieroProto.proto.IAccountID}
     */
    _toProtobuf() {
        let alias = null;
        //let evmAddress = null;

        if (this.aliasKey != null) {
            alias = HieroProto.proto.Key.encode(
                this.aliasKey._toProtobufKey(),
            ).finish();
        } else if (this.evmAddress != null) {
            alias = this.evmAddress._bytes;
        }

        /* if (this.evmAddress != null) {
            evmAddress = this.evmAddress._bytes;
        } */

        const isHollowAccount = this.num.eq(Long.fromBigInt(0n)) && alias;

        if (alias) {
            return {
                alias: isHollowAccount ? alias : null,
                accountNum: isHollowAccount ? null : this.num,
                shardNum: this.shard,
                realmNum: this.realm,
            };
        }
        return {
            alias: null,
            accountNum: this.num,
            shardNum: this.shard,
            realmNum: this.realm,
        };
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.AccountID.encode(this._toProtobuf()).finish();
    }

    /**
     * @returns {string}
     */
    toString() {
        let account = this.num.toString();

        if (this.aliasKey != null) {
            account = this.aliasKey.toString();
        } else if (this.evmAddress != null) {
            account = this.evmAddress.toString();
        }

        return `${this.shard.toString()}.${this.realm.toString()}.${account}`;
    }

    /**
     * @param {Client} client
     * @returns {string}
     */
    toStringWithChecksum(client) {
        if (this.aliasKey != null) {
            throw new Error(
                "cannot calculate checksum with an account ID that has a aliasKey",
            );
        }

        return EntityIdHelper.toStringWithChecksum(this.toString(), client);
    }

    /**
     * @param {this} other
     * @returns {boolean}
     */
    equals(other) {
        let account = false;

        if (this.aliasKey != null && other.aliasKey != null) {
            account = this.aliasKey.equals(other.aliasKey);
        } else if (this.evmAddress != null && other.evmAddress != null) {
            account = this.evmAddress.equals(other.evmAddress);
        } else if (
            this.aliasKey == null &&
            other.aliasKey == null &&
            this.evmAddress == null &&
            other.evmAddress == null
        ) {
            account = this.num.eq(other.num);
        }

        return (
            this.shard.eq(other.shard) && this.realm.eq(other.realm) && account
        );
    }

    /**
     * @returns {AccountId}
     */
    clone() {
        const id = new AccountId(this);
        id._checksum = this._checksum;
        id.aliasKey = this.aliasKey;
        id.evmAddress = this.evmAddress;
        return id;
    }

    /**
     * @param {AccountId} other
     * @returns {number}
     */
    compare(other) {
        let comparison = this.shard.compare(other.shard);
        if (comparison != 0) {
            return comparison;
        }

        comparison = this.realm.compare(other.realm);
        if (comparison != 0) {
            return comparison;
        }

        if (this.aliasKey != null && other.aliasKey != null) {
            const t = this.aliasKey.toString();
            const o = other.aliasKey.toString();

            if (t > o) {
                return 1;
            } else if (t < o) {
                return -1;
            } else {
                return 0;
            }
        } else if (this.evmAddress != null && other.evmAddress != null) {
            const t = this.evmAddress.toString();
            const o = other.evmAddress.toString();

            if (t > o) {
                return 1;
            } else if (t < o) {
                return -1;
            } else {
                return 0;
            }
        } else if (
            this.aliasKey == null &&
            other.aliasKey == null &&
            this.evmAddress == null &&
            other.evmAddress == null
        ) {
            return this.num.compare(other.num);
        } else {
            return 1;
        }
    }
}

CACHE.setAccountIdConstructor(
    (shard, realm, key) => new AccountId(shard, realm, Long.ZERO, key),
);
