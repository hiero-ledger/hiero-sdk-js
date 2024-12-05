import Long from "long";
import * as hex from "./encoding/hex.js";
import BadEntityIdError from "./BadEntityIdError.js";
import * as util from "./util.js";

/**
 * @typedef {import("./client/Client.js").default<*, *>} Client
 */

/**
 * @typedef {object} IEntityId
 * @property {number | Long} num
 * @property {(number | Long)=} shard
 * @property {(number | Long)=} realm
 */

/**
 * @typedef {object} IEntityIdResult
 * @property {Long} shard
 * @property {Long} realm
 * @property {Long} num
 */

/**
 * @typedef {object} IEntityIdResultWithChecksum
 * @property {Long} shard
 * @property {Long} realm
 * @property {Long} num
 * @property {string | null} checksum
 */

const regex = RegExp(
    "^(0|(?:[1-9]\\d*))\\.(0|(?:[1-9]\\d*))\\.(0|(?:[1-9]\\d*))(?:-([a-z]{5}))?$"
);

/**
 * @param {number | Long | IEntityId} props
 * @param {(number | null | Long)=} realm
 * @param {(number | null | Long)=} num
 * @returns {IEntityIdResult}
 */
export function constructor(props, realm, num) {
    let shard_ = Long.ZERO;
    let realm_ = Long.ZERO;
    let num_ = Long.ZERO;

    if (typeof props === "number" || Long.isLong(props)) {
        if (realm == null || typeof realm === "string") {
            num_ = Long.fromValue(props);
        } else {
            shard_ = Long.fromValue(props);
            realm_ = Long.fromValue(realm);
            num_ = num != null ? Long.fromValue(num) : Long.ZERO;
        }
    } else {
        shard_ = Long.fromValue(props.shard != null ? props.shard : 0);
        realm_ = Long.fromValue(props.realm != null ? props.realm : 0);
        num_ = Long.fromValue(props.num != null ? props.num : 0);
    }

    if (shard_.isNegative() || realm_.isNegative() || num_.isNegative()) {
        throw new Error("negative numbers are not allowed in IDs");
    }

    return {
        shard: shard_,
        realm: realm_,
        num: num_,
    };
}

/**
 * @param {[Long, Long, Long]} a
 * @param {[Long, Long, Long]} b
 * @returns {number}
 */
export function compare(a, b) {
    let comparison = a[0].compare(b[0]);
    if (comparison != 0) {
        return comparison;
    }

    comparison = a[1].compare(b[1]);
    if (comparison != 0) {
        return comparison;
    }

    return a[2].compare(b[2]);
}

/**
 * @typedef {object} ParseAddressResult
 * @property {number} status
 * @property {Long} [num1]
 * @property {Long} [num2]
 * @property {Long} [num3]
 * @property {string} [correctChecksum]
 * @property {string} [givenChecksum]
 * @property {string} [noChecksumFormat]
 * @property {string} [withChecksumFormat]
 */

/**
 * @param {string} text
 * @returns {IEntityIdResultWithChecksum}
 */
export function fromString(text) {
    const [id, checksum] = text.split("-");
    const parts = id.split(".");

    for (const part of parts) {
        if (part === "") {
            throw new Error("invalid format for entity ID");
        }
    }

    const components = parts.map(Number);

    for (const component of components) {
        if (Number.isNaN(component)) {
            throw new Error("invalid format for entity ID");
        }
    }

    let shard = Long.ZERO;
    let realm = Long.ZERO;
    let num;

    if (components.length === 1) {
        num = Long.fromNumber(components[0]);
    } else if (components.length === 3) {
        shard = Long.fromNumber(components[0]);
        realm = Long.fromNumber(components[1]);
        num = Long.fromNumber(components[2]);
    } else {
        throw new Error("invalid format for entity ID");
    }

    return {
        shard,
        realm,
        num,
        checksum,
    };
}

/**
 * @param {string} address
 * @returns {[Long, Long, Long]}
 */
export function fromSolidityAddress(address) {
    const addr = address.startsWith("0x")
        ? hex.decode(address.slice(2))
        : hex.decode(address);

    if (addr.length !== 20) {
        throw new Error(`Invalid hex encoded solidity address length:
                expected length 40, got length ${address.length}`);
    }

    const shard = Long.fromBytesBE([0, 0, 0, 0, ...addr.slice(0, 4)]);
    const realm = Long.fromBytesBE(Array.from(addr.slice(4, 12)));
    const num = Long.fromBytesBE(Array.from(addr.slice(12, 20)));

    return [shard, realm, num];
}

/**
 * @param {[Long,Long,Long] | [number,number,number]} address
 * @returns {string}
 */
export function toSolidityAddress(address) {
    const buffer = new Uint8Array(20);
    const view = util.safeView(buffer);
    const [shard, realm, num] = address;

    view.setUint32(0, util.convertToNumber(shard));
    view.setUint32(8, util.convertToNumber(realm));
    view.setUint32(16, util.convertToNumber(num));

    return hex.encode(buffer);
}

/**
 * Parse the address string addr and return an object with the results (8 fields).
 * The first four fields are numbers, which could be implemented as signed 32 bit
 * integers, and the last four are strings.
 *
 *   status;  //the status of the parsed address
 *            //   0 = syntax error
 *            //   1 = an invalid with-checksum address (bad checksum)
 *            //   2 = a valid no-checksum address
 *            //   3 = a valid with-checksum address
 *   num1;    //the 3 numbers in the address, such as 1.2.3, with leading zeros removed
 *   num2;
 *   num3;
 *   correctchecksum;    //the correct checksum
 *   givenChecksum;      //the checksum in the address that was parsed
 *   noChecksumFormat;   //the address in no-checksum format
 *   withChecksumFormat; //the address in with-checksum format
 *
 * @param {string} ledgerId
 * @param {string} addr
 * @returns {ParseAddressResult}
 */
export function _parseAddress(ledgerId, addr) {
    let match = regex.exec(addr);
    if (match === null) {
        let result = { status: 0 }; // When status == 0, the rest of the fields should be ignored
        return result;
    }
    let a = [
        Long.fromString(match[1]),
        Long.fromString(match[2]),
        Long.fromString(match[3]),
    ];
    let ad = `${a[0].toString()}.${a[1].toString()}.${a[2].toString()}`;
    let c = _checksum(ledgerId, ad);
    let s = match[4] === undefined ? 2 : c == match[4] ? 3 : 1; //the status
    let result = {
        status: s,
        num1: a[0],
        num2: a[1],
        num3: a[2],
        givenChecksum: match[4],
        correctChecksum: c,
        noChecksumFormat: ad,
        withChecksumFormat: `${ad}-${c}`,
    };
    return result;
}

/**
 * Given an address like "0.0.123", return a checksum like "laujm"
 *
 * @param {string} ledgerId
 * @param {string} addr
 * @returns {string}
 */
export function _checksum(ledgerId, addr) {
    let answer = "";
    let d = []; // Digits with 10 for ".", so if addr == "0.0.123" then d == [0, 10, 0, 10, 1, 2, 3]
    let s0 = 0; // Sum of even positions (mod 11)
    let s1 = 0; // Sum of odd positions (mod 11)
    let s = 0; // Weighted sum of all positions (mod p3)
    let sh = 0; // Hash of the ledger ID
    let c = 0; // The checksum, as a single number
    const p3 = 26 * 26 * 26; // 3 digits in base 26
    const p5 = 26 * 26 * 26 * 26 * 26; // 5 digits in base 26
    const ascii_a = "a".charCodeAt(0); // 97
    const m = 1000003; // Min prime greater than a million. Used for the final permutation.
    const w = 31; // Sum s of digit values weights them by powers of w. Should be coprime to p5.

    let id = ledgerId + "000000000000";
    let h = [];
    for (var i = 0; i < id.length; i += 2) {
        h.push(parseInt(id.substring(i, i + 2), 16));
    }
    for (let i = 0; i < addr.length; i++) {
        d.push(addr[i] === "." ? 10 : parseInt(addr[i], 10));
    }
    for (let i = 0; i < d.length; i++) {
        s = (w * s + d[i]) % p3;
        if (i % 2 === 0) {
            s0 = (s0 + d[i]) % 11;
        } else {
            s1 = (s1 + d[i]) % 11;
        }
    }
    for (let i = 0; i < h.length; i++) {
        sh = (w * sh + h[i]) % p5;
    }
    c = ((((addr.length % 5) * 11 + s0) * 11 + s1) * p3 + s + sh) % p5;
    c = (c * m) % p5;

    for (let i = 0; i < 5; i++) {
        answer = String.fromCharCode(ascii_a + (c % 26)) + answer;
        c /= 26;
    }

    return answer;
}

/**
 * @param {Long} shard
 * @param {Long} realm
 * @param {Long} num
 * @param {string | null} checksum
 * @param {Client} client
 */
export function validateChecksum(shard, realm, num, checksum, client) {
    if (client._network._ledgerId == null || checksum == null) {
        return;
    }

    const expectedChecksum = _checksum(
        client._network._ledgerId,
        `${shard.toString()}.${realm.toString()}.${num.toString()}`
    );

    if (checksum != expectedChecksum) {
        throw new BadEntityIdError(
            shard,
            realm,
            num,
            checksum,
            expectedChecksum
        );
    }
}

/**
 * @param {string} string
 * @param {Client} client
 * @returns {string}
 */
export function toStringWithChecksum(string, client) {
    if (client == null) {
        throw new Error("client cannot be null");
    }
    
    if (client._network._ledgerId == null) {
        throw new Error(
            "cannot calculate checksum with a client that does not contain a recognzied ledger ID"
        );
    }

    const checksum = _checksum(client._network._ledgerId, string);

    return `${string}-${checksum}`;
}
