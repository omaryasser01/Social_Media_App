import { EventEmitter } from "node:events";
import { EventEnum } from "../../enum/Event.enum";

export const emailEventEmitter = new EventEmitter();

emailEventEmitter.on(EventEnum.confrimEmail, async (fn) => {
  await fn();
});
