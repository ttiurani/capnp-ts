"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTsFiles = exports.printSourceFiles = exports.loadRequest = exports.compile = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
const path_1 = tslib_1.__importDefault(require("path"));
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const code_generator_context_1 = require("./code-generator-context");
const constants_1 = require("./constants");
const file_1 = require("./file");
const generators_1 = require("./generators");
const trace = (0, debug_1.default)("capnpc:compile");
trace("load");
function compile(ctx) {
    (0, generators_1.generateCapnpImport)(ctx);
    (0, generators_1.generateNestedImports)(ctx);
    (0, generators_1.generateFileId)(ctx);
    (0, file_1.lookupNode)(ctx, ctx.file)
        .getNestedNodes()
        .map((n) => (0, file_1.lookupNode)(ctx, n))
        .forEach((n) => (0, generators_1.generateNode)(ctx, n));
    ctx.concreteLists.forEach(([fullClassName, field]) => (0, generators_1.generateConcreteListInitializer)(ctx, fullClassName, field));
    const sourceFile = typescript_1.default.createSourceFile(ctx.tsPath, "", typescript_1.default.ScriptTarget.Latest, false, typescript_1.default.ScriptKind.TS);
    const printer = typescript_1.default.createPrinter();
    const source = ctx.statements.map((s) => printer.printNode(typescript_1.default.EmitHint.Unspecified, s, sourceFile)).join("\n") + "\n";
    return constants_1.SOURCE_COMMENT + source;
}
exports.compile = compile;
function loadRequest(req) {
    trace("loadRequest(%s)", req);
    const ctx = new code_generator_context_1.CodeGeneratorContext();
    ctx.files = req.getRequestedFiles().map((file) => (0, file_1.loadRequestedFile)(req, file));
    return ctx;
}
exports.loadRequest = loadRequest;
function printSourceFiles(ctx) {
    trace("printSourceFiles()");
    return ctx.files.map(compile);
}
exports.printSourceFiles = printSourceFiles;
function writeTsFiles(ctx) {
    trace("writeTsFiles()");
    ctx.files.forEach((f) => {
        trace("writing %s", f.tsPath);
        mkdirp_1.default.sync(path_1.default.dirname(f.tsPath));
        fs_1.default.writeFileSync(f.tsPath, compile(f), { encoding: "utf-8" });
    });
}
exports.writeTsFiles = writeTsFiles;
//# sourceMappingURL=compiler.js.map