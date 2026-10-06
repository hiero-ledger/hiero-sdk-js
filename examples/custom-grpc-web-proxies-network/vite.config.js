import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        include: [
            "@hiero-ledger/sdk > @hiero-ledger/proto",
            "@hiero-ledger/sdk > @hiero-ledger/cryptography",
        ],
    },
});
