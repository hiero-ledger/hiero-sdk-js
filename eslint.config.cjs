const { defineConfig } = require("eslint/config");

const globals = require("globals");

const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const deprecation = require("eslint-plugin-deprecation");
// eslint-plugin-n v18+ is ESM-only and no longer resolvable through
// FlatCompat's "plugin:n/recommended" string, so consume its flat config directly.
const nodePluginModule = require("eslint-plugin-n");
const nodePlugin = nodePluginModule.configs
    ? nodePluginModule
    : nodePluginModule.default;
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = defineConfig([
    {
        ignores: [
            "examples/demo-umd/**",
            "examples/frontend-examples/**",
            "examples/react-native-example/**",
            "examples/react-native-example-legacy/**",
            "examples/simple_rest_signature_provider/**",
            "examples/custom-grpc-web-proxies-network/**",
        ],
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                __SDK_VERSION__: "readonly",
            },

            parser: tsParser,
            ecmaVersion: 6,
            sourceType: "module",

            parserOptions: {
                tsconfigRootDir: __dirname,
                project: ["./tsconfig.json"],
                warnOnUnsupportedTypeScriptVersion: false,
            },
        },

        extends: [
            ...fixupConfigRules(
                compat.extends(
                    "eslint:recommended",
                    "plugin:@typescript-eslint/eslint-recommended",
                    "plugin:@typescript-eslint/recommended",
                    "plugin:@typescript-eslint/recommended-requiring-type-checking",
                    "plugin:jsdoc/recommended",
                    "plugin:import/errors",
                    "plugin:import/typescript",
                    "plugin:compat/recommended",
                ),
            ),
            nodePlugin.configs["flat/recommended"],
        ],

        plugins: {
            "@typescript-eslint": fixupPluginRules(typescriptEslint),
            deprecation: fixupPluginRules(deprecation),
        },

        settings: {
            "import/parsers": {
                "@typescript-eslint/parser": [
                    ".js",
                    ".jsx",
                    ".mjs",
                    ".cjs",
                    ".ts",
                    ".tsx",
                ],
            },
        },

        rules: {
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-empty-function": "off",
            "no-irregular-whitespace": "off",
            "no-process-exit": "off",

            "n/no-unsupported-features/es-syntax": [
                "error",
                {
                    ignores: ["dynamicImport", "modules"],
                },
            ],

            "@typescript-eslint/ban-ts-comment": "off",
            "jsdoc/valid-types": "off",
            "jsdoc/no-undefined-types": "off",
            "jsdoc/require-property-description": "off",
            "jsdoc/require-returns-description": "off",
            "jsdoc/require-param-description": "off",

            "jsdoc/tag-lines": [
                "error" | "warn",
                "any",
                {
                    startLines: 0,
                },
            ],

            "deprecation/deprecation": "warn",
        },
    },
    {
        files: ["examples/**/*.js"],
        languageOptions: {
            parserOptions: {
                project: ["./examples/tsconfig.json"],
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            "n/no-process-exit": "off",
            "jsdoc/require-description": "off",
            "jsdoc/no-blank-block-descriptions": "off",
            "jsdoc/reject-any-type": "off",
            "jsdoc/escape-inline-tags": "off",
        },
    },
]);
