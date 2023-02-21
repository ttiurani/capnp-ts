"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportNodes = exports.generateUnnamedUnionEnum = exports.generateStructNode = exports.generateStructFieldMethods = exports.generateNode = exports.generateInterfaceClasses = exports.generateFileId = exports.generateEnumNode = exports.generateDefaultValue = exports.generateConcreteListInitializer = exports.generateNestedImports = exports.generateCapnpImport = void 0;
const tslib_1 = require("tslib");
const s = tslib_1.__importStar(require("capnp-ts/src/std/schema.capnp.js"));
const util_1 = require("capnp-ts/src/util");
const debug_1 = tslib_1.__importDefault(require("debug"));
const typescript_1 = tslib_1.__importStar(require("typescript"));
const ast_creators_1 = require("./ast-creators");
const constants_1 = require("./constants");
const E = tslib_1.__importStar(require("./errors"));
const file_1 = require("./file");
const util = tslib_1.__importStar(require("./util"));
const trace = (0, debug_1.default)("capnpc:generators");
trace("load");
function generateCapnpImport(ctx) {
    // Look for the special importPath annotation on the file to see if we need a different import path for capnp-ts.
    const fileNode = (0, file_1.lookupNode)(ctx, ctx.file);
    const tsFileId = util.hexToBigInt(constants_1.TS_FILE_ID);
    // This may be undefined if ts.capnp is not imported; fine, we'll just use the default.
    const tsAnnotationFile = ctx.nodes.find((n) => n.getId() === tsFileId);
    // We might not find the importPath annotation; that's definitely a bug but let's move on.
    const tsImportPathAnnotation = tsAnnotationFile && tsAnnotationFile.getNestedNodes().find((n) => n.getName() === "importPath");
    // There may not necessarily be an import path annotation on the file node. That's fine.
    const importAnnotation = tsImportPathAnnotation && fileNode.getAnnotations().find((a) => a.getId() === tsImportPathAnnotation.getId());
    const importPath = importAnnotation === undefined ? "capnp-ts" : importAnnotation.getValue().getText();
    // import * as capnp from '${importPath}';
    ctx.statements.push(typescript_1.factory.createImportDeclaration(constants_1.__, constants_1.__, typescript_1.factory.createImportClause(false, constants_1.__, typescript_1.factory.createNamespaceImport(constants_1.CAPNP)), typescript_1.factory.createStringLiteral(importPath)));
    // import { ObjectSize as __O, Struct as __S } from '${importPath}';
    ctx.statements.push(typescript_1.factory.createExpressionStatement(typescript_1.factory.createIdentifier(`import { ObjectSize as __O, Struct as __S } from '${importPath}'`)));
}
exports.generateCapnpImport = generateCapnpImport;
function generateNestedImports(ctx) {
    ctx.imports.forEach((i) => {
        const name = i.getName();
        let importPath;
        if (name.substr(0, 7) === "/capnp/") {
            importPath = `capnp-ts/src/std/${name.substr(7)}.js`;
        }
        else {
            importPath = name[0] === "." ? `${name}.js` : `./${name}.js`;
        }
        const imports = getImportNodes(ctx, (0, file_1.lookupNode)(ctx, i)).map(file_1.getFullClassName).join(", ");
        if (imports.length < 1)
            return;
        const importStatement = `import { ${imports} } from "${importPath}"`;
        trace("emitting import statement:", importStatement);
        ctx.statements.push(typescript_1.factory.createExpressionStatement(typescript_1.factory.createIdentifier(importStatement)));
    });
}
exports.generateNestedImports = generateNestedImports;
function generateConcreteListInitializer(ctx, fullClassName, field) {
    const left = typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier(fullClassName), `_${util.c2t(field.getName())}`);
    const right = typescript_1.factory.createIdentifier((0, file_1.getConcreteListType)(ctx, field.getSlot().getType()));
    ctx.statements.push(typescript_1.factory.createExpressionStatement(typescript_1.factory.createAssignment(left, right)));
}
exports.generateConcreteListInitializer = generateConcreteListInitializer;
function generateDefaultValue(field) {
    const name = field.getName();
    const slot = field.getSlot();
    const whichSlotType = slot.getType().which();
    const p = constants_1.Primitive[whichSlotType];
    let initializer;
    switch (whichSlotType) {
        case s.Type_Which.ANY_POINTER:
        case s.Type_Which.DATA:
        case s.Type_Which.LIST:
        case s.Type_Which.STRUCT:
            initializer = (0, ast_creators_1.createValueExpression)(slot.getDefaultValue());
            break;
        case s.Type_Which.TEXT:
            initializer = typescript_1.factory.createStringLiteral(slot.getDefaultValue().getText());
            break;
        case s.Type_Which.BOOL:
            initializer = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.CAPNP, p.mask), constants_1.__, [
                (0, ast_creators_1.createValueExpression)(slot.getDefaultValue()),
                typescript_1.factory.createNumericLiteral((slot.getOffset() % 8).toString()),
            ]);
            break;
        case s.Type_Which.ENUM:
        case s.Type_Which.FLOAT32:
        case s.Type_Which.FLOAT64:
        case s.Type_Which.INT16:
        case s.Type_Which.INT32:
        case s.Type_Which.INT64:
        case s.Type_Which.INT8:
        case s.Type_Which.UINT16:
        case s.Type_Which.UINT32:
        case s.Type_Which.UINT64:
        case s.Type_Which.UINT8:
            initializer = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.CAPNP, p.mask), constants_1.__, [
                (0, ast_creators_1.createValueExpression)(slot.getDefaultValue()),
            ]);
            break;
        default:
            throw new Error((0, util_1.format)(E.GEN_UNKNOWN_DEFAULT, s.Type_Which[whichSlotType]));
    }
    return typescript_1.factory.createPropertyAssignment(`default${util.c2t(name)}`, initializer);
}
exports.generateDefaultValue = generateDefaultValue;
function generateEnumNode(ctx, node) {
    trace("generateEnumNode(%s) [%s]", node, node.getDisplayName());
    const members = node
        .getEnum()
        .getEnumerants()
        .toArray()
        .sort(file_1.compareCodeOrder)
        .map((e) => typescript_1.factory.createEnumMember(util.c2s(e.getName())));
    const d = typescript_1.factory.createEnumDeclaration(constants_1.__, [constants_1.EXPORT], (0, file_1.getFullClassName)(node), members);
    ctx.statements.push(d);
}
exports.generateEnumNode = generateEnumNode;
function generateFileId(ctx) {
    trace("generateFileId()");
    // export const _capnpFileId = BigInt('0xabcdef');
    const fileId = typescript_1.factory.createCallExpression(constants_1.BIGINT, constants_1.__, [typescript_1.factory.createStringLiteral(`0x${ctx.file.getId().toString(16)}`)]);
    ctx.statements.push(typescript_1.factory.createVariableStatement([constants_1.EXPORT], typescript_1.factory.createVariableDeclarationList([typescript_1.factory.createVariableDeclaration("_capnpFileId", constants_1.__, constants_1.__, fileId)], typescript_1.default.NodeFlags.Const)));
}
exports.generateFileId = generateFileId;
function generateInterfaceClasses(_ctx, node) {
    trace("Interface generation is not yet implemented.");
    /* tslint:disable-next-line */
    console.error(`CAPNP-TS: Warning! Interface generation (${node.getDisplayName()}) is not yet implemented.`);
}
exports.generateInterfaceClasses = generateInterfaceClasses;
function generateNode(ctx, node) {
    trace("generateNode(%s, %s)", ctx, node.getId().toString(16));
    const nodeId = node.getId();
    const nodeIdHex = nodeId.toString(16);
    if (ctx.generatedNodeIds.indexOf(nodeIdHex) > -1)
        return;
    ctx.generatedNodeIds.push(nodeIdHex);
    /** An array of group structs formed as children of this struct. They appear before the struct node in the file. */
    const groupNodes = ctx.nodes.filter((n) => n.getScopeId() === nodeId && n.isStruct() && n.getStruct().getIsGroup());
    /**
     * An array of nodes that are nested within this node; these must appear first since those symbols will be
     * refernced in the node's class definition.
     */
    const nestedNodes = node.getNestedNodes().map((n) => (0, file_1.lookupNode)(ctx, n));
    nestedNodes.forEach((n) => generateNode(ctx, n));
    groupNodes.forEach((n) => generateNode(ctx, n));
    const whichNode = node.which();
    switch (whichNode) {
        case s.Node.STRUCT:
            generateStructNode(ctx, node, false);
            break;
        case s.Node.CONST:
            // Const nodes are generated along with the containing class, ignore these.
            break;
        case s.Node.ENUM:
            generateEnumNode(ctx, node);
            break;
        case s.Node.INTERFACE:
            generateStructNode(ctx, node, true);
            break;
        case s.Node.ANNOTATION:
            trace("ignoring unsupported annotation node: %s", node.getDisplayName());
            break;
        case s.Node.FILE:
        default:
            throw new Error((0, util_1.format)(E.GEN_NODE_UNKNOWN_TYPE, s.Node_Which[whichNode]));
    }
}
exports.generateNode = generateNode;
const listLengthParameterName = "length";
function generateStructFieldMethods(ctx, members, node, field) {
    let jsType;
    let whichType;
    if (field.isSlot()) {
        const slotType = field.getSlot().getType();
        jsType = (0, file_1.getJsType)(ctx, slotType, false);
        whichType = slotType.which();
    }
    else if (field.isGroup()) {
        jsType = (0, file_1.getFullClassName)((0, file_1.lookupNode)(ctx, field.getGroup().getTypeId()));
        whichType = "group";
    }
    else {
        throw new Error((0, util_1.format)(E.GEN_UNKNOWN_STRUCT_FIELD, field.which()));
    }
    const jsTypeReference = typescript_1.factory.createTypeReferenceNode(jsType, constants_1.__);
    const discriminantOffset = node.getStruct().getDiscriminantOffset();
    const name = field.getName();
    const properName = util.c2t(name);
    const hadExplicitDefault = field.isSlot() && field.getSlot().getHadExplicitDefault();
    const discriminantValue = field.getDiscriminantValue();
    const fullClassName = (0, file_1.getFullClassName)(node);
    const union = discriminantValue !== s.Field.NO_DISCRIMINANT;
    const offset = (field.isSlot() && field.getSlot().getOffset()) || 0;
    const offsetLiteral = typescript_1.factory.createNumericLiteral(offset.toString());
    /** __S.getPointer(0, this) */
    const getPointer = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getPointer"), constants_1.__, [
        offsetLiteral,
        constants_1.THIS,
    ]);
    /** __S.copyFrom(value, __S.getPointer(0, this)) */
    const copyFromValue = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "copyFrom"), constants_1.__, [
        constants_1.VALUE,
        getPointer,
    ]);
    /** capnp.Orphan<Foo> */
    const orphanType = typescript_1.factory.createTypeReferenceNode("capnp.Orphan", [jsTypeReference]);
    const discriminantOffsetLiteral = typescript_1.factory.createNumericLiteral((discriminantOffset * 2).toString());
    const discriminantValueLiteral = typescript_1.factory.createNumericLiteral(discriminantValue.toString());
    /** __S.getUint16(0, this) */
    const getDiscriminant = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getUint16"), constants_1.__, [
        discriminantOffsetLiteral,
        constants_1.THIS,
    ]);
    /** __S.setUint16(0, this) */
    const setDiscriminant = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "setUint16"), constants_1.__, [
        discriminantOffsetLiteral,
        discriminantValueLiteral,
        constants_1.THIS,
    ]);
    const defaultValue = hadExplicitDefault
        ? typescript_1.factory.createIdentifier(`${fullClassName}._capnp.default${properName}`)
        : undefined;
    let adopt = false;
    let disown = false;
    let init;
    let has = false;
    let get;
    let set;
    let getArgs;
    let setArgs;
    switch (whichType) {
        case s.Type.ANY_POINTER:
            getArgs = [offsetLiteral, constants_1.THIS];
            if (defaultValue)
                getArgs.push(defaultValue);
            adopt = true;
            disown = true;
            /** __S.getPointer(0, this) */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getPointer"), constants_1.__, getArgs);
            has = true;
            /** __S.copyFrom(value, __S.getPointer(0, this)) */
            set = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "copyFrom"), constants_1.__, [constants_1.VALUE, get]);
            break;
        case s.Type.BOOL:
        case s.Type.ENUM:
        case s.Type.FLOAT32:
        case s.Type.FLOAT64:
        case s.Type.INT16:
        case s.Type.INT32:
        case s.Type.INT64:
        case s.Type.INT8:
        case s.Type.UINT16:
        case s.Type.UINT32:
        case s.Type.UINT64:
        case s.Type.UINT8: {
            const { byteLength, getter, setter } = constants_1.Primitive[whichType];
            // NOTE: For a BOOL type this is actually a bit offset; `byteLength` will be `1` in that case.
            const byteOffset = typescript_1.factory.createNumericLiteral((offset * byteLength).toString());
            getArgs = [byteOffset, constants_1.THIS];
            setArgs = [byteOffset, constants_1.VALUE, constants_1.THIS];
            if (defaultValue) {
                getArgs.push(defaultValue);
                setArgs.push(defaultValue);
            }
            /** __S.getXYZ(0, this) */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, getter), constants_1.__, getArgs);
            /** __S.setXYZ(0, value, this) */
            set = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, setter), constants_1.__, setArgs);
            break;
        }
        case s.Type.DATA:
            getArgs = [offsetLiteral, constants_1.THIS];
            if (defaultValue)
                getArgs.push(defaultValue);
            adopt = true;
            disown = true;
            /** __S.getData(0, this) */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getData"), constants_1.__, getArgs);
            has = true;
            /** __S.initData(0, length, this) */
            init = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "initData"), constants_1.__, [
                offsetLiteral,
                constants_1.LENGTH,
                constants_1.THIS,
            ]);
            set = copyFromValue;
            break;
        case s.Type.INTERFACE:
            if (hadExplicitDefault) {
                throw new Error((0, util_1.format)(E.GEN_EXPLICIT_DEFAULT_NON_PRIMITIVE, "INTERFACE"));
            }
            /** __S.getPointerAs(0, Foo, this) */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getPointerAs"), constants_1.__, [
                offsetLiteral,
                typescript_1.factory.createIdentifier(jsType),
                constants_1.THIS,
            ]);
            set = copyFromValue;
            break;
        case s.Type.LIST: {
            const whichElementType = field.getSlot().getType().getList().getElementType().which();
            let listClass = constants_1.ConcreteListType[whichElementType];
            if (whichElementType === s.Type.LIST || whichElementType === s.Type.STRUCT) {
                listClass = `${fullClassName}._${properName}`;
            }
            else if (listClass === void 0) {
                /* istanbul ignore next */
                throw new Error((0, util_1.format)(E.GEN_UNSUPPORTED_LIST_ELEMENT_TYPE, whichElementType));
            }
            const listClassIdentifier = typescript_1.factory.createIdentifier(listClass);
            getArgs = [offsetLiteral, listClassIdentifier, constants_1.THIS];
            if (defaultValue)
                getArgs.push(defaultValue);
            adopt = true;
            disown = true;
            /** __S.getList(0, MyStruct._Foo, this) */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getList"), constants_1.__, getArgs);
            has = true;
            /** __S.initList(0, MyStruct._Foo, length, this) */
            init = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "initList"), constants_1.__, [
                offsetLiteral,
                listClassIdentifier,
                typescript_1.factory.createIdentifier(listLengthParameterName),
                constants_1.THIS,
            ]);
            set = copyFromValue;
            break;
        }
        case s.Type.STRUCT: {
            const structType = typescript_1.factory.createIdentifier((0, file_1.getJsType)(ctx, field.getSlot().getType(), false));
            getArgs = [offsetLiteral, structType, constants_1.THIS];
            if (defaultValue)
                getArgs.push(defaultValue);
            adopt = true;
            disown = true;
            /** __S.getStruct(0, Foo, this) */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getStruct"), constants_1.__, getArgs);
            has = true;
            /** __S.initStruct(0, Foo, this) */
            init = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "initStructAt"), constants_1.__, [
                offsetLiteral,
                structType,
                constants_1.THIS,
            ]);
            set = copyFromValue;
            break;
        }
        case s.Type.TEXT:
            getArgs = [offsetLiteral, constants_1.THIS];
            if (defaultValue)
                getArgs.push(defaultValue);
            /** __S.getText(0, this) */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getText"), constants_1.__, getArgs);
            /** __S.setText(0, value, this) */
            set = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "setText"), constants_1.__, [
                offsetLiteral,
                constants_1.VALUE,
                constants_1.THIS,
            ]);
            break;
        case s.Type.VOID:
            break;
        case "group": {
            if (hadExplicitDefault) {
                throw new Error((0, util_1.format)(E.GEN_EXPLICIT_DEFAULT_NON_PRIMITIVE, "group"));
            }
            const groupType = typescript_1.factory.createIdentifier(jsType);
            /** __S.getAs(Foo, this); */
            get = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getAs"), constants_1.__, [groupType, constants_1.THIS]);
            init = get;
            break;
        }
        default:
            // TODO Maybe this should be an error?
            break;
    }
    // adoptFoo(value: capnp.Orphan<Foo>): void { __S.adopt(value, this._getPointer(3)); }}
    if (adopt) {
        const parameters = [typescript_1.factory.createParameterDeclaration(constants_1.__, constants_1.__, constants_1.__, constants_1.VALUE, constants_1.__, orphanType, constants_1.__)];
        const expressions = [
            typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "adopt"), constants_1.__, [constants_1.VALUE, getPointer]),
        ];
        if (union)
            expressions.unshift(setDiscriminant);
        members.push((0, ast_creators_1.createMethod)(`adopt${properName}`, parameters, constants_1.VOID_TYPE, expressions));
    }
    // disownFoo(): capnp.Orphan<Foo> { return __S.disown(this.getFoo()); }
    if (disown) {
        const getter = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.THIS, `get${properName}`), constants_1.__, []);
        const expressions = [typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "disown"), constants_1.__, [getter])];
        members.push((0, ast_creators_1.createMethod)(`disown${properName}`, [], orphanType, expressions));
    }
    // getFoo(): FooType { ... }
    if (get) {
        const expressions = [get];
        if (union) {
            expressions.unshift(typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "testWhich"), constants_1.__, [
                typescript_1.factory.createStringLiteral(name),
                getDiscriminant,
                discriminantValueLiteral,
                constants_1.THIS,
            ]));
        }
        members.push((0, ast_creators_1.createMethod)(`get${properName}`, [], jsTypeReference, expressions));
    }
    // hasFoo(): boolean { ... }
    if (has) {
        // !__S.isNull(this._getPointer(8));
        const expressions = [
            typescript_1.factory.createLogicalNot(typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "isNull"), constants_1.__, [getPointer])),
        ];
        members.push((0, ast_creators_1.createMethod)(`has${properName}`, [], constants_1.BOOLEAN_TYPE, expressions));
    }
    // initFoo(): FooType { ... } / initFoo(length: number): capnp.List<FooElementType> { ... }
    if (init) {
        const parameters = whichType === s.Type.DATA || whichType === s.Type.LIST
            ? [typescript_1.factory.createParameterDeclaration(constants_1.__, constants_1.__, constants_1.__, listLengthParameterName, constants_1.__, constants_1.NUMBER_TYPE, constants_1.__)]
            : [];
        const expressions = [init];
        if (union)
            expressions.unshift(setDiscriminant);
        members.push((0, ast_creators_1.createMethod)(`init${properName}`, parameters, jsTypeReference, expressions));
    }
    // isFoo(): boolean { ... }
    if (union) {
        const left = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getUint16"), constants_1.__, [
            discriminantOffsetLiteral,
            constants_1.THIS,
        ]);
        const right = discriminantValueLiteral;
        const expressions = [typescript_1.factory.createBinaryExpression(left, typescript_1.default.SyntaxKind.EqualsEqualsEqualsToken, right)];
        members.push((0, ast_creators_1.createMethod)(`is${properName}`, [], constants_1.BOOLEAN_TYPE, expressions));
    }
    // setFoo(value: FooType): void { ... }
    if (set || union) {
        const expressions = [];
        const parameters = [];
        if (set) {
            expressions.unshift(set);
            parameters.unshift(typescript_1.factory.createParameterDeclaration(constants_1.__, constants_1.__, constants_1.__, constants_1.VALUE, constants_1.__, jsTypeReference, constants_1.__));
        }
        if (union) {
            expressions.unshift(setDiscriminant);
        }
        members.push((0, ast_creators_1.createMethod)(`set${properName}`, parameters, constants_1.VOID_TYPE, expressions));
    }
}
exports.generateStructFieldMethods = generateStructFieldMethods;
function generateStructNode(ctx, node, interfaceNode) {
    trace("generateStructNode(%s) [%s]", node, node.getDisplayName());
    const displayNamePrefix = (0, file_1.getDisplayNamePrefix)(node);
    const fullClassName = (0, file_1.getFullClassName)(node);
    const nestedNodes = node
        .getNestedNodes()
        .map((n) => (0, file_1.lookupNode)(ctx, n))
        .filter((n) => !n.isConst() && !n.isAnnotation());
    const nodeId = node.getId();
    const nodeIdHex = nodeId.toString(16);
    const struct = node.which() === s.Node.STRUCT ? node.getStruct() : undefined;
    const unionFields = (0, file_1.getUnnamedUnionFields)(node).sort(file_1.compareCodeOrder);
    const dataWordCount = struct ? struct.getDataWordCount() : 0;
    const dataByteLength = struct ? dataWordCount * 8 : 0;
    const discriminantCount = struct ? struct.getDiscriminantCount() : 0;
    const discriminantOffset = struct ? struct.getDiscriminantOffset() : 0;
    const fields = struct ? struct.getFields().toArray().sort(file_1.compareCodeOrder) : [];
    const pointerCount = struct ? struct.getPointerCount() : 0;
    const concreteLists = fields.filter(file_1.needsConcreteListClass).sort(file_1.compareCodeOrder);
    const consts = ctx.nodes.filter((n) => n.getScopeId() === nodeId && n.isConst());
    // const groups = ctx.nodes.filter(
    //   (n) => n.getScopeId().equals(nodeId) && n.isStruct() && n.getStruct().getIsGroup());
    const hasUnnamedUnion = discriminantCount !== 0;
    if (hasUnnamedUnion) {
        generateUnnamedUnionEnum(ctx, fullClassName, unionFields);
    }
    const members = [];
    // static readonly CONSTANT = 'foo';
    members.push(...consts.map(ast_creators_1.createConstProperty));
    // static readonly WHICH = MyStruct_Which.WHICH;
    members.push(...unionFields.map((f) => (0, ast_creators_1.createUnionConstProperty)(fullClassName, f)));
    // static readonly NestedStruct = MyStruct_NestedStruct;
    members.push(...nestedNodes.map(ast_creators_1.createNestedNodeProperty));
    // static readonly Client = MyInterface_Client;
    // static readonly Server = MyInterface_Server;
    // if (interfaceNode) {
    //   members.push(
    //     f.createPropertyDeclaration(__, [STATIC, READONLY], 'Client', __, __, f.createStringLiteral(`${fullClassName}_Client`)));
    //   members.push(
    //     f.createPropertyDeclaration(__, [STATIC, READONLY], 'Server', __, __, f.createStringLiteral(`${fullClassName}_Server`)));
    // }
    const defaultValues = fields.reduce((acc, f) => f.isSlot() && f.getSlot().getHadExplicitDefault() && f.getSlot().getType().which() !== s.Type.VOID
        ? acc.concat(generateDefaultValue(f))
        : acc, []);
    // static reaodnly _capnp = { displayName: 'MyStruct', id: '4732bab4310f81', size = new __O(8, 8) };
    members.push(typescript_1.factory.createPropertyDeclaration(constants_1.__, [constants_1.STATIC, constants_1.READONLY], "_capnp", constants_1.__, constants_1.__, typescript_1.factory.createObjectLiteralExpression([
        typescript_1.factory.createPropertyAssignment("displayName", typescript_1.factory.createStringLiteral(displayNamePrefix)),
        typescript_1.factory.createPropertyAssignment("id", typescript_1.factory.createStringLiteral(nodeIdHex)),
        typescript_1.factory.createPropertyAssignment("size", typescript_1.factory.createNewExpression(constants_1.OBJECT_SIZE, constants_1.__, [
            typescript_1.factory.createNumericLiteral(dataByteLength.toString()),
            typescript_1.factory.createNumericLiteral(pointerCount.toString()),
        ])),
    ].concat(defaultValues))));
    // private static _ConcreteListClass: MyStruct_ConcreteListClass;
    members.push(...concreteLists.map((f) => (0, ast_creators_1.createConcreteListProperty)(ctx, f)));
    // getFoo() { ... } initFoo() { ... } setFoo() { ... }
    fields.forEach((f) => generateStructFieldMethods(ctx, members, node, f));
    // toString(): string { return 'MyStruct_' + super.toString(); }
    const toStringExpression = typescript_1.factory.createBinaryExpression(typescript_1.factory.createStringLiteral(`${fullClassName}_`), typescript_1.default.SyntaxKind.PlusToken, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier("super.toString"), constants_1.__, []));
    members.push((0, ast_creators_1.createMethod)("toString", [], constants_1.STRING_TYPE, [toStringExpression], true));
    if (hasUnnamedUnion) {
        // which(): MyStruct_Which { return __S.getUint16(12, this); }
        const whichExpression = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.STRUCT, "getUint16"), constants_1.__, [
            typescript_1.factory.createNumericLiteral((discriminantOffset * 2).toString()),
            constants_1.THIS,
        ]);
        members.push((0, ast_creators_1.createMethod)("which", [], typescript_1.factory.createTypeReferenceNode(`${fullClassName}_Which`, constants_1.__), [whichExpression], true));
    }
    const c = typescript_1.factory.createClassDeclaration(constants_1.__, [constants_1.EXPORT], fullClassName, constants_1.__, [(0, ast_creators_1.createClassExtends)("__S")], members);
    // Make sure the interface classes are generated first.
    if (interfaceNode) {
        generateInterfaceClasses(ctx, node);
    }
    ctx.statements.push(c);
    // Write out the concrete list type initializer after all the class definitions. It can't be initialized within the
    // class's static initializer because the nested type might not be defined yet.
    // FIXME: This might be solvable with topological sorting?
    ctx.concreteLists.push(...concreteLists.map((f) => [fullClassName, f]));
}
exports.generateStructNode = generateStructNode;
function generateUnnamedUnionEnum(ctx, fullClassName, unionFields) {
    const members = unionFields
        .sort(file_1.compareCodeOrder)
        .map((field) => typescript_1.factory.createEnumMember(util.c2s(field.getName()), typescript_1.factory.createNumericLiteral(field.getDiscriminantValue().toString())));
    const d = typescript_1.factory.createEnumDeclaration(constants_1.__, [constants_1.EXPORT], `${fullClassName}_Which`, members);
    ctx.statements.push(d);
}
exports.generateUnnamedUnionEnum = generateUnnamedUnionEnum;
function getImportNodes(ctx, node) {
    return (0, file_1.lookupNode)(ctx, node)
        .getNestedNodes()
        .filter((n) => (0, file_1.hasNode)(ctx, n))
        .map((n) => (0, file_1.lookupNode)(ctx, n))
        .reduce((a, n) => a.concat([n], getImportNodes(ctx, n)), new Array())
        .filter((n) => (0, file_1.lookupNode)(ctx, n).isStruct() || (0, file_1.lookupNode)(ctx, n).isEnum());
}
exports.getImportNodes = getImportNodes;
//# sourceMappingURL=generators.js.map