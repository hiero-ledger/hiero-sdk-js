// Produces the CommonJS artifact (lib/index.cjs) consumed via the package's
// `require` export. A dependency that ships only ES modules cannot be
// require()d on Node <20.19, so it is inlined into the artifact, which keeps
// the CJS entry working on every supported Node version. That list used to be
// written by hand and broke whenever a dependency went ESM-only (noble-curves
// v2 in #4259, asn1js 4 in #4615), so each import is now checked the way
// require() would load it: a dependency is inlined when CommonJS resolution
// cannot find it (no `require` export) or finds an ES module (`.mjs`, or `.js`
// under a `"type": "module"` package.json). All other dependencies stay
// external and resolve from node_modules.
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { createRequire, isBuiltin } = require("module");

/**
 * Whether Node loads `file` as an ES module.
 * @param {string} file
 * @returns {boolean}
 */
function isEsModule(file) {
    if (file.endsWith(".mjs")) return true;
    if (file.endsWith(".cjs")) return false;
    for (let dir = path.dirname(file); ; dir = path.dirname(dir)) {
        const manifest = path.join(dir, "package.json");
        if (fs.existsSync(manifest)) {
            const { type } = JSON.parse(fs.readFileSync(manifest, "utf8"));
            return type === "module";
        }
        if (path.dirname(dir) === dir) return false;
    }
}

/**
 * Whether `require(specifier)` in `importer` loads a CommonJS module.
 * @param {string} specifier
 * @param {string} importer
 * @returns {boolean}
 */
function isRequirable(specifier, importer) {
    try {
        return !isEsModule(createRequire(importer).resolve(specifier));
    } catch {
        return false;
    }
}

/**
 * @param {string} specifier
 * @returns {string}
 */
function packageName(specifier) {
    const parts = specifier.split("/");
    return parts.slice(0, specifier.startsWith("@") ? 2 : 1).join("/");
}

const inlined = new Set();

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
                        if (args.kind === "entry-point") {
                            return null;
                        }
                        if (
                            !isBuiltin(args.path) &&
                            !isRequirable(args.path, args.importer)
                        ) {
                            inlined.add(packageName(args.path));
                            return null;
                        }
                        return { path: args.path, external: true };
                    });
                    build.onEnd(() => {
                        const names = [...inlined].sort().join(", ") || "none";
                        console.log(`Inlined ESM-only dependencies: ${names}`);
                    });
                },
            },
        ],
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
