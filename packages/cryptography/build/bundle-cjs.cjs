// Produces the CommonJS artifact (lib/index.cjs) consumed via the package's
// `require` export. @noble/* and @scure/* are ESM-only from v2 onward, so they
// cannot be require()d from a per-file transpile on Node <20.19; bundling them
// into the artifact keeps the CJS entry working on every supported Node
// version. All other dependencies stay external and resolve from node_modules.
const esbuild = require("esbuild");

const BUNDLED_DEPS = /^(@noble|@scure)\//;

esbuild
    .build({
        entryPoints: ["src/index.js"],
        outfile: "lib/index.cjs",
        bundle: true,
        format: "cjs",
        platform: "node",
        // Build the CJS artifact for node18: the inlined @noble/@scure code
        // runs there, so the CommonJS entry stays usable across a broad range
        // even though the package's ESM entry (via @noble v2) requires a newer
        // Node — see "engines" in package.json.
        target: "node18",
        logLevel: "info",
        plugins: [
            {
                name: "external-except-esm-only",
                setup(build) {
                    build.onResolve({ filter: /^[^./]/ }, (args) => {
                        if (BUNDLED_DEPS.test(args.path)) {
                            return null;
                        }
                        return { path: args.path, external: true };
                    });
                },
            },
        ],
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
