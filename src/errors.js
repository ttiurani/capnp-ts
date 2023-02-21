"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEN_UNKNOWN_DEFAULT = exports.GEN_TS_EMIT_FAILED = exports.GEN_CAPNP_TS_IMPORT_CORRUPT = exports.GEN_UNSUPPORTED_LIST_ELEMENT_TYPE = exports.GEN_UNKNOWN_TYPE = exports.GEN_UNKNOWN_STRUCT_FIELD = exports.GEN_SERIALIZE_UNKNOWN_VALUE = exports.GEN_NODE_UNKNOWN_TYPE = exports.GEN_NODE_LOOKUP_FAIL = exports.GEN_FIELD_NON_INLINE_STRUCT_LIST = exports.GEN_EXPLICIT_DEFAULT_NON_PRIMITIVE = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const trace = (0, debug_1.default)("capnpc:errors");
trace("load");
exports.GEN_EXPLICIT_DEFAULT_NON_PRIMITIVE = "CAPNPC-TS000 Don't know how to generate a %s field with an explicit default value.";
exports.GEN_FIELD_NON_INLINE_STRUCT_LIST = "CAPNPC-TS001 Don't know how to generate non-inline struct lists.";
exports.GEN_NODE_LOOKUP_FAIL = "CAPNPC-TS002 Failed to look up node id %s.";
exports.GEN_NODE_UNKNOWN_TYPE = 'CAPNPC-TS003 Don\'t know how to generate a "%s" node.';
exports.GEN_SERIALIZE_UNKNOWN_VALUE = "CAPNPC-TS004 Don't know how to serialize a value of kind %s.";
exports.GEN_UNKNOWN_STRUCT_FIELD = "CAPNPC-TS005 Don't know how to generate a struct field of kind %d.";
exports.GEN_UNKNOWN_TYPE = "CAPNPC-TS006 Unknown slot type encountered: %d";
exports.GEN_UNSUPPORTED_LIST_ELEMENT_TYPE = "CAPNPC-TS007 Encountered an unsupported list element type: %d";
exports.GEN_CAPNP_TS_IMPORT_CORRUPT = "CAPNPC-TS008 Was able to import ts.capnp but could not locate the importPath annotation definition.";
exports.GEN_TS_EMIT_FAILED = "CAPNPC-TS009 Failed to transpile emitted schema source code; see above for error messages.";
exports.GEN_UNKNOWN_DEFAULT = "CAPNPC-TS010 Don't know how to generate a default value for %s fields.";
//# sourceMappingURL=errors.js.map