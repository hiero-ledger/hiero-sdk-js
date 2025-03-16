import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import ie11 from "eslint-plugin-ie11";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...fixupConfigRules(
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
    {
        plugins: {
            "@typescript-eslint": fixupPluginRules(typescriptEslint),
            ie11,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },

            parser: tsParser,
            ecmaVersion: 6,
            sourceType: "module",

            parserOptions: {
                project: ["./tsconfig.json"],
                warnOnUnsupportedTypeScriptVersion: false,
            },
        },

        rules: {
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-empty-function": "off",

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
            "ie11/no-collection-args": "error",
            "ie11/no-for-in-const": "error",
            "ie11/no-loop-func": "warn",
            "ie11/no-weak-collections": "error",
        },
    },
];
