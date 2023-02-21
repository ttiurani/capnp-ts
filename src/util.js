"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexToBigInt = exports.splitCamel = exports.decToHexBytes = exports.d2h = exports.c2t = exports.c2s = void 0;
const tslib_1 = require("tslib");
const util_1 = require("capnp-ts/src/util");
const debug_1 = tslib_1.__importDefault(require("debug"));
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/unbound-method */
const { decToHex, hexToDec } = require("hex2dec");
/* eslint-enable */
const trace = (0, debug_1.default)("capnpc:util");
trace("load");
function c2s(s) {
    return splitCamel(s)
        .map((x) => x.toUpperCase())
        .join("_");
}
exports.c2s = c2s;
function c2t(s) {
    return s.substr(0, 1).toUpperCase() + s.substr(1);
}
exports.c2t = c2t;
function d2h(d) {
    let h = decToHex(d).substr(2);
    let neg = false;
    if (h[0] === "-") {
        h = h.substr(1);
        neg = true;
    }
    return neg ? `-${(0, util_1.pad)(h, 16)}` : (0, util_1.pad)(h, 16);
}
exports.d2h = d2h;
function decToHexBytes(d) {
    let h = d2h(d);
    const neg = h[0] === "-";
    const out = neg ? ["-"] : [];
    if (neg)
        h = h.substr(1);
    for (let i = 0; i < h.length; i += 2) {
        out.push(h.substr(i, 2));
    }
    return out;
}
exports.decToHexBytes = decToHexBytes;
function splitCamel(s) {
    let wasLo = false;
    return s.split("").reduce((a, c) => {
        const lo = c.toUpperCase() !== c;
        const up = c.toLowerCase() !== c;
        if (a.length === 0 || (wasLo && up)) {
            a.push(c);
        }
        else {
            const i = a.length - 1;
            a[i] = a[i] + c;
        }
        wasLo = lo;
        return a;
    }, []);
}
exports.splitCamel = splitCamel;
function hexToBigInt(h) {
    return BigInt(hexToDec(h));
}
exports.hexToBigInt = hexToBigInt;
//# sourceMappingURL=util.js.map