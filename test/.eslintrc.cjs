module.exports = {
    root: true,
    plugins: ["vitest"],
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    parser: "@babel/eslint-parser",
    extends: ["eslint:recommended", "plugin:vitest/recommended"],
    globals: {
        expect: "readonly",
        describe: "readonly",
        it: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
    },
    rules: {
        "vitest/valid-expect": "off",
        "vitest/expect-expect": "off",
        "vitest/valid-title": "off",
        "vitest/no-disabled-tests": "warn",
    },
};
