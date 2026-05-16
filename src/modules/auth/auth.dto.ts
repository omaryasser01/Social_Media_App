import * as z from "zod";
import {
  confirmEmailSchema,
  resendOtpSchema,
  signInSchema,
  signUpSchema,
} from "./auth.validation";

export type confirmEmailDTO = z.infer<typeof confirmEmailSchema.body>;
export type signInDTO = z.infer<typeof signInSchema.body>;
export type singUpDTO = z.infer<typeof signUpSchema.body>;
export type resendDTO = z.infer<typeof resendOtpSchema.body>;
