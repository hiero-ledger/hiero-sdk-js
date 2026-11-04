import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: "node",
        include: ["test/unit/node/ClprTckAdapter.js"],
        testTimeout: 120000,
        isolate: true,
    },
});
