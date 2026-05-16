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
const zod_1 = require("zod");
const token_service_2 = __importDefault(require("../../common/service/token.service"));
const google_auth_library_1 = require("google-auth-library");
const s3_service_1 = require("../../common/service/s3.service");
const promises_1 = require("node:stream/promises");
class Userservice {
    _userModel = new user_reposatory_1.default();
    _redisModel = redis_service_1.default;
    _tokenModel = token_service_1.default;
    _S3service = new s3_service_1.S3Service();
    constructor() { }
    sendEmailOTP = async ({ email, subject, }) => {
        const block = (await this._redisModel.ttl(this._redisModel.block_otp(email)));
        if (block > 0) {
            throw new global_error_1.AppError(`You have exceeded the maximum number of OTP requests. Please try again after ${block} seconds.`);
        }
        const OTPttl = await this._redisModel.ttl(this._redisModel.otp_key({ email, subject }));
        if (OTPttl && OTPttl > 0) {
            throw new global_error_1.AppError(`Please wait ${OTPttl} seconds before requesting a new OTP`);
        }
        const otp_count = await this._redisModel.get(this._redisModel.otp_count(email));
        if (otp_count >= 3) {
            await this._redisModel.setValue({
                key: this._redisModel.block_otp(email),
                value: 1,
                ttl: 60 * 7,
            });
            throw new global_error_1.AppError("You have exceeded the maximum number of OTP requests. Please try again later.");
        }
        let otp = await (0, sendEmail_1.generateOTP)();
        email_event_1.emailEventEmitter.emit("sendOTP", async () => {
            await (0, sendEmail_1.sendEmail)({
                to: email,
                subject: "re-sent OTP",
                html: (0, email_template_1.emailTemp)(otp),
            });
            await this._redisModel.setValue({
                key: this._redisModel.otp_key({ email, subject }),
                value: (0, hash_1.hash)({ plainText: `${otp}` }),
                ttl: 2 * 60,
            });
            await this._redisModel.increment(this._redisModel.otp_count(email));
        });
    };
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
                ttl: 60 * 3,
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
                provider: user_enum_1.providerEnum.System,
            },
        });
        if (!user) {
            throw new global_error_1.AppError("user not exists");
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
    resendOTP = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                email,
                provider: user_enum_1.providerEnum.System,
                confirmed: { $exists: false },
            },
        });
        if (!user) {
            throw new global_error_1.AppError("User not found or already confirmed");
        }
        await this.sendEmailOTP({ email, subject: Event_enum_1.EventEnum.confrimEmail });
        (0, resp_success_1.successResp)({
            res,
            status: 200,
            message: "New OTP sent to your email",
        });
    };
    forgetPass = async (req, res, next) => {
        const { email } = req.body;
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
        const resetTOken = token_service_1.default.generateToken({
            payload: {
                id: user._id,
                email: user.email,
            },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.Access_Secret_key_user
                : config_service_1.Access_Secret_key_admin,
            options: {
                expiresIn: "15m",
                noTimestamp: true,
                jwtid: (0, zod_1.uuidv4)(),
            },
        });
        const tokenHash = (0, hash_1.hash)({ plainText: resetTOken });
        await this._redisModel.setValue({
            key: this._redisModel.reset_pass_key(email),
            value: tokenHash,
            ttl: 15 * 60,
        });
        await (0, sendEmail_1.sendEmail)({
            to: email,
            subject: "reset password",
        });
        (0, resp_success_1.successResp)({ res, message: "OTP sent to your email" });
    };
    resetPass = async (req, res, next) => {
        const { email, otp, newPass } = req.body;
        const otpValuea = await this._redisModel.get(this._redisModel.otp_key({ email, subject: Event_enum_1.EventEnum.forgetPass }));
        if (!otpValuea) {
            throw new Error("OTP expired");
        }
        if (!(0, hash_1.compare)({ plainText: otp, cipherText: otpValuea })) {
            throw new Error("inValid OTP");
        }
        const user = await this._userModel.findOneAndUpdate({
            filter: {
                email,
                confirmed: { $exists: true },
                provider: user_enum_1.providerEnum.System,
            },
            update: { password: (0, hash_1.hash)({ plainText: newPass }) },
        });
        if (!user) {
            throw new Error("user not exists");
        }
        await this._redisModel.deleteKey(this._redisModel.otp_key({ email, subject: Event_enum_1.EventEnum.forgetPass }));
        (0, resp_success_1.successResp)({ res, message: "Password reset successfully" });
    };
    signUpWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_service_1.client_ID,
        });
        const payload = ticket.getPayload();
        const { email, email_verified, name, picture } = payload;
        let user = (await this._userModel.findOne({
            filter: { email: email },
        }));
        if (!user) {
            user = await this._userModel.create({
                email: email,
                confirmed: email_verified,
                userName: name,
                provider: user_enum_1.providerEnum.Google,
            });
        }
        if (user.provider == user_enum_1.providerEnum.System) {
            throw new Error("please login using system", { cause: 400 });
        }
        const access_token = token_service_2.default.generateToken({
            payload: { id: user._id, email: user.email },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.Access_Secret_key_user
                : config_service_1.Access_Secret_key_admin,
            options: {
                expiresIn: "1d",
                noTimestamp: true,
                jwtid: (0, zod_1.uuidv4)(),
            },
        });
        (0, resp_success_1.successResp)({ res, message: "success login", data: { access_token } });
    };
    upload = async (req, res, next) => {
        try {
            const { fileName, ContentType } = req.body;
            const { url, Key } = await this._S3service.createPreSignedUrl({
                fileName,
                ContentType,
                path: `Users/${req?.user?._id}`,
            });
            (0, resp_success_1.successResp)({
                res,
                status: 200,
                message: "done",
                data: { Key, url },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getFile = async (req, res) => {
        const { path } = req.params;
        const Key = path.join("/");
        const result = await new s3_service_1.S3Service().getFile(Key);
        const stream = result.Body;
        res.setHeader("Content-Type", result.ContentType);
        await (0, promises_1.pipeline)(stream, res);
        (0, resp_success_1.successResp)({ res, data: Key });
    };
    getUrl = async (req, res) => {
        const { path } = req.params;
        const Key = path.join("/");
        const url = await new s3_service_1.S3Service().getPreSignedUrl({ Key });
        (0, resp_success_1.successResp)({ res, data: url });
    };
    deleteFile = async (req, res) => {
        const { Key } = req.query;
        const result = await new s3_service_1.S3Service().deleteFile(Key);
        (0, resp_success_1.successResp)({ res, data: result });
    };
    deleteFolder = async (req, res) => {
        const { folderName } = req.body;
        const result = await new s3_service_1.S3Service().deleteFolder(folderName);
        (0, resp_success_1.successResp)({ res, data: result });
    };
}
exports.default = new Userservice();
