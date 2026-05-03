"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEventEmitter = void 0;
const node_events_1 = require("node:events");
const Event_enum_1 = require("../../enum/Event.enum");
exports.emailEventEmitter = new node_events_1.EventEmitter();
exports.emailEventEmitter.on(Event_enum_1.EventEnum.confrimEmail, async (fn) => {
    await fn();
});
