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
import { confirmEmailDTO, resendDTO, signInDTO, singUpDTO } from "./auth.dto";
import RedisService from "../../common/service/redis.service";
import { randomUUID } from "node:crypto";
import {
  Access_Secret_key_admin,
  Access_Secret_key_user,
  client_ID,
  Refresh_Secret_key_admin,
  Refresh_Secret_key_user,
} from "../../config/config.service";
import TokenService from "../../common/service/token.service";
import { number, uuidv4 } from "zod";
import tokenService from "../../common/service/token.service";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import DefineAccessToken from "../../common/utils/accessToken.define";
import { S3Service } from "../../common/service/s3.service";
import { Store_enum } from "../../common/enum/multer.enum";
import { pipeline } from "node:stream/promises";

class Userservice {
  private readonly _userModel = new UserReposatory();
  private readonly _redisModel = RedisService;
  private readonly _tokenModel = TokenService;
  private readonly _S3service = new S3Service();

  constructor() {}

  //======================================Helper function to send OTP email with rate limiting======================================================
  sendEmailOTP = async ({
    email,
    subject,
  }: {
    email: string;
    subject: EventEnum;
  }) => {
    const block = (await this._redisModel.ttl(
      this._redisModel.block_otp(email),
    )) as number;
    if (block > 0) {
      throw new AppError(
        `You have exceeded the maximum number of OTP requests. Please try again after ${block} seconds.`,
      );
    }

    const OTPttl = await this._redisModel.ttl(
      this._redisModel.otp_key({ email, subject }),
    );
    if (OTPttl && OTPttl > 0) {
      throw new AppError(
        `Please wait ${OTPttl} seconds before requesting a new OTP`,
      );
    }

    const otp_count = await this._redisModel.get(
      this._redisModel.otp_count(email),
    );
    if (otp_count >= 3) {
      await this._redisModel.setValue({
        key: this._redisModel.block_otp(email),
        value: 1,
        ttl: 60 * 7,
      });
      throw new AppError(
        "You have exceeded the maximum number of OTP requests. Please try again later.",
      );
    }

    let otp = await generateOTP();

    emailEventEmitter.emit("sendOTP", async () => {
      await sendEmail({
        to: email,
        subject: "re-sent OTP",
        html: emailTemp(otp),
      });

      await this._redisModel.setValue({
        key: this._redisModel.otp_key({ email, subject }),
        value: hash({ plainText: `${otp}` }),
        ttl: 2 * 60,
      });
      await this._redisModel.increment(this._redisModel.otp_count(email));
    });
  };

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
        ttl: 60 * 3,
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
        //confirmed: { $exists: true },
        provider: providerEnum.System,
      },
    });

    if (!user) {
      throw new AppError("user not exists");
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

  //==================================Re-send OTP=================================================================
  resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: resendDTO = req.body;

    const user = await this._userModel.findOne({
      filter: {
        email,
        provider: providerEnum.System,
        confirmed: { $exists: false },
      },
    });

    if (!user) {
      throw new AppError("User not found or already confirmed");
    }

    await this.sendEmailOTP({ email, subject: EventEnum.confrimEmail });

    successResp({
      res,
      status: 200,
      message: "New OTP sent to your email",
    });
  };

  //========================================forget password=============================
  forgetPass = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

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

    const resetTOken = TokenService.generateToken({
      payload: {
        id: user._id,
        email: user.email,
      },
      secret_key:
        user?.role == RoleEnum.user
          ? Access_Secret_key_user!
          : Access_Secret_key_admin!,
      options: {
        expiresIn: "15m",
        noTimestamp: true,
        jwtid: uuidv4(),
      },
    });

    const tokenHash = hash({ plainText: resetTOken });
    await this._redisModel.setValue({
      key: this._redisModel.reset_pass_key(email),
      value: tokenHash,
      ttl: 15 * 60,
    });

    // await sendEmail(email, `Your password reset token: ${resetTOken}`);
    await sendEmail({
      to: email,
      subject: "reset password",
    });
    //await sendEmailOTP({ email, subject: emailEnum.forgetPass });

    successResp({ res, message: "OTP sent to your email" });
  };

  //========================================reset password=============================
  resetPass = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPass } = req.body;

    const otpValuea = await this._redisModel.get(
      this._redisModel.otp_key({ email, subject: EventEnum.forgetPass }),
    );

    if (!otpValuea) {
      throw new Error("OTP expired");
    }

    if (!compare({ plainText: otp, cipherText: otpValuea })) {
      throw new Error("inValid OTP");
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: {
        email,
        confirmed: { $exists: true },
        provider: providerEnum.System,
      },
      update: { password: hash({ plainText: newPass }) },
    });

    if (!user) {
      throw new Error("user not exists");
    }

    await this._redisModel.deleteKey(
      this._redisModel.otp_key({ email, subject: EventEnum.forgetPass }),
    );

    successResp({ res, message: "Password reset successfully" });
  };

  //======================================Sign UP with Gmail======================================================

  signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: client_ID!,
    });
    const payload = ticket.getPayload();

    const { email, email_verified, name, picture } = payload as TokenPayload;

    let user = (await this._userModel.findOne({
      filter: { email: email! },
    })) as IUser;

    if (!user) {
      user = await this._userModel.create({
        email: email!,
        confirmed: email_verified!,
        userName: name!,
        //profilePicture: picture,
        provider: providerEnum.Google,
      } as HydratedDocument<IUser>);
    }

    if (user.provider == providerEnum.System) {
      throw new Error("please login using system", { cause: 400 });
    }

    const access_token = tokenService.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key:
        user?.role == RoleEnum.user
          ? Access_Secret_key_user!
          : Access_Secret_key_admin!,
      options: {
        expiresIn: "1d",
        noTimestamp: true,
        jwtid: uuidv4(),
      },
    });

    successResp({ res, message: "success login", data: { access_token } });
  };

  //==================================upload=================================================================

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const key = await this._S3service.uploadFiles({
      //   files: req.files as Express.Multer.File[],
      //   path: "Users/many",
      // });

      const { fileName, ContentType } = req.body;

      const { url, Key } = await this._S3service.createPreSignedUrl({
        fileName,
        ContentType,
        path: `Users/${req?.user?._id}`,
      });

      // await this._userModel.findOneAndUpdate({
      //   filter: { _id: req?.user?._id },
      //   update: { profilePic: Key },
      // });

      successResp({
        res,
        status: 200,
        message: "done",
        data: { Key, url },
      });
    } catch (error) {
      next(error);
    }
  };

  //==================================get file=================================================================
  getFile = async (req: Request, res: Response) => {
    const { path } = req.params as { path: string[] };
    const Key = path.join("/");
    const result = await new S3Service().getFile(Key);
    const stream = result.Body as NodeJS.ReadableStream;
    res.setHeader("Content-Type", result.ContentType!);
    await pipeline(stream, res);
    successResp({ res, data: Key });
  };

  //==================================get URL=================================================================
  getUrl = async (req: Request, res: Response) => {
    const { path } = req.params as { path: string[] };
    const Key = path.join("/");

    const url = await new S3Service().getPreSignedUrl({ Key });

    successResp({ res, data: url });
  };

  //==================================Delete File=================================================================
  deleteFile = async (req: Request, res: Response) => {
    const { Key } = req.query as { Key: string };
    const result = await new S3Service().deleteFile(Key);

    successResp({ res, data: result });
  };

  //==================================Delete Folder=================================================================
  deleteFolder = async (req: Request, res: Response) => {
    const { folderName } = req.body as { folderName: string };

    const result = await new S3Service().deleteFolder(folderName);
    successResp({ res, data: result });
  };
}

export default new Userservice();
