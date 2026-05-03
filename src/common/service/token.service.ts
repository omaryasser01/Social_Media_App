import jwt, {
  Jwt,
  JwtPayload,
  PrivateKey,
  PublicKey,
  Secret,
  SignOptions,
  VerifyOptions,
} from "jsonwebtoken";
import { Types } from "mongoose";

interface IjwtPayload extends JwtPayload {
  id: Types.ObjectId;
}

class TokenService {
  constructor() {}

  generateToken = ({
    payload,
    secret_key, //= SECRET_KEY
    options = {},
  }: {
    payload: object;
    secret_key: Secret | PrivateKey | string;
    options?: SignOptions;
  }): string => {
    return jwt.sign(payload, secret_key, options);
  };

  verifyToken = ({
    token,
    secret_key,
    options = {},
  }: {
    token: string;
    secret_key: Secret | PublicKey;
    options?: VerifyOptions & { complete?: false };
  }): IjwtPayload => {
    return jwt.verify(token, secret_key, options) as IjwtPayload;
  };
}

export default new TokenService();
