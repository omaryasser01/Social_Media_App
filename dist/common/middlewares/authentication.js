"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const token_service_1 = __importDefault(require("../../common/service/token.service"));
const config_service_1 = require("../../config/config.service");
const user_reposatory_1 = __importDefault(require("../../DB/repositories/user.reposatory"));
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const global_error_1 = require("../utils/global-error");
const dbService = new user_reposatory_1.default();
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        throw new global_error_1.AppError("authorization not exist");
    }
    const [prefix, token] = authorization.split(" ");
    if (!token) {
        throw new global_error_1.AppError("token not found");
    }
    let Access_secret_key = "";
    if (prefix == config_service_1.Prefix_user) {
        Access_secret_key = config_service_1.Access_Secret_key_user;
        console.log("user");
    }
    else if (prefix == config_service_1.Prefix_admin) {
        Access_secret_key = config_service_1.Access_Secret_key_admin;
        console.log("admin");
    }
    else {
        throw new global_error_1.AppError("inValid Prefix");
    }
    const decode = token_service_1.default.verifyToken({
        token,
        secret_key: Access_secret_key,
    });
    if (!decode || !decode?.id) {
        throw new global_error_1.AppError("invalid token payload");
    }
    const user = await dbService.findOne({
        filter: { _id: decode.id },
    });
    if (!user) {
        throw new global_error_1.AppError("user not exists", 400);
    }
    const revokeToken = await redis_service_1.default.get(redis_service_1.default.revoked_key({ userId: decode.id, jti: decode.jti }));
    if (revokeToken) {
        throw new global_error_1.AppError("invalid token Revoked");
    }
    req.user = user;
    req.decode = decode;
    next();
};
exports.authentication = authentication;
