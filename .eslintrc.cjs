module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    globals: {
        __SDK_VERSION__: "readonly",
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:jsdoc/recommended",
        "plugin:import/errors",
        "plugin:import/typescript",
        "plugin:n/recommended",
        "plugin:compat/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
        ecmaVersion: 6,
        sourceType: "module",
        warnOnUnsupportedTypeScriptVersion: false,
    },
    plugins: ["@typescript-eslint", "deprecation", "ie11"],
    rules: {
        // does not handle return types being annotated in a type comment
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-empty-function": "off",
        "no-irregular-whitespace": "off",
        "no-process-exit": "off",

        // allow import syntax as we compile that away with babel for node
        "n/no-unsupported-features/es-syntax": [
            "error",
            {
                ignores: ["dynamicImport", "modules"],
            },
        ],

        // sometimes we need this with jsdoc typing
        "@typescript-eslint/ban-ts-comment": "off",

        // some typescript type productions do not parse
        "jsdoc/valid-types": "off",
        "jsdoc/no-undefined-types": "off",

        // opt-out of providing descriptions for params, returns, and property
        "jsdoc/require-property-description": "off",
        "jsdoc/require-returns-description": "off",
        "jsdoc/require-param-description": "off",
        "jsdoc/tag-lines": ["error" | "warn", "any", { startLines: 0 }],
        "jsdoc/check-tag-names": [
            "warn",
            {
                definedTags: ["internal", "beta"],
            },
        ],

        // reports usage of deprecated code
        // <https://github.com/gund/eslint-plugin-deprecation>
        "deprecation/deprecation": "warn",

        // detecting unsupported ES6 features in IE11
        "ie11/no-collection-args": "error",
        "ie11/no-for-in-const": "error",
        "ie11/no-loop-func": "warn",
        "ie11/no-weak-collections": "error",
    },
};
