import terser from "@rollup/plugin-terser";

export default [
    {
        input: "src/index.js",
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
            plugins: [terser()],
        },
    },
];
