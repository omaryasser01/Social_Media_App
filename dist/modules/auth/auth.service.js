"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_1 = require("../../common/utils/global-error");
const user_reposatory_1 = __importDefault(require("../../DB/repositories/user.reposatory"));
const hash_1 = require("../../common/utils/security/hash");
const encrypt_1 = require("../../common/utils/security/encrypt");
const sendEmail_1 = require("../../common/utils/mail/sendEmail");
const email_template_1 = require("../../common/utils/mail/email.template");
const email_event_1 = require("../../common/utils/mail/email.event");
const Event_enum_1 = require("../../common/enum/Event.enum");
const user_enum_1 = require("../../common/enum/user.enum");
const resp_success_1 = require("../../common/utils/resp.success");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const node_crypto_1 = require("node:crypto");
const config_service_1 = require("../../config/config.service");
const token_service_1 = __importDefault(require("../../common/service/token.service"));
class Userservice {
    _userModel = new user_reposatory_1.default();
    _redisModel = redis_service_1.default;
    _tokenModel = token_service_1.default;
    constructor() { }
    signUp = async (req, res, next) => {
        let { userName, email, password, age, gender, phone, address, role, } = req.body;
        await this._userModel.checkEmail(email);
        const user = await this._userModel.create({
            userName,
            email,
            password: (0, hash_1.hash)({ plainText: password }),
            age,
            gender,
            phone: phone ? (0, encrypt_1.encrypt)(phone.toString()) : null,
            address,
            role,
        });
        const otp = await (0, sendEmail_1.generateOTP)();
        email_event_1.emailEventEmitter.emit(Event_enum_1.EventEnum.confrimEmail, async () => {
            await (0, sendEmail_1.sendEmail)({
                to: email,
                subject: "Confirm Email",
                html: (0, email_template_1.emailTemp)(otp),
            });
            await this._redisModel.setValue({
                key: this._redisModel.otp_key({
                    email,
                    subject: Event_enum_1.EventEnum.confrimEmail,
                }),
                value: (0, hash_1.hash)({ plainText: `${otp}` }),
                ttl: 60 * 5,
            });
            await this._redisModel.setValue({
                key: this._redisModel.otp_count(email),
                value: 1,
                ttl: 60 * 5,
            });
        });
        (0, resp_success_1.successResp)({
            res,
            message: "Sign Up successful, OTP Sent to your Email",
            data: user,
        });
    };
    verifyACC = async (req, res, next) => {
        const { email, otp } = req.body;
        const otpValue = await this._redisModel.get(this._redisModel.otp_key({ email, subject: Event_enum_1.EventEnum.confrimEmail }));
        if (!otpValue) {
            throw new global_error_1.AppError("OTP expired");
        }
        if (!(0, hash_1.compare)({ plainText: otp, cipherText: otpValue })) {
            throw new global_error_1.AppError("inValid OTP");
        }
        const user = await this._userModel.findOneAndUpdate({
            filter: {
                email,
                provider: user_enum_1.providerEnum.System,
                confirmed: { $exists: false },
            },
            update: { confirmed: true },
        });
        if (!user) {
            throw new global_error_1.AppError("User not found");
        }
        await this._redisModel.deleteKey(this._redisModel.otp_key({ email }));
        (0, resp_success_1.successResp)({ res, message: "Account verified successfully" });
    };
    signIn = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                email,
                confirmed: { $exists: true },
                provider: user_enum_1.providerEnum.System,
            },
        });
        if (!user) {
            throw new Error("user not exists");
        }
        const match = (0, hash_1.compare)({ plainText: password, cipherText: user.password });
        if (!match) {
            throw new Error("invaild password");
        }
        const jwtid = (0, node_crypto_1.randomUUID)();
        const access_token = this._tokenModel.generateToken({
            payload: { id: user._id, email: user.email },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.Access_Secret_key_user
                : config_service_1.Access_Secret_key_admin,
            options: {
                expiresIn: "1h",
                noTimestamp: false,
                jwtid,
            },
        });
        const refresh_token = this._tokenModel.generateToken({
            payload: { id: user._id, email: user.email },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.Refresh_Secret_key_user
                : config_service_1.Refresh_Secret_key_admin,
            options: {
                expiresIn: "1h",
                noTimestamp: false,
                jwtid,
            },
        });
        (0, resp_success_1.successResp)({ res, data: { access_token, refresh_token } });
    };
    getProfile = async (req, res, next) => {
        (0, resp_success_1.successResp)({
            res,
            status: 200,
            message: "done",
            data: { user: req.user, phone: (0, encrypt_1.decrypt)(req.user?.phone) },
        });
    };
}
exports.default = new Userservice();
