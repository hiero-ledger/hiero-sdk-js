// SPDX-License-Identifier: Apache-2.0

import { fileURLToPath } from "node:url";
import ts from "typescript";

describe("CLPR public declarations", function () {
    it("allows a TypeScript consumer to import all 16 names through lib/index.d.ts", function () {
        const fixture = fileURLToPath(
            new URL("../utils/ClprPublicApi.ts", import.meta.url),
        );
        const program = ts.createProgram([fixture], {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.NodeNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            noEmit: true,
            strict: true,
            skipLibCheck: true,
        });
        const diagnostics = ts.getPreEmitDiagnostics(program);
        const output = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: (path) => path,
            getNewLine: () => "\n",
        });

        expect(diagnostics, output).toEqual([]);
    });
});
