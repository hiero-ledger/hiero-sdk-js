import { proto } from "@hashgraph/proto";
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * A class to decode ASN.1 encoded data, typically used for parsing cryptographic key data.
 * @class
 */
export class ASN1Decoder {
    /**
     * Creates a new ASN1Decoder instance.
     * @param {Uint8Array|ArrayBuffer} data - The ASN.1 encoded data to decode.
     */
    constructor(data) {
        /**
         * @private
         * @type {Uint8Array}
         */
        this.data = new Uint8Array(data);

        /**
         * @private
         * @type {number}
         */
        this.pos = 0;

        /**
         * @private
         * @type {string[]}
         */
        this.oids = [];

        /**
         * @private
         * @type {{[key: string]: string}}
         */
        this.oidMap = {
            "1.3.132.0.10": "ecdsa",
            "1.3.101.112": "ed25519",
            "1.2.840.10045.2.1": "pubkey",
        };

        /**
         * @private
         * @type {boolean}
         */
        this.isPublicKey = false;
    }

    /**
     * Reads the length field from the ASN.1 data.
     * @private
     * @returns {number} The length value.
     */
    readLength() {
        let length = this.data[this.pos++];
        if (length & 0x80) {
            let numBytes = length & 0x7f;
            length = 0;
            for (let i = 0; i < numBytes; i++) {
                length = (length << 8) | this.data[this.pos++];
            }
        }
        return length;
    }

    /**
     * Reads the type field from the ASN.1 data.
     * @private
     * @returns {number} The type value.
     */
    readType() {
        return this.data[this.pos++];
    }

    /**
     * Reads an integer value from the ASN.1 data.
     * @private
     * @returns {{integer: number}} Object containing the integer value.
     */
    readInteger() {
        const length = this.readLength();
        let value = 0;
        for (let i = 0; i < length; i++) {
            value = (value << 8) | this.data[this.pos++];
        }
        return { integer: value };
    }

    /**
     * Reads an octet string from the ASN.1 data.
     * @private
     * @returns {{pkey: Uint8Array}} Object containing the private key data.
     */
    readOctetString() {
        const length = this.readLength();
        const value = this.data.slice(this.pos, this.pos + length);
        this.pos += length;
        return { pkey: value };
    }

    /**
     * Reads a bit string from the ASN.1 data.
     * @private
     * @returns {{unusedBits: number, pubkey: Uint8Array}} Object containing the public key data and unused bits.
     */
    readBitString() {
        const length = this.readLength();
        const unusedBits = this.data[this.pos++]; // First byte indicates the number of unused bits
        const value = this.data.slice(this.pos, this.pos + length - 1);
        this.pos += length - 1;
        return { unusedBits, pubkey: value };
    }

    /**
     * Reads an object identifier from the ASN.1 data.
     * @private
     * @returns {{oid: string}} Object containing the OID as a string.
     */
    readObjectIdentifier() {
        const length = this.readLength();
        const endPos = this.pos + length;
        const oid = [];
        let value = 0;

        // The first byte contains the first two components
        const firstByte = this.data[this.pos++];
        oid.push(Math.floor(firstByte / 40));
        oid.push(firstByte % 40);

        while (this.pos < endPos) {
            const byte = this.data[this.pos++];
            value = (value << 7) | (byte & 0x7f);
            if (!(byte & 0x80)) {
                oid.push(value);
                value = 0;
            }
        }

        const oidStr = oid.join(".");
        this.oids.push(oidStr);
        return { oid: oidStr }; // Return OID as a string
    }

    /**
     * Gets the list of object identifiers found during decoding.
     * @returns {string[]} Array of OID strings.
     */
    getOids() {
        return this.oids;
    }

    /**
     * Gets the key types corresponding to the OIDs found during decoding.
     * @returns {string[]} Array of key type strings.
     */
    getOidKeyTypes() {
        return this.oids.map((oid) => this.oidMap[oid] || "unknown");
    }

    /**
     * Reads a sequence from the ASN.1 data.
     * @private
     * @returns {Array<any>} Array of decoded items in the sequence.
     */
    readSequence() {
        const length = this.readLength();
        const endPos = this.pos + length;
        const items = []; // this would better be map or obj
        while (this.pos < endPos) {
            items.push(this.read());
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return items;
    }

    /**
     * Reads and decodes the next ASN.1 element.
     * @returns {any} The decoded ASN.1 element.
     * @throws {Error} If an unsupported type is encountered.
     */
    read() {
        const type = this.readType();

        switch (type) {
            case 0x02: // INTEGER
                return this.readInteger();
            case 0x03: // BIT STRING FOR PUBKEY
                return this.readBitString();
            case 0x04: // OCTET STRING FOR PKEY
                return this.readOctetString();
            case 0x06: // OBJECT IDENTIFIER FOR CURVE TYPE
                return this.readObjectIdentifier();
            case 0x30: // SEQUENCE
                return this.readSequence();
            case 0xa0: // NODE TAG COULD BE TREATED AS SEQUENCE
                return this.readSequence();
            case 0xa1: // NODE TAG COULD BE TREATED AS SEQUENCE
                return this.readSequence();
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }

    /**
     * Checks if the decoded key is a public key.
     * @returns {boolean} True if the key is a public key, false otherwise.
     */
    isPublicKeyType() {
        return this.isPublicKey;
    }
}

/**
 * Processes a hexadecimal string representation of an ASN.1 encoded key.
 * Checks if the input is a list of keys in hexadecimal format. If not, it decodes
 * the ASN.1 data to extract key types and identify if the key is a public key.
 *
 * @param {string} keyString - The hexadecimal string representation of the ASN.1 encoded key.
 * @returns {{keyTypes: string[], isPublicKey: boolean, isKeyListHex: boolean}} Object containing information about the decoded key.
 */
export const asn1DecodeStringDer = (keyString) => {
    const isKeyListHex = isHexKeyList(keyString);

    if (isKeyListHex) {
        return { keyTypes: [], isPublicKey: false, isKeyListHex };
    }

    const signerData = Uint8Array.from(Buffer.from(keyString, "hex"));
    const decoder = new ASN1Decoder(signerData);

    decoder.read();
    const keyTypes = decoder.getOidKeyTypes();
    const isPublicKey = decoder.isPublicKeyType();

    return {
        keyTypes,
        isPublicKey,
        isKeyListHex: false,
    };
};

/**
 * Checks if the input is a list of keys in hexadecimal format.
 * @param {string} hexString - The hexadecimal string representation of the ASN.1 encoded key.
 * @returns {boolean} True if the key is a public key, false otherwise.
 */
const isHexKeyList = (hexString) => {
    try {
        const binaryData = Buffer.from(hexString, "hex");
        const decodedData = proto.KeyList.decode(binaryData);

        return !!decodedData.keys && Array.isArray(decodedData.keys);
    } catch (error) {
        return false;
    }
};
