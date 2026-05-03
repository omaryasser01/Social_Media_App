import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utils/global-error";
import { IUser } from "../../DB/models/user.model";
import { HydratedDocument, Model } from "mongoose";
import UserReposatory from "../../DB/repositories/user.reposatory";
import { compare, hash } from "../../common/utils/security/hash";
import { decrypt, encrypt } from "../../common/utils/security/encrypt";
import { generateOTP, sendEmail } from "../../common/utils/mail/sendEmail";
import { emailTemp } from "../../common/utils/mail/email.template";
import { emailEventEmitter } from "../../common/utils/mail/email.event";
import { EventEnum } from "../../common/enum/Event.enum";
import { providerEnum, RoleEnum } from "../../common/enum/user.enum";
import { successResp } from "../../common/utils/resp.success";
import { confirmEmailDTO, signInDTO, singUpDTO } from "./auth.dto";
import RedisService from "../../common/service/redis.service";
import { randomUUID } from "node:crypto";
import {
  Access_Secret_key_admin,
  Access_Secret_key_user,
  Refresh_Secret_key_admin,
  Refresh_Secret_key_user,
} from "../../config/config.service";
import TokenService from "../../common/service/token.service";

class Userservice {
  private readonly _userModel = new UserReposatory();
  private readonly _redisModel = RedisService;
  private readonly _tokenModel = TokenService;

  constructor() {}

  //==================================sign Up=================================================================
  signUp = async (req: Request, res: Response, next: NextFunction) => {
    let {
      userName,
      email,
      password,
      age,
      gender,
      phone,
      address,
      role,
    }: singUpDTO = req.body;

    await this._userModel.checkEmail(email);

    const user = await this._userModel.create({
      userName,
      email,
      password: hash({ plainText: password }),
      age,
      gender,
      phone: phone ? encrypt(phone.toString()) : null,
      address,
      role,
    } as HydratedDocument<IUser>);

    const otp = await generateOTP();

    emailEventEmitter.emit(EventEnum.confrimEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Confirm Email",
        html: emailTemp(otp),
      });

      await this._redisModel.setValue({
        key: this._redisModel.otp_key({
          email,
          subject: EventEnum.confrimEmail,
        }),
        value: hash({ plainText: `${otp}` }),
        ttl: 60 * 5,
      });

      await this._redisModel.setValue({
        key: this._redisModel.otp_count(email),
        value: 1,
        ttl: 60 * 5,
      });
    });

    successResp({
      res,
      message: "Sign Up successful, OTP Sent to your Email",
      data: user,
    });
  };

  //==================================confirm email=================================================================
  verifyACC = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp }: confirmEmailDTO = req.body;

    const otpValue = await this._redisModel.get(
      this._redisModel.otp_key({ email, subject: EventEnum.confrimEmail }),
    );
    if (!otpValue) {
      throw new AppError("OTP expired");
    }
    if (!compare({ plainText: otp, cipherText: otpValue })) {
      throw new AppError("inValid OTP");
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: {
        email,
        provider: providerEnum.System,
        confirmed: { $exists: false },
      },
      update: { confirmed: true },
    });

    if (!user) {
      throw new AppError("User not found");
    }

    await this._redisModel.deleteKey(this._redisModel.otp_key({ email }));

    successResp({ res, message: "Account verified successfully" });
  };

  //==================================sign In=================================================================
  signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: signInDTO = req.body;

    const user = await this._userModel.findOne({
      filter: {
        email,
        confirmed: { $exists: true },
        provider: providerEnum.System,
      },
    });

    if (!user) {
      throw new Error("user not exists");
    }

    const match = compare({ plainText: password, cipherText: user.password });

    if (!match) {
      throw new Error("invaild password");
    }

    const jwtid = randomUUID();

    const access_token = this._tokenModel.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key:
        user?.role == RoleEnum.user
          ? Access_Secret_key_user!
          : Access_Secret_key_admin!,
      options: {
        expiresIn: "1h",
        noTimestamp: false,
        jwtid,
      },
    });

    const refresh_token = this._tokenModel.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key:
        user?.role == RoleEnum.user
          ? Refresh_Secret_key_user!
          : Refresh_Secret_key_admin!,
      options: {
        expiresIn: "1h",
        noTimestamp: false,
        jwtid,
      },
    });

    successResp({ res, data: { access_token, refresh_token } });
  };

  //==================================get profile=================================================================

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    successResp({
      res,
      status: 200,
      message: "done",
      data: { user: req.user, phone: decrypt(req.user?.phone!) },
    });
  };
}

export default new Userservice();
