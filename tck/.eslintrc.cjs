module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "@typescript-eslint/eslint-recommended",
        "@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
        ecmaVersion: 6,
        sourceType: "module",
        warnOnUnsupportedTypeScriptVersion: false,
    },
    plugins: ["@typescript-eslint"],
    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-empty-function": "off",
        "no-irregular-whitespace": "off",
        "no-process-exit": "off",
        "@typescript-eslint/ban-ts-comment": "off",
    },
};
