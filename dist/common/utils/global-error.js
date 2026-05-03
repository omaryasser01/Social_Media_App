"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.AppError = void 0;
class AppError extends Error {
    message;
    status;
    constructor(message, status = 500) {
        super(message);
        this.message = message;
        this.status = status;
        this.message = message;
    }
}
exports.AppError = AppError;
const globalErrorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
        message: err.message,
        status: status,
        stack: err.stack,
    });
};
exports.globalErrorHandler = globalErrorHandler;
