"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
const Event_enum_1 = require("../enum/Event.enum");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.Redis_Url,
        });
        this.handleEvents();
    }
    handleEvents() {
        this.client.on("error", (error) => {
            console.log("error connecting to redis", error);
        });
    }
    async connect() {
        this.client.connect();
        console.log("connected to redis successfully");
    }
    otp_key = ({ email, subject = Event_enum_1.EventEnum.confrimEmail, }) => {
        return `otp::${email}::${subject}`;
    };
    otp_count = (email) => {
        return `${this.otp_key({ email })}::count`;
    };
    block_otp = (email) => {
        return `${this.otp_key({ email })}::block`;
    };
    revoked_key = ({ userId, jti }) => {
        return `revoke_token::${userId}::${jti}`;
    };
    get_key = (userId) => {
        return `revoke_token::${userId}`;
    };
    setValue = async ({ key, value, ttl, }) => {
        try {
            const data = typeof value == "string" ? value : JSON.stringify(value);
            return ttl
                ? await this.client.set(key, data, { EX: ttl })
                : await this.client.set(key, data);
        }
        catch (error) {
            console.log(error, "failed to set");
        }
    };
    update = async ({ key, value, ttl, }) => {
        try {
            if (!(await this.client.exists(key)))
                return 0;
            return await this.setValue({ key, value, ttl });
        }
        catch (error) {
            console.log(error, "failed to update");
        }
    };
    get = async (key) => {
        try {
            try {
                return JSON.parse((await this.client.get(key)));
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.log(error, "failed to get");
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log(error, "failed to get ttl");
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log(error, "failed to check existence");
        }
    };
    expire = async ({ key, ttl }) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            console.log(error, "failed to SET expire");
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            console.log(error, "failed to delete key");
        }
    };
    keys = async (pattern) => {
        try {
            return await this.client.keys(`${pattern}*`);
        }
        catch (error) {
            console.log(error, "failed to get keys");
        }
    };
    increment = async (key) => {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.log(error, "failed to increment");
        }
    };
}
exports.default = new RedisService();
