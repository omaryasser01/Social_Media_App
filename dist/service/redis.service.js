"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_service_1 = require("../config/config.service");
const Event_enum_1 = require("../common/enum/Event.enum");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.Redis_Url,
        });
        this.handleEvent();
    }
    async connect() {
        this.client.connect();
        console.log("connected to Redis successfully");
    }
    handleEvent() {
        this.client.on("error", (error) => {
            console.log("Faild to connect to Radis", error);
        });
    }
    revoked_key = ({ userId, jti }) => {
        return `revoke_toke::${userId}::${jti}`;
    };
    get_key = (userId) => {
        return `token::${userId}`;
    };
    otp_key = ({ email, subject = Event_enum_1.EventEnum.confrimEmail, }) => {
        return `otp::${email}::${subject}`;
    };
}
