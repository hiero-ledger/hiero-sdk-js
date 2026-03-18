import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");
/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: monorepoRoot,
    turbopack: {
        root: monorepoRoot,
    },
};

export default nextConfig;
