import { NextFunction, Request, Response } from "express";
import TokenService from "../../common/service/token.service";
import {
  Access_Secret_key_user,
  Prefix_user,
  Prefix_admin,
  Access_Secret_key_admin,
} from "../../config/config.service";
import UserReposatory from "../../DB/repositories/user.reposatory";
import RedisService from "../../common/service/redis.service";
import { AppError } from "../utils/global-error";

// export interface IRequest extends Request {
//   user?: HydratedDocument<IUser>;
//   decode?: JwtPayload;
// }

const dbService = new UserReposatory();

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new AppError("authorization not exist");
  }

  const [prefix, token]: string[] = authorization.split(" ");

  if (!token) {
    throw new AppError("token not found");
  }

  let Access_secret_key: string | undefined = "";

  if (prefix == Prefix_user) {
    Access_secret_key = Access_Secret_key_user;
    console.log("user");
  } else if (prefix == Prefix_admin) {
    Access_secret_key = Access_Secret_key_admin;
    console.log("admin");
  } else {
    throw new AppError("inValid Prefix");
  }

  const decode = TokenService.verifyToken({
    token,
    secret_key: Access_secret_key!,
  });

  if (!decode || !decode?.id) {
    throw new AppError("invalid token payload");
  }

  const user = await dbService.findOne({
    filter: { _id: decode.id },
    // options: {
    //   select: "-password",
    // },
  });

  if (!user) {
    throw new AppError("user not exists", 400);
  }

  //   if (user?.changeCred?.getTime() > decode.iat * 1000) {
  //     throw new AppError("inValid Token");
  //   }

  const revokeToken = await RedisService.get(
    RedisService.revoked_key({ userId: decode.id, jti: decode.jti! }),
  );
  if (revokeToken) {
    throw new AppError("invalid token Revoked");
  }

  req.user = user;
  req.decode = decode;

  next();
};
