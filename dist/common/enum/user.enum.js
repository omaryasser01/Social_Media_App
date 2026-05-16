"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerEnum = exports.RoleEnum = exports.genderEnum = void 0;
var genderEnum;
(function (genderEnum) {
    genderEnum["male"] = "male";
    genderEnum["female"] = "female";
})(genderEnum || (exports.genderEnum = genderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
    RoleEnum["superAdmin"] = "superAdmin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var providerEnum;
(function (providerEnum) {
    providerEnum["System"] = "System";
    providerEnum["Google"] = "Google";
})(providerEnum || (exports.providerEnum = providerEnum = {}));
