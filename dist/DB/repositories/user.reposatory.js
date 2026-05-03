"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../models/user.model"));
const base_reposatory_1 = __importDefault(require("./base.reposatory"));
const global_error_1 = require("../../common/utils/global-error");
class UserReposatory extends base_reposatory_1.default {
    model;
    constructor(model = user_model_1.default) {
        super(model);
        this.model = model;
    }
    async checkEmail(email) {
        const emailExist = await this.model.findOne({ email });
        if (emailExist) {
            throw new global_error_1.AppError("email already exist", 409);
        }
    }
}
exports.default = UserReposatory;
