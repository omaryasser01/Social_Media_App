"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const node_crypto_1 = __importDefault(require("node:crypto"));
const ENCRYPTION_KEY = Buffer.from("123812@32$%#312ASRR123123rere365");
const IV_LENGHT = 16;
function encrypt(text) {
    const iv = node_crypto_1.default.randomBytes(IV_LENGHT);
    const cipher = node_crypto_1.default.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
}
function decrypt(text) {
    const [ivHex, encryptedText] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    let decipher = node_crypto_1.default.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypt = decipher.update(encryptedText, "hex", "utf-8");
    decrypt += decipher.final("utf-8");
    return decrypt;
}
