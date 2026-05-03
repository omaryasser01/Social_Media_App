"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.hash = void 0;
const bcrypt_1 = require("bcrypt");
const config_service_1 = require("../../../config/config.service");
const hash = ({ plainText, saltRounds = config_service_1.SaltRounds, }) => {
    return (0, bcrypt_1.hashSync)(plainText, Number(saltRounds));
};
exports.hash = hash;
const compare = ({ plainText, cipherText, }) => {
    return (0, bcrypt_1.compareSync)(plainText, cipherText);
};
exports.compare = compare;
