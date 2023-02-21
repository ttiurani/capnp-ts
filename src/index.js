"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileAll = exports.run = exports.main = void 0;
const tslib_1 = require("tslib");
const capnp = tslib_1.__importStar(require("capnp-ts"));
const s = tslib_1.__importStar(require("capnp-ts/src/std/schema.capnp.js"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const fs = tslib_1.__importStar(require("fs"));
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const compiler_1 = require("./compiler");
const E = tslib_1.__importStar(require("./errors"));
const trace = (0, debug_1.default)("capnpc");
trace("load");
/**
 * The equivalent of tsconfig.json used when compiling the emitted .ts file to .js.
 *
 * The output of this tool should aim to be readable, documented javascript
 * for the developers consuming it. They can (and probably already do) transpile
 * the JS further to meet whatever ES version / module system / minification
 * needs they have.
 */
const COMPILE_OPTIONS = {
    declaration: true,
    module: typescript_1.default.ModuleKind.None,
    moduleResolution: typescript_1.default.ModuleResolutionKind.NodeJs,
    noEmitOnError: false,
    noFallthroughCasesInSwitch: true,
    noImplicitReturns: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    preserveConstEnums: true,
    removeComments: false,
    skipLibCheck: true,
    sourceMap: false,
    strict: true,
    stripInternal: true,
    target: typescript_1.default.ScriptTarget.ES2015,
};
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const ctx = yield run();
            transpileAll(ctx);
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
    });
}
exports.main = main;
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const chunks = [];
        process.stdin.on("data", (chunk) => {
            trace("reading data chunk (%d bytes)", chunk.byteLength);
            chunks.push(chunk);
        });
        yield new Promise((resolve) => {
            process.stdin.on("end", resolve);
        });
        const reqBuffer = Buffer.alloc(chunks.reduce((l, chunk) => l + chunk.byteLength, 0));
        let i = 0;
        chunks.forEach((chunk) => {
            chunk.copy(reqBuffer, i);
            i += chunk.byteLength;
        });
        trace("reqBuffer (length: %d)", reqBuffer.length, reqBuffer);
        const message = new capnp.Message(reqBuffer, false);
        trace("message: %s", message.dump());
        const req = message.getRoot(s.CodeGeneratorRequest);
        trace("%s", req);
        const ctx = (0, compiler_1.loadRequest)(req);
        (0, compiler_1.writeTsFiles)(ctx);
        return ctx;
    });
}
exports.run = run;
function transpileAll(ctx) {
    trace("transpileAll()", ctx.files);
    const tsFilePaths = ctx.files.map((f) => f.tsPath);
    const program = typescript_1.default.createProgram(tsFilePaths, COMPILE_OPTIONS);
    const emitResult = program.emit();
    if (emitResult.diagnostics.every((d) => d.category !== typescript_1.default.DiagnosticCategory.Error ||
        // "Cannot find module" errors are typically only temporary and will reappear quickly if it's an actual problem.
        typescript_1.default.flattenDiagnosticMessageText(d.messageText, "\n").includes("Cannot find module"))) {
        trace("emit succeeded");
        tsFilePaths.forEach(fs.unlinkSync);
    }
    else {
        trace("emit failed");
        const allDiagnostics = typescript_1.default.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        allDiagnostics.forEach((diagnostic) => {
            const message = typescript_1.default.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file && diagnostic.start) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                /* tslint:disable-next-line:no-console */
                console.log(`${diagnostic.file.fileName}:${line + 1}:${character + 1} ${message}`);
            }
            else {
                /* tslint:disable-next-line:no-console */
                console.log(`==> ${message}`);
            }
        });
        throw new Error(E.GEN_TS_EMIT_FAILED);
    }
}
exports.transpileAll = transpileAll;
//# sourceMappingURL=index.js.map