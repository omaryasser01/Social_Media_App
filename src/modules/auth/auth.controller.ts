import { Router } from "express";
import usersService from "./auth.service";
import { validation } from "../../common/middlewares/validation";
import * as UV from "./auth.validation";
import { authentication } from "../../common/middlewares/authentication";
import multerCloud from "../../common/middlewares/multer.cloud";
import { Store_enum } from "../../common/enum/multer.enum";

const authRouter = Router();

authRouter.post("/signup", validation(UV.signUpSchema), usersService.signUp);

authRouter.post(
  "/signupGmail",
  validation(UV.signUpSchema),
  usersService.signUpWithGmail,
);

authRouter.post("/signin", validation(UV.signInSchema), usersService.signIn);

authRouter.post(
  "/confirm",
  validation(UV.confirmEmailSchema),
  usersService.verifyACC,
);

authRouter.get("/profile", authentication, usersService.getProfile);

authRouter.post(
  "/upload",
  authentication,
  //multerCloud({ storageType: Store_enum.memory }).array("attachment"),
  usersService.upload,
);

authRouter.post(
  "/resend",
  validation(UV.resendOtpSchema),
  usersService.resendOTP,
);
authRouter.delete(
  "/upload/deleteFolder",
  authentication,
  usersService.deleteFolder,
);
authRouter.get("/upload/*path", authentication, usersService.getFile);
authRouter.get("/upload/pre-signed/*path", authentication, usersService.getUrl);
authRouter.get("/upload/delete", authentication, usersService.deleteFile);

export default authRouter;
