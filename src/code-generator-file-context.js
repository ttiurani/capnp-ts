"use strict";
/**
 * @author jdiaz5513
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGeneratorFileContext = void 0;
class CodeGeneratorFileContext {
    constructor(req, file) {
        this.req = req;
        this.file = file;
        this.nodes = req.getNodes().toArray();
        this.concreteLists = [];
        this.generatedNodeIds = [];
        this.statements = [];
        this.tsPath = "";
        this.imports = file.getImports().toArray();
    }
    toString() {
        return this.file ? this.file.getFilename() : "CodeGeneratorFileContext()";
    }
}
exports.CodeGeneratorFileContext = CodeGeneratorFileContext;
//# sourceMappingURL=code-generator-file-context.js.map