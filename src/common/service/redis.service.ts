import { createClient, RedisClientType } from "redis";
import { Redis_Url } from "../../config/config.service";
import { EventEnum } from "../enum/Event.enum";
import { Types } from "mongoose";

class RedisService {
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: Redis_Url!,
    });
    this.handleEvents();
  }

  handleEvents() {
    this.client.on("error", (error) => {
      console.log("error connecting to redis", error);
    });
  }

  async connect() {
    this.client.connect();
    console.log("connected to redis successfully");
  }

  otp_key = ({
    email,
    subject = EventEnum.confrimEmail,
  }: {
    email: string;
    subject?: EventEnum;
  }): string => {
    return `otp::${email}::${subject}`;
  };

  otp_count = (email: string) => {
    return `${this.otp_key({ email })}::count`;
  };

  block_otp = (email: string) => {
    return `${this.otp_key({ email })}::block`;
  };

  revoked_key = ({ userId, jti }: { userId: Types.ObjectId; jti: string }) => {
    return `revoke_token::${userId}::${jti}`;
  };

  get_key = (userId: Types.ObjectId) => {
    return `revoke_token::${userId}`;
  };

  setValue = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | object | number;
    ttl: number;
  }) => {
    try {
      const data = typeof value == "string" ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, { EX: ttl })
        : await this.client.set(key, data);
    } catch (error) {
      console.log(error, "failed to set");
    }
  };

  update = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string;
    ttl: number;
  }) => {
    try {
      if (!(await this.client.exists(key))) return 0;
      return await this.setValue({ key, value, ttl });
    } catch (error) {
      console.log(error, "failed to update");
    }
  };

  get = async (key: string) => {
    try {
      try {
        return JSON.parse((await this.client.get(key)) as string);
      } catch (error) {
        return await this.client.get(key);
      }
    } catch (error) {
      console.log(error, "failed to get");
    }
  };

  ttl = async (key: string) => {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.log(error, "failed to get ttl");
    }
  };

  exists = async (key: string) => {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.log(error, "failed to check existence");
    }
  };

  expire = async ({ key, ttl }: { key: string; ttl: number }) => {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.log(error, "failed to SET expire");
    }
  };

  deleteKey = async (key: string | string[]) => {
    try {
      if (!key.length) return 0;
      return await this.client.del(key);
    } catch (error) {
      console.log(error, "failed to delete key");
    }
  };

  keys = async (pattern: string) => {
    try {
      return await this.client.keys(`${pattern}*`);
    } catch (error) {
      console.log(error, "failed to get keys");
    }
  };

  increment = async (key: string) => {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.log(error, "failed to increment");
    }
  };
}
export default new RedisService();
