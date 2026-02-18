/**
 * Minimal DOM ambient declarations for browser-only code paths.
 * Avoids pulling in full lib.dom.d.ts which conflicts with @types/node
 * (TextEncoder/TextDecoder ArrayBufferLike vs NonSharedUint8Array).
 */
declare global {
    interface Window {
        crypto: {
            subtle: {
                digest(
                    algorithm: string,
                    data: ArrayBuffer | ArrayBufferView
                ): Promise<ArrayBuffer>;
            };
        };
    }
    var window: Window;

    class FileReader {
        readAsDataURL(blob: Blob): void;
        onloadend: (() => void) | null;
        onerror: ((ev: Event) => void) | null;
        result: string | ArrayBuffer | null;
    }

    interface Blob {}
}

export {};
