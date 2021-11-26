declare module 'browserify-aes' {
    export { createCipheriv, createDecipheriv } from 'crypto';
}

declare module 'pbkdf2' {
    // 3.0.x
    export function pbkdf2(password: string | Buffer, salt: string | Buffer, iterations: number, keylen: number, digest: string, callback: (err: Error, derivedKey: Buffer) => void): void;
}
