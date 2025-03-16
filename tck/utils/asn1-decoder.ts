import { isHexKeyList } from "../utils/key";
import { Asn1DecodedKeyResponse } from "../response/asn1-decode";

/**
 * A class to decode ASN.1 encoded data, typically used for parsing cryptographic key data.
 */
class ASN1Decoder {
    private data: Uint8Array;
    private pos: number;
    private oids: string[];
    private oidMap: { [key: string]: string };
    private isPublicKey: boolean;

    constructor(data: Uint8Array | ArrayBuffer) {
        this.data = new Uint8Array(data);
        this.pos = 0;
        this.oids = [];
        this.oidMap = {
            "1.3.132.0.10": "ecdsa",
            "1.3.101.112": "ed25519",
            "1.2.840.10045.2.1": "pubkey",
        };

        this.isPublicKey = false;
    }

    private readLength(): number {
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

    private readType(): number {
        return this.data[this.pos++];
    }

    private readInteger(): { integer: number } {
        const length = this.readLength();
        let value = 0;
        for (let i = 0; i < length; i++) {
            value = (value << 8) | this.data[this.pos++];
        }
        return { integer: value };
    }

    private readOctetString(): { pkey: Uint8Array } {
        const length = this.readLength();
        const value = this.data.slice(this.pos, this.pos + length);
        this.pos += length;
        return { pkey: value };
    }

    private readBitString(): { unusedBits: number; pubkey: Uint8Array } {
        const length = this.readLength();
        const unusedBits = this.data[this.pos++]; // First byte indicates the number of unused bits
        const value = this.data.slice(this.pos, this.pos + length - 1);
        this.pos += length - 1;
        this.isPublicKey = true;
        return { unusedBits, pubkey: value };
    }

    private readObjectIdentifier(): { oid: string } {
        const length = this.readLength();
        const endPos = this.pos + length;
        const oid: number[] = [];
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

    public getOids(): string[] {
        return this.oids;
    }

    public getOidKeyTypes(): string[] {
        return this.oids.map((oid) => this.oidMap[oid] || "unknown");
    }

    private readSequence(): string[] {
        const length = this.readLength();
        const endPos = this.pos + length;
        const items: string[] = []; // this would better be map or obj
        while (this.pos < endPos) {
            items.push(this.read());
        }
        return items;
    }

    public read(): any {
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
                throw new Error("Unsupported type: " + type);
        }
    }

    public isPublicKeyType(): boolean {
        return this.isPublicKey;
    }
}

/**
 * This function processes a hexadecimal string representation of an ASN.1 encoded key. It checks if the input
 * is a list of keys in hexadecimal format. If not, it decodes the ASN.1 data to extract key types and identify
 * if the key is a public key.
 */
export const asn1DecodeStringDer = (
    keyString: string,
): Asn1DecodedKeyResponse => {
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
