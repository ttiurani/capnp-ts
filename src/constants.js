"use strict";
/**
 * @author jdiaz5513
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOID_TYPE = exports.VALUE = exports.TS_FILE_ID = exports.THIS = exports.STRUCT = exports.STRING_TYPE = exports.STATIC = exports.SOURCE_COMMENT = exports.READONLY = exports.OBJECT_SIZE = exports.NUMBER_TYPE = exports.Primitive = exports.LENGTH = exports.EXPORT = exports.ConcreteListType = exports.CAPNP = exports.BOOLEAN_TYPE = exports.BIGINT = exports.__ = void 0;
const tslib_1 = require("tslib");
const s = tslib_1.__importStar(require("capnp-ts/src/std/schema.capnp.js"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const typescript_1 = tslib_1.__importStar(require("typescript"));
const trace = (0, debug_1.default)("capnpc:constants");
trace("load");
/** undefined */
exports.__ = undefined;
/** BigInt */
exports.BIGINT = typescript_1.factory.createIdentifier("BigInt");
/** boolean */
exports.BOOLEAN_TYPE = typescript_1.factory.createTypeReferenceNode("boolean", exports.__);
/** capnp */
exports.CAPNP = typescript_1.factory.createIdentifier("capnp");
/** A Mapping of various types to their list type constructor. */
exports.ConcreteListType = {
    [s.Type.ANY_POINTER]: "capnp.AnyPointerList",
    [s.Type.BOOL]: "capnp.BoolList",
    [s.Type.DATA]: "capnp.DataList",
    [s.Type.ENUM]: "capnp.Uint16List",
    [s.Type.FLOAT32]: "capnp.Float32List",
    [s.Type.FLOAT64]: "capnp.Float64List",
    [s.Type.INT16]: "capnp.Int16List",
    [s.Type.INT32]: "capnp.Int32List",
    [s.Type.INT64]: "capnp.Int64List",
    [s.Type.INT8]: "capnp.Int8List",
    [s.Type.INTERFACE]: "capnp.InterfaceList",
    [s.Type.LIST]: "capnp.PointerList",
    [s.Type.STRUCT]: "capnp.CompositeList",
    [s.Type.TEXT]: "capnp.TextList",
    [s.Type.UINT16]: "capnp.Uint16List",
    [s.Type.UINT32]: "capnp.Uint32List",
    [s.Type.UINT64]: "capnp.Uint64List",
    [s.Type.UINT8]: "capnp.Uint8List",
    [s.Type.VOID]: "capnp.VoidList",
};
/** export */
exports.EXPORT = typescript_1.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword);
/** length */
exports.LENGTH = typescript_1.factory.createIdentifier("length");
/** Some data used to help generate code for primitive struct fields. */
exports.Primitive = {
    [s.Type.BOOL]: {
        byteLength: 1,
        getter: "getBit",
        mask: "getBitMask",
        setter: "setBit",
    },
    [s.Type.ENUM]: {
        byteLength: 2,
        getter: "getUint16",
        mask: "getUint16Mask",
        setter: "setUint16",
    },
    [s.Type.FLOAT32]: {
        byteLength: 4,
        getter: "getFloat32",
        mask: "getFloat32Mask",
        setter: "setFloat32",
    },
    [s.Type.FLOAT64]: {
        byteLength: 8,
        getter: "getFloat64",
        mask: "getFloat64Mask",
        setter: "setFloat64",
    },
    [s.Type.INT16]: {
        byteLength: 2,
        getter: "getInt16",
        mask: "getInt16Mask",
        setter: "setInt16",
    },
    [s.Type.INT32]: {
        byteLength: 4,
        getter: "getInt32",
        mask: "getInt32Mask",
        setter: "setInt32",
    },
    [s.Type.INT64]: {
        byteLength: 8,
        getter: "getInt64",
        mask: "getInt64Mask",
        setter: "setInt64",
    },
    [s.Type.INT8]: {
        byteLength: 1,
        getter: "getInt8",
        mask: "getInt8Mask",
        setter: "setInt8",
    },
    [s.Type.UINT16]: {
        byteLength: 2,
        getter: "getUint16",
        mask: "getUint16Mask",
        setter: "setUint16",
    },
    [s.Type.UINT32]: {
        byteLength: 4,
        getter: "getUint32",
        mask: "getUint32Mask",
        setter: "setUint32",
    },
    [s.Type.UINT64]: {
        byteLength: 8,
        getter: "getUint64",
        mask: "getUint64Mask",
        setter: "setUint64",
    },
    [s.Type.UINT8]: {
        byteLength: 1,
        getter: "getUint8",
        mask: "getUint8Mask",
        setter: "setUint8",
    },
    [s.Type.VOID]: {
        byteLength: 0,
        getter: "getVoid",
        mask: "getVoidMask",
        setter: "setVoid",
    },
};
/** number */
exports.NUMBER_TYPE = typescript_1.factory.createTypeReferenceNode("number", exports.__);
/** __O */
// This is referenced so frequently it gets a shorthand!
exports.OBJECT_SIZE = typescript_1.factory.createIdentifier("__O");
/** readonly */
exports.READONLY = typescript_1.factory.createToken(typescript_1.default.SyntaxKind.ReadonlyKeyword);
/** No... comment? */
exports.SOURCE_COMMENT = `/* tslint:disable */

/**
 * This file has been automatically generated by the [capnpc-ts utility](https://github.com/jdiaz5513/capnp-ts).
 */

`;
/** static */
exports.STATIC = typescript_1.factory.createToken(typescript_1.default.SyntaxKind.StaticKeyword);
/** string */
exports.STRING_TYPE = typescript_1.factory.createTypeReferenceNode("string", exports.__);
/** __S */
// This is referenced so frequently it gets a shorthand!
exports.STRUCT = typescript_1.default.createIdentifier("__S");
/** this */
exports.THIS = typescript_1.factory.createThis();
/**
 * Used to look up the ts.capnp file by its ID.
 *
 * NOTE: The file ID should never change.
 */
exports.TS_FILE_ID = "e37ded525a68a7c9";
/** value */
exports.VALUE = typescript_1.factory.createIdentifier("value");
/** void */
exports.VOID_TYPE = typescript_1.factory.createTypeReferenceNode("void", exports.__);
//# sourceMappingURL=constants.js.map