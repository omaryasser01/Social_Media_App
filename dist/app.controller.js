"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const config_service_1 = require("./config/config.service");
const global_error_1 = require("./common/utils/global-error");
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const connectionDB_1 = require("./DB/connectionDB");
const redis_service_1 = __importDefault(require("./common/service/redis.service"));
const app = (0, express_1.default)();
const port = config_service_1.PORT;
const bootstrap = async () => {
    const rateLimiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP, please try again later.",
        handler: (req, res, next) => {
            throw new global_error_1.AppError("Too many requests from this IP, please try again later.", 429);
        },
    });
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), rateLimiter);
    app.get("/", (req, res) => {
        res.status(200).json({ message: "Welcome to the Social Media App " });
    });
    app.use("/auth", auth_controller_1.default);
    (0, connectionDB_1.checkDBconnection)();
    await redis_service_1.default.connect();
    app.use("/{*demo}", (req, res, next) => {
        throw new global_error_1.AppError(`THIS URL  ${req.originalUrl} IS NOT FOUND`, 404);
    });
    app.use(global_error_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`App is running on port ${port}`);
    });
};
exports.default = bootstrap;
