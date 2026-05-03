"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_enum_1 = require("../../common/enum/user.enum");
const userSchema = new mongoose_1.default.Schema({
    fName: {
        type: String,
        required: true,
        trim: true,
        min: 5,
        max: 25,
    },
    lName: {
        type: String,
        required: true,
        trim: true,
        min: 5,
        max: 25,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    age: {
        type: Number,
        trim: true,
        required: true,
    },
    gender: {
        type: String,
        enum: user_enum_1.genderEnum,
        required: true,
    },
    role: {
        type: String,
        enum: user_enum_1.RoleEnum,
        default: user_enum_1.RoleEnum.user,
    },
    phone: {
        type: String,
        trim: true,
    },
    confirmed: Boolean,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("userName")
    .get(function () {
    return this.fName + " " + this.lName;
})
    .set(function (val) {
    this.set({ fName: val.split(" ")[0], lName: val.split(" ")[1] });
});
const userModel = mongoose_1.default.models.user || mongoose_1.default.model("user", userSchema);
exports.default = userModel;
