"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_service_1 = require("../../../config/config.service");
const sendEmail = async (mailOptions) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: config_service_1.User,
            pass: config_service_1.Pass,
        },
    });
    const info = await transporter.sendMail({
        from: `Admin ${config_service_1.User}`,
        ...mailOptions,
    });
    return console.log(info.accepted.length > 0 ? true : false);
};
exports.sendEmail = sendEmail;
const generateOTP = async () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
