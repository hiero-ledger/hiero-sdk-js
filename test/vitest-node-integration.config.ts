import { defineConfig } from "vitest/config";

import path from "path";
import fs from "fs";
import CustomSequencer from "./custom-sequencer.js";

const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        sequence: {
            sequencer: CustomSequencer,
        },
        isolate: false,
        watch: false,
        globals: true,
        environment: "node",
        include: ["test/integration/**/*.js"],
        exclude: [
            "test/integration/client/*",
            "test/integration/resources/*",
            "test/integration/utils/*",
            "test/integration/contents.js",
            "test/integration/dual-mode/**/*.js",
        ],
        hookTimeout: 120000,
        testTimeout: 120000,
        coverage: {
            include: ["src/**/*.js"],
            exclude: [
                "src/transaction/SignatureMapLegacy.js",
                "src/transaction/NodeAccountIdSignatureMapLegacy.js",
                "src/system/SystemDeleteTransaction.js",
                "src/system/SystemUndeleteTransaction.js",
                "src/contract/ContractCreateFlow.js",
                "src/transaction/Transaction.js",
                "src/topic/TopicCreateTransaction.js",
                "src/topic/TopicMessageSubmitTransaction.js",
                "src/topic/TopicId.js",
                "src/token/TokenUpdateTransaction.js",
                "src/token/TokenId.js",
                "src/token/TokenNftInfoQuery.js",
                "src/token/TokenNftsUpdateTransaction.js",
                "src/system/FreezeTransaction.js",
                "src/schedule/ScheduleId.js",
                "src/file/FileId.js",
                "src/contract/StorageChange.js",
                "src/contract/DelegateContractId.js",
                "src/contract/ContractUpdateTransaction.js",
                "src/contract/ContractStateChange.js",
                "src/contract/ContractFunctionResult.js",
                "src/contract/ContractId.js",
                "src/contract/ContractCreateTransaction.js",
                "src/client/NodeClient.js",
                "src/client/ManagedNetwork.js",
                "src/client/Client.js",
                "src/account/TransferTransaction.js",
                "src/account/AccountUpdateTransaction.js",
                "src/account/LiveHashQuery.js",
                "src/account/LiveHashAddTransaction.js",
                "src/account/LiveHashDeleteTransaction.js",
                "src/Wallet.js",
                "src/account/AccountInfo.js",
                "src/account/AccountAllowanceApproveTransaction.js",
                "src/account/AccountId.js",
                "src/account/AccountCreateTransaction.js",
                "src/account/AccountAllowanceAdjustTransaction.js",
            ],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/node-integration",
        },
    },
    define: {
        __SDK_VERSION__: JSON.stringify(pkg.version),
    },
});
