export interface Asn1DecodedKeyResponse {
    readonly keyTypes: string[];
    readonly isPublicKey: boolean;
    readonly isKeyListHex: boolean;
}
