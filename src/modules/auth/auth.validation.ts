import * as z from "zod";
import { genderEnum, RoleEnum } from "../../common/enum/user.enum";

export const resendOtpSchema = {
  body: z.object({
    email: z.email(),
  }),
};

export const signInSchema = {
  body: resendOtpSchema.body.safeExtend({
    password: z.string().min(6),
  }),
};

export const signUpSchema = {
  body: signInSchema.body
    .safeExtend({
      userName: z.string({ error: "username is required" }),
      cPassword: z.string().min(6),
      gender: z.enum(genderEnum),
      role: z.enum(RoleEnum).optional(),
      phone: z.number({ error: "sssssssssss" }).optional(),
      age: z.number(),
      address: z.string().optional(),
    })
    .refine(
      (data) => {
        return data.password === data.cPassword;
      },
      {
        error: "password and confirm password must be same",
        path: ["cPassword"],
      },
    ),
};

export const confirmEmailSchema = {
  body: z.object({
    email: z.email(),
    role: z.enum(RoleEnum).optional(),
    otp: z.string(),
  }),
};
