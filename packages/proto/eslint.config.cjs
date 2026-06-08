const { defineConfig } = require("eslint/config");

const globals = require("globals");

const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
// eslint-plugin-n v18+ is ESM-only and no longer resolvable through
// FlatCompat's "plugin:n/recommended" string, so consume its flat config
// directly. `.default` unwraps the ESM namespace returned by require().
const nodePlugin = require("eslint-plugin-n").default;
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = defineConfig([
    {
        ignores: ["scripts/**", "src/proto.js"],
    },
    {
        files: ["src/**/*.js"],

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
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
            "jsdoc/check-tag-names": [
                "warn",
                {
                    definedTags: ["internal"],
                },
            ],
        },
    },
]);
