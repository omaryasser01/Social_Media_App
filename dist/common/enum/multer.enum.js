"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multer_enum = exports.Store_enum = void 0;
var Store_enum;
(function (Store_enum) {
    Store_enum["disk"] = "disk";
    Store_enum["memory"] = "memory";
})(Store_enum || (exports.Store_enum = Store_enum = {}));
exports.multer_enum = {
    image: ["image/png", "image/jpeg"],
    pdf: ["application/pdf"],
};
