const { defineConfig } = require("eslint/config");

const globals = require("globals");

const vitest = require("@vitest/eslint-plugin");

module.exports = defineConfig([
    {
        plugins: {
            vitest,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                describe: "readonly",
                it: "readonly",
                expect: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
            },
            parserOptions: {
                project: false,
            },
        },
        rules: {
            "vitest/no-disabled-tests": "error",
            "@typescript-eslint/await-thenable": "off",
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/no-for-in-array": "off",
            "@typescript-eslint/no-implied-eval": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/restrict-plus-operands": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/unbound-method": "off",
            "deprecation/deprecation": "off",
            "n/no-unsupported-features/node-builtins": "off",
            "jsdoc/*": "off",
            "import/no-unresolved": "off",
        },
    },
]);
