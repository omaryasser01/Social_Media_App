"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResp = void 0;
const successResp = ({ res, status = 200, message = "done", data = undefined, }) => {
    return res.status(status).json({ message, data });
};
exports.successResp = successResp;
