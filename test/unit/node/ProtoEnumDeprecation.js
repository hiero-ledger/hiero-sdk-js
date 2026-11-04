import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import ts from "typescript";

const PROTO_PACKAGE = new URL("../../../packages/proto/", import.meta.url);
const requireProto = createRequire(new URL("package.json", PROTO_PACKAGE));
const protobuf = requireProto("protobufjs");
const generate = promisify(requireProto("protobufjs-cli/pbjs.js").generate);
const declarations = promisify(requireProto("protobufjs-cli/pbts.js").process);

function enumDeclarations(text) {
    const source = ts.createSourceFile(
        "proto.d.ts",
        text,
        ts.ScriptTarget.Latest,
        true,
    );
    const enums = [];

    function visit(node) {
        if (ts.isEnumDeclaration(node)) {
            enums.push(node);
        }
        ts.forEachChild(node, visit);
    }

    visit(source);
    return enums;
}

describe.each(["src", "lib"])("Proto enum deprecation (%s)", function (dir) {
    let responseCode;

    beforeAll(function () {
        const path = new URL(
            `../../../packages/proto/${dir}/proto.d.ts`,
            import.meta.url,
        );
        const enums = enumDeclarations(readFileSync(path, "utf8"));
        responseCode = enums.find(
            (node) => node.name.text === "ResponseCodeEnum",
        );
        expect(responseCode).toBeDefined();
    });

    it("does not deprecate ResponseCodeEnum for a deprecated value", function () {
        expect(Boolean(ts.getJSDocDeprecatedTag(responseCode))).toBe(false);
    });

    it("keeps the replacement notice on CLPR_EMPTY_BUNDLE", function () {
        const value = responseCode.members.find(
            (member) => member.name.text === "CLPR_EMPTY_BUNDLE",
        );

        expect(value).toBeDefined();
        expect(ts.getJSDocDeprecatedTag(value)?.comment).toBe(
            "Use CLPR_NO_PROGRESS instead.",
        );
    });
});

describe("Proto enum comment generation", function () {
    it("preserves member tags and genuine enum tags across namespaces", async function () {
        const root = protobuf.parse(`
            syntax = "proto3";
            package sample;

            /** A current enum. */
            enum State {
                /** A current value. */
                CURRENT = 0;
                /**
                 * An old value.
                 * @deprecated Use CURRENT instead.
                 */
                OLD = 1 [deprecated = true];
                /** @deprecated */
                ANCIENT = 2 [deprecated = true];
                /** A later current value. */
                NEXT = 3;
            }

            message Container {
                /** A nested enum with the same name. */
                enum State {
                    /** A nested current value. */
                    CURRENT = 0;
                    /** @deprecated Use the nested CURRENT instead. */
                    OLD = 1 [deprecated = true];
                }
            }

            /** @deprecated Use State instead. */
            enum Legacy {
                option deprecated = true;
                /** An available value of the deprecated enum. */
                CURRENT = 0;
                /** @deprecated Use CURRENT instead. */
                OLD = 1 [deprecated = true];
            }
        `).root;
        const javascript = await generate(root, {
            target: fileURLToPath(
                new URL("scripts/static-module.cjs", PROTO_PACKAGE),
            ),
            wrap: "es6",
            root: "hashgraph",
        });
        const types = await declarations(javascript, ["-n", "hashgraph"]);
        const temp = mkdtempSync(new URL(".enum-comments-", PROTO_PACKAGE));

        try {
            const path = `${temp}/proto.d.ts`;
            writeFileSync(path, types);
            execFileSync(process.execPath, [
                fileURLToPath(
                    new URL("scripts/fix-proto-namespaces.js", PROTO_PACKAGE),
                ),
                path,
            ]);
            const enums = enumDeclarations(readFileSync(path, "utf8"));
            const states = enums.filter((node) => node.name.text === "State");
            const legacy = enums.find((node) => node.name.text === "Legacy");

            expect(states).toHaveLength(2);
            expect(
                states.map(
                    (state) => ts.getJSDocCommentsAndTags(state)[0].comment,
                ),
            ).toEqual(["A current enum.", "A nested enum with the same name."]);
            for (const state of states) {
                expect(Boolean(ts.getJSDocDeprecatedTag(state))).toBe(false);
                const current = state.members.find(
                    (member) => member.name.text === "CURRENT",
                );
                expect(Boolean(ts.getJSDocDeprecatedTag(current))).toBe(false);
            }
            const deprecatedValues = enums.flatMap((node) =>
                node.members
                    .filter((member) => ts.getJSDocDeprecatedTag(member))
                    .map((member) => [
                        member.name.text,
                        ts.getJSDocDeprecatedTag(member).comment,
                    ]),
            );
            expect(deprecatedValues).toEqual([
                ["OLD", "Use CURRENT instead."],
                ["ANCIENT", undefined],
                ["OLD", "Use the nested CURRENT instead."],
                ["OLD", "Use CURRENT instead."],
            ]);
            expect(ts.getJSDocDeprecatedTag(legacy)?.comment).toBe(
                "Use State instead.",
            );
        } finally {
            rmSync(temp, { recursive: true, force: true });
        }
    });
});
