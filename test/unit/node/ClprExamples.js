// SPDX-License-Identifier: Apache-2.0

import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

const root = new URL("../../../", import.meta.url);
const examples = [
    [
        "channel-lifecycle.js",
        [
            "ClprRegisterChannelTransaction",
            "ClprCompleteChannelTransaction",
            "ClprCloseChannelTransaction",
        ],
        ["computeOwnershipCommitment", "setOwnershipProof"],
    ],
    [
        "connector-lifecycle.js",
        [
            "ClprRegisterConnectorTransaction",
            "ClprCompleteConnectorTransaction",
            "ClprDeregisterConnectorTransaction",
        ],
        [
            "computeConnectorId",
            "computeOwnershipCommitment",
            "setOwnershipProof",
            "setStakeRecipient",
        ],
    ],
    [
        "update-ledger-configuration.js",
        [
            "ClprGetLedgerConfigurationQuery",
            "ClprThrottles",
            "ClprUpdateLedgerConfigurationTransaction",
        ],
        ["of", "setThrottles"],
    ],
    ["get-ledger-configuration.js", ["ClprGetLedgerConfigurationQuery"], []],
    ["get-endpoint-manifest.js", ["ClprGetEndpointManifestQuery"], []],
];

describe("CLPR example recipes", function () {
    it.each(examples)(
        "ships %s using the public SDK API",
        function (name, names, methods) {
            const path = new URL(`examples/clpr/${name}`, root);
            expect(existsSync(path), `Missing CLPR example: ${name}`).toBe(
                true,
            );
            const source = readFileSync(path, "utf8");
            const file = ts.createSourceFile(
                name,
                source,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.JS,
            );
            const imports = file.statements.filter(ts.isImportDeclaration);
            const sdkImports = imports.filter(
                (node) => node.moduleSpecifier.text === "@hiero-ledger/sdk",
            );
            const publicNames = sdkImports.flatMap(
                (node) =>
                    node.importClause?.namedBindings?.elements?.map(
                        (element) =>
                            element.propertyName?.text ?? element.name.text,
                    ) ?? [],
            );

            expect(publicNames).toEqual(expect.arrayContaining(names));
            for (const node of imports) {
                expect(node.moduleSpecifier.text).not.toMatch(
                    /(?:^|\/)src\/|@hiero-ledger\/proto/,
                );
            }

            const calls = [];
            function visit(node) {
                if (
                    ts.isCallExpression(node) &&
                    ts.isPropertyAccessExpression(node.expression)
                ) {
                    calls.push(node.expression.name.text);
                }
                ts.forEachChild(node, visit);
            }
            visit(file);
            expect(calls).toEqual(expect.arrayContaining(methods));
            expect(calls).toContain("execute");
            expect(calls).toContain("close");
            if (name.includes("lifecycle") || name.startsWith("update-")) {
                expect(calls).toContain("getReceipt");
            }
        },
    );

    it.each(examples)(
        "documents the network prerequisites in the %s header",
        function (name) {
            const path = new URL(`examples/clpr/${name}`, root);
            expect(existsSync(path), `Missing CLPR example: ${name}`).toBe(
                true,
            );
            const source = readFileSync(path, "utf8");
            const header = source.slice(0, source.search(/^\s*import\s/m));

            expect(header).toContain("clpr.enabled");
            expect(header).toMatch(/treasury|system[ -]admin/i);
            expect(header).toMatch(/key/i);
            expect(header).toMatch(/deploy[\s\S]*verifier/i);
            expect(header).toMatch(/Connector[\s\S]*contract/i);
            expect(header).toMatch(/real[\s\S]*proof/i);
        },
    );

    it("excludes CLPR examples from the Solo example runner", function () {
        const source = ts.createSourceFile(
            "run-all-examples.js",
            readFileSync(new URL("examples/run-all-examples.js", root), "utf8"),
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.JS,
        );
        const declarations = source.statements
            .filter(ts.isVariableStatement)
            .flatMap((node) => node.declarationList.declarations);
        const exclusions = declarations.find(
            (node) => node.name.getText(source) === "excludedDirectories",
        );

        expect(exclusions).toBeDefined();
        expect(
            exclusions.initializer.elements.map((node) => node.text),
        ).toContain("./clpr");
    });
});
