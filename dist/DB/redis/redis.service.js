"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.increment = exports.keys = exports.deleteKey = exports.expire = exports.exists = exports.ttl = exports.get = exports.update = exports.setValue = exports.get_key = exports.revoked_key = exports.block_otp = exports.otp_count = exports.otp_key = void 0;
const Event_enum_1 = require("../../common/enum/Event.enum");
const redis_connection_1 = require("./redis.connection");
const otp_key = ({ email, subject = Event_enum_1.EventEnum.confrimEmail, }) => {
    return `otp::${email}::${subject}`;
};
exports.otp_key = otp_key;
const otp_count = (email) => {
    return `${(0, exports.otp_key)({ email })}::count`;
};
exports.otp_count = otp_count;
const block_otp = (email) => {
    return `${(0, exports.otp_key)({ email })}::block`;
};
exports.block_otp = block_otp;
const revoked_key = ({ userId, jti, }) => {
    return `revoke_token::${userId}::${jti}`;
};
exports.revoked_key = revoked_key;
const get_key = (userId) => {
    return `revoke_token::${userId}`;
};
exports.get_key = get_key;
const setValue = async ({ key, value, ttl, }) => {
    try {
        const data = typeof value == "string" ? value : JSON.stringify(value);
        return ttl
            ? await redis_connection_1.redis_client.set(key, data, { EX: ttl })
            : await redis_connection_1.redis_client.set(key, data);
    }
    catch (error) {
        console.log(error, "failed to set");
    }
};
exports.setValue = setValue;
const update = async ({ key, value, ttl, }) => {
    try {
        if (!(await redis_connection_1.redis_client.exists(key)))
            return 0;
        return await (0, exports.setValue)({ key, value, ttl });
    }
    catch (error) {
        console.log(error, "failed to update");
    }
};
exports.update = update;
const get = async (key) => {
    try {
        try {
            return JSON.parse((await redis_connection_1.redis_client.get(key)));
        }
        catch (error) {
            return await redis_connection_1.redis_client.get(key);
        }
    }
    catch (error) {
        console.log(error, "failed to get");
    }
};
exports.get = get;
const ttl = async (key) => {
    try {
        return await redis_connection_1.redis_client.ttl(key);
    }
    catch (error) {
        console.log(error, "failed to get ttl");
    }
};
exports.ttl = ttl;
const exists = async (key) => {
    try {
        return await redis_connection_1.redis_client.exists(key);
    }
    catch (error) {
        console.log(error, "failed to check existence");
    }
};
exports.exists = exists;
const expire = async ({ key, ttl }) => {
    try {
        return await redis_connection_1.redis_client.expire(key, ttl);
    }
    catch (error) {
        console.log(error, "failed to SET expire");
    }
};
exports.expire = expire;
const deleteKey = async (key) => {
    try {
        if (!key.length)
            return 0;
        return await redis_connection_1.redis_client.del(key);
    }
    catch (error) {
        console.log(error, "failed to delete key");
    }
};
exports.deleteKey = deleteKey;
const keys = async (pattern) => {
    try {
        return await redis_connection_1.redis_client.keys(`${pattern}*`);
    }
    catch (error) {
        console.log(error, "failed to get keys");
    }
};
exports.keys = keys;
const increment = async (key) => {
    try {
        return await redis_connection_1.redis_client.incr(key);
    }
    catch (error) {
        console.log(error, "failed to increment");
    }
};
exports.increment = increment;
