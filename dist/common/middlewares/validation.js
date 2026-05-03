"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const global_error_1 = require("../utils/global-error");
const validation = (schema) => {
    return (req, res, next) => {
        const validatioError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validatioError.push(result.error.message);
            }
            if (validatioError.length > 0) {
                throw new global_error_1.AppError(JSON.parse(validatioError), 400);
            }
        }
        next();
    };
};
exports.validation = validation;
