const { defineConfig } = require("eslint/config");

const globals = require("globals");

const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const deprecation = require("eslint-plugin-deprecation");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = defineConfig([
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

        extends: fixupConfigRules(
            compat.extends(
                "eslint:recommended",
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                "plugin:jsdoc/recommended",
                "plugin:import/errors",
                "plugin:import/typescript",
                "plugin:n/recommended",
                "plugin:compat/recommended",
            ),
        ),

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
]);
