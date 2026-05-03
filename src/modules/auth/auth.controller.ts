import { Router } from "express";
import usersService from "./auth.service";
import { validation } from "../../common/middlewares/validation";
import * as UV from "./auth.validation";
import { authentication } from "../../common/middlewares/authentication";

const authRouter = Router();

authRouter.post("/signup", validation(UV.signUpSchema), usersService.signUp);

authRouter.post("/signin", validation(UV.signInSchema), usersService.signIn);

authRouter.post(
  "/confirm",
  validation(UV.confirmEmailSchema),
  usersService.verifyACC,
);

authRouter.get("/profile", authentication, usersService.getProfile);

export default authRouter;
