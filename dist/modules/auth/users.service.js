"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Userservice {
    constructor() { }
    signUp = async (req, res, next) => {
        let { userName, email, password } = req.body;
        res.status(200).json({ message: "Sign in successful" });
    };
    signIn = async (req, res, next) => {
        res.status(200).json({ message: "Sign in successful" });
    };
}
exports.default = new Userservice();
