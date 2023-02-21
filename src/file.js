"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.needsConcreteListClass = exports.lookupNode = exports.loadRequestedFile = exports.hasNode = exports.getUnnamedUnionFields = exports.getJsType = exports.getFullClassName = exports.getDisplayNamePrefix = exports.getConcreteListType = exports.compareCodeOrder = void 0;
const tslib_1 = require("tslib");
const s = tslib_1.__importStar(require("capnp-ts/src/std/schema.capnp.js"));
const util_1 = require("capnp-ts/src/util");
const debug_1 = tslib_1.__importDefault(require("debug"));
const code_generator_file_context_1 = require("./code-generator-file-context");
const constants_1 = require("./constants");
const E = tslib_1.__importStar(require("./errors"));
const util = tslib_1.__importStar(require("./util"));
const trace = (0, debug_1.default)("capnpc:file");
trace("load");
function compareCodeOrder(a, b) {
    return a.getCodeOrder() - b.getCodeOrder();
}
exports.compareCodeOrder = compareCodeOrder;
function getConcreteListType(ctx, type) {
    if (!type.isList())
        return getJsType(ctx, type, false);
    const elementType = type.getList().getElementType();
    const elementTypeWhich = elementType.which();
    if (elementTypeWhich === s.Type.LIST) {
        return `capnp.PointerList(${getConcreteListType(ctx, elementType)})`;
    }
    else if (elementTypeWhich === s.Type.STRUCT) {
        const structNode = lookupNode(ctx, elementType.getStruct().getTypeId());
        if (structNode.getStruct().getPreferredListEncoding() !== s.ElementSize.INLINE_COMPOSITE) {
            throw new Error(E.GEN_FIELD_NON_INLINE_STRUCT_LIST);
        }
        return `capnp.CompositeList(${getJsType(ctx, elementType, false)})`;
    }
    return constants_1.ConcreteListType[elementTypeWhich];
}
exports.getConcreteListType = getConcreteListType;
function getDisplayNamePrefix(node) {
    return node.getDisplayName().substr(node.getDisplayNamePrefixLength());
}
exports.getDisplayNamePrefix = getDisplayNamePrefix;
function getFullClassName(node) {
    return node.getDisplayName().split(":")[1].split(".").map(util.c2t).join("_");
}
exports.getFullClassName = getFullClassName;
function getJsType(ctx, type, constructor) {
    const whichType = type.which();
    switch (whichType) {
        case s.Type.ANY_POINTER:
            return "capnp.Pointer";
        case s.Type.BOOL:
            return "boolean";
        case s.Type.DATA:
            return "capnp.Data";
        case s.Type.ENUM:
            return getFullClassName(lookupNode(ctx, type.getEnum().getTypeId()));
        case s.Type.FLOAT32:
        case s.Type.FLOAT64:
        case s.Type.INT16:
        case s.Type.INT32:
        case s.Type.INT8:
        case s.Type.UINT16:
        case s.Type.UINT32:
        case s.Type.UINT8:
            return "number";
        case s.Type.UINT64:
        case s.Type.INT64:
            return "bigint";
        case s.Type.INTERFACE:
            return "capnp.Interface";
        case s.Type.LIST:
            return `capnp.List${constructor ? "Ctor" : ""}<${getJsType(ctx, type.getList().getElementType(), false)}>`;
        case s.Type.STRUCT: {
            const c = getFullClassName(lookupNode(ctx, type.getStruct().getTypeId()));
            return constructor ? `capnp.StructCtor<${c}>` : c;
        }
        case s.Type.TEXT:
            return "string";
        case s.Type.VOID:
            return "capnp.Void";
        default:
            throw new Error((0, util_1.format)(E.GEN_UNKNOWN_TYPE, whichType));
    }
}
exports.getJsType = getJsType;
function getUnnamedUnionFields(node) {
    if (!node.isStruct())
        return [];
    return node
        .getStruct()
        .getFields()
        .filter((f) => f.getDiscriminantValue() !== s.Field.NO_DISCRIMINANT);
}
exports.getUnnamedUnionFields = getUnnamedUnionFields;
function hasNode(ctx, lookup) {
    const id = typeof lookup === "bigint" ? lookup : lookup.getId();
    return ctx.nodes.some((n) => n.getId() === id);
}
exports.hasNode = hasNode;
function loadRequestedFile(req, file) {
    trace("compile(%s, %s)", req, file);
    const ctx = new code_generator_file_context_1.CodeGeneratorFileContext(req, file);
    const schema = lookupNode(ctx, file.getId());
    ctx.tsPath = schema.getDisplayName() + ".ts";
    return ctx;
}
exports.loadRequestedFile = loadRequestedFile;
function lookupNode(ctx, lookup) {
    const id = typeof lookup === "bigint" ? lookup : lookup.getId();
    const node = ctx.nodes.find((n) => n.getId() === id);
    if (node === undefined)
        throw new Error((0, util_1.format)(E.GEN_NODE_LOOKUP_FAIL, id));
    return node;
}
exports.lookupNode = lookupNode;
/**
 * Determine whether the given field needs a concrete list class: this is currently the case for composite lists
 * (`capnp.CompositeList`) and lists of lists (`capnp.PointerList`).
 *
 * @param {s.Field} field The field to check.
 * @returns {boolean} Returns `true` if the field requires a concrete list class initializer.
 */
function needsConcreteListClass(field) {
    if (!field.isSlot())
        return false;
    const slotType = field.getSlot().getType();
    if (!slotType.isList())
        return false;
    const elementType = slotType.getList().getElementType();
    return elementType.isStruct() || elementType.isList();
}
exports.needsConcreteListClass = needsConcreteListClass;
//# sourceMappingURL=file.js.map