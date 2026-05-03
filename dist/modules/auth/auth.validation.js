"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmailSchema = exports.signUpSchema = exports.signInSchema = void 0;
const z = __importStar(require("zod"));
const user_enum_1 = require("../../common/enum/user.enum");
exports.signInSchema = {
    body: z.object({
        email: z.email(),
        password: z.string().min(6),
    }),
};
exports.signUpSchema = {
    body: exports.signInSchema.body
        .safeExtend({
        userName: z.string({ error: "username is required" }),
        cPassword: z.string().min(6),
        gender: z.enum(user_enum_1.genderEnum),
        role: z.enum(user_enum_1.RoleEnum).optional(),
        phone: z.number({ error: "sssssssssss" }).optional(),
        age: z.number(),
        address: z.string().optional(),
    })
        .refine((data) => {
        return data.password === data.cPassword;
    }, {
        error: "password and confirm password must be same",
        path: ["cPassword"],
    }),
};
exports.confirmEmailSchema = {
    body: z.object({
        email: z.email(),
        role: z.enum(user_enum_1.RoleEnum).optional(),
        otp: z.string(),
    }),
};
