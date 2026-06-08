const { defineConfig } = require("eslint/config");

const globals = require("globals");

const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const deprecation = require("eslint-plugin-deprecation");
const vitest = require("@vitest/eslint-plugin");
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

const baseExtends = [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsdoc/recommended",
    "plugin:import/errors",
    "plugin:import/typescript",
    "plugin:compat/recommended",
];

const srcExtends = [
    ...fixupConfigRules(
        compat.extends(
            ...baseExtends,
            "plugin:@typescript-eslint/recommended-requiring-type-checking",
        ),
    ),
    nodePlugin.configs["flat/recommended"],
];

const testExtends = [
    ...fixupConfigRules(compat.extends(...baseExtends)),
    nodePlugin.configs["flat/recommended"],
];

const sharedRules = {
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
    "jsdoc/escape-inline-tags": "off",
    "jsdoc/require-throws-type": "off",
    "jsdoc/reject-any-type": "off",
    "jsdoc/ts-no-empty-object-type": "off",
    "jsdoc/require-returns": "off",
    "jsdoc/require-param-type": "off",
};

const srcTypeAwareRulesOff = {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
};

const testTypeAwareRulesOff = {
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/no-unused-vars": "off",
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
    "n/no-unsupported-features/node-builtins": "off",
    "jsdoc/*": "off",
    "import/no-unresolved": "off",
};

module.exports = defineConfig([
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

        extends: srcExtends,

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
            ...sharedRules,
            ...srcTypeAwareRulesOff,
            "deprecation/deprecation": "warn",
        },
    },
    {
        files: ["test/unit/**/*.js"],

        plugins: {
            vitest,
            "@typescript-eslint": fixupPluginRules(typescriptEslint),
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

            parser: tsParser,
            ecmaVersion: 6,
            sourceType: "module",

            parserOptions: {
                project: false,
            },
        },

        extends: testExtends,

        rules: {
            ...sharedRules,
            ...testTypeAwareRulesOff,
            "vitest/no-disabled-tests": "error",
        },
    },
]);
