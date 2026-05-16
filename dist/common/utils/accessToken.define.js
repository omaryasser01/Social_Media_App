"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_service_1 = require("../../config/config.service");
class DefineAccessToken {
    constructor(user) {
        let Access_secret_key = "";
        if (user.role == "user") {
            Access_secret_key != config_service_1.Access_Secret_key_user;
        }
        else if (user.role == "admin") {
            Access_secret_key != config_service_1.Access_Secret_key_admin;
        }
        return Access_secret_key;
    }
}
exports.default = DefineAccessToken;
