"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redis_client = void 0;
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
exports.redis_client = (0, redis_1.createClient)({
    url: config_service_1.Redis_Url,
});
const connectRedis = async () => {
    await exports.redis_client
        .connect()
        .then(() => console.log("connected to redis successfully"))
        .catch((err) => console.log("error connecting to redis", err));
};
exports.connectRedis = connectRedis;
