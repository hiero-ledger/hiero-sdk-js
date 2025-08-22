export const decode = (text: string): Uint8Array => {
    const str = text.startsWith("0x") ? text.substring(2) : text;

    if (str.length % 2 !== 0) {
        throw new Error(
            "Invalid hex string: Must have an even number of characters.",
        );
    }

    if (/[^0-9a-fA-F]/.test(str)) {
        throw new Error(
            "Invalid hex string: Contains non-hexadecimal characters.",
        );
    }

    return Buffer.from(str, "hex");
};
