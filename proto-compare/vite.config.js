import { defineConfig } from "vite";

// @hiero-ledger/proto ships as CJS (lib/index.js).  Vite hoists workspace
// packages past the default node_modules-only commonjs boundary, so we have
// to opt it in explicitly for both dev (optimizeDeps) and build
// (commonjsOptions).
export default defineConfig({
    server: { port: 5173 },
    optimizeDeps: {
        include: ["@hiero-ledger/proto"],
    },
    build: {
        outDir: "dist",
        sourcemap: false,
        commonjsOptions: {
            include: [/node_modules/, /packages\/proto\/lib/],
            transformMixedEsModules: true,
        },
    },
});
