"use strict";
/**
 * @author jdiaz5513
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValueExpression = exports.createUnionConstProperty = exports.createNestedNodeProperty = exports.createMethod = exports.createExpressionBlock = exports.createConstProperty = exports.createConcreteListProperty = exports.createClassExtends = void 0;
const tslib_1 = require("tslib");
const s = tslib_1.__importStar(require("capnp-ts/src/std/schema.capnp.js"));
const capnp = tslib_1.__importStar(require("capnp-ts"));
const util_1 = require("capnp-ts/src/util");
const typescript_1 = tslib_1.__importStar(require("typescript"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const constants_1 = require("./constants");
const E = tslib_1.__importStar(require("./errors"));
const file_1 = require("./file");
const util = tslib_1.__importStar(require("./util"));
const trace = (0, debug_1.default)("capnpc:ast-creators");
function createClassExtends(identifierText) {
    const types = [typescript_1.factory.createExpressionWithTypeArguments(typescript_1.factory.createIdentifier(identifierText), [])];
    return typescript_1.factory.createHeritageClause(typescript_1.default.SyntaxKind.ExtendsKeyword, types);
}
exports.createClassExtends = createClassExtends;
function createConcreteListProperty(ctx, field) {
    const name = `_${util.c2t(field.getName())}`;
    const type = typescript_1.factory.createTypeReferenceNode((0, file_1.getJsType)(ctx, field.getSlot().getType(), true), constants_1.__);
    let u;
    return typescript_1.factory.createPropertyDeclaration(constants_1.__, [constants_1.STATIC], name, constants_1.__, type, u);
}
exports.createConcreteListProperty = createConcreteListProperty;
function createConstProperty(node) {
    const name = util.c2s((0, file_1.getDisplayNamePrefix)(node));
    const initializer = createValueExpression(node.getConst().getValue());
    return typescript_1.factory.createPropertyDeclaration(constants_1.__, [constants_1.STATIC, constants_1.READONLY], name, constants_1.__, constants_1.__, initializer);
}
exports.createConstProperty = createConstProperty;
function createExpressionBlock(expressions, returns, allowSingleLine) {
    const statements = expressions.map((e, i) => i === expressions.length - 1 && returns ? typescript_1.factory.createReturnStatement(e) : typescript_1.factory.createExpressionStatement(e));
    return typescript_1.factory.createBlock(statements, !(allowSingleLine && expressions.length < 2));
}
exports.createExpressionBlock = createExpressionBlock;
function createMethod(name, parameters, type, expressions, allowSingleLine = true) {
    return typescript_1.factory.createMethodDeclaration(constants_1.__, constants_1.__, constants_1.__, name, constants_1.__, constants_1.__, parameters, type, createExpressionBlock(expressions, type !== constants_1.VOID_TYPE, allowSingleLine));
}
exports.createMethod = createMethod;
function createNestedNodeProperty(node) {
    const name = (0, file_1.getDisplayNamePrefix)(node);
    const initializer = typescript_1.factory.createIdentifier((0, file_1.getFullClassName)(node));
    return typescript_1.factory.createPropertyDeclaration(constants_1.__, [constants_1.STATIC, constants_1.READONLY], name, constants_1.__, constants_1.__, initializer);
}
exports.createNestedNodeProperty = createNestedNodeProperty;
function createUnionConstProperty(fullClassName, field) {
    const name = util.c2s(field.getName());
    const initializer = typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier(`${fullClassName}_Which`), name);
    return typescript_1.factory.createPropertyDeclaration(constants_1.__, [constants_1.STATIC, constants_1.READONLY], name, constants_1.__, constants_1.__, initializer);
}
exports.createUnionConstProperty = createUnionConstProperty;
function createValueExpression(value) {
    trace("createValueExpression(%s)", value);
    let p;
    switch (value.which()) {
        case s.Value.BOOL:
            return value.getBool() ? typescript_1.factory.createTrue() : typescript_1.factory.createFalse();
        case s.Value.ENUM:
            return typescript_1.factory.createNumericLiteral(value.getEnum().toString());
        case s.Value.FLOAT32:
            return typescript_1.factory.createNumericLiteral(value.getFloat32().toString());
        case s.Value.FLOAT64:
            return typescript_1.factory.createNumericLiteral(value.getFloat64().toString());
        case s.Value.INT16:
            return typescript_1.factory.createNumericLiteral(value.getInt16().toString());
        case s.Value.INT32:
            return typescript_1.factory.createNumericLiteral(value.getInt32().toString());
        case s.Value.INT64: {
            let v = value.getInt64().toString(16);
            let neg = "";
            if (v[0] === "-") {
                v = v.slice(1);
                neg = "-";
            }
            return typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier(`${neg}BigInt`), constants_1.__, [typescript_1.factory.createStringLiteral(`0x${v}`)]);
        }
        case s.Value.INT8:
            return typescript_1.factory.createNumericLiteral(value.getInt8().toString());
        case s.Value.TEXT:
            return typescript_1.factory.createStringLiteral(value.getText());
        case s.Value.UINT16:
            return typescript_1.factory.createNumericLiteral(value.getUint16().toString());
        case s.Value.UINT32:
            return typescript_1.factory.createNumericLiteral(value.getUint32().toString());
        case s.Value.UINT64: {
            return typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier("BigInt"), constants_1.__, [
                typescript_1.factory.createStringLiteral(`0x${value.getUint64().toString(16)}`),
            ]);
        }
        case s.Value.UINT8:
            return typescript_1.factory.createNumericLiteral(value.getUint8().toString());
        case s.Value.VOID:
            return typescript_1.factory.createIdentifier("undefined");
        case s.Value.ANY_POINTER:
            p = value.getAnyPointer();
            break;
        case s.Value.DATA:
            p = value.getData();
            break;
        case s.Value.LIST:
            p = value.getList();
            break;
        case s.Value.STRUCT:
            p = value.getStruct();
            break;
        case s.Value.INTERFACE:
        default:
            throw new Error((0, util_1.format)(E.GEN_SERIALIZE_UNKNOWN_VALUE, s.Value_Which[value.which()]));
    }
    const m = new capnp.Message();
    m.setRoot(p);
    const buf = new Uint8Array(m.toPackedArrayBuffer());
    const bytes = new Array(buf.byteLength);
    for (let i = 0; i < buf.byteLength; i++) {
        bytes[i] = typescript_1.factory.createNumericLiteral(`0x${(0, util_1.pad)(buf[i].toString(16), 2)}`);
    }
    return typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(constants_1.CAPNP, "readRawPointer"), constants_1.__, [
        typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createNewExpression(typescript_1.factory.createIdentifier("Uint8Array"), constants_1.__, [typescript_1.factory.createArrayLiteralExpression(bytes, false)]), "buffer"),
    ]);
}
exports.createValueExpression = createValueExpression;
//# sourceMappingURL=ast-creators.js.map