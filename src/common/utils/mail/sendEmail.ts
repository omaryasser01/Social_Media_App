import nodemailer from "nodemailer";
import { Pass, User } from "../../../config/config.service";
import { emailTemp } from "../mail/email.template";
import Mail from "nodemailer/lib/mailer";

export const sendEmail = async (mailOptions: Mail.Options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: User,
      pass: Pass,
    },
  });

  const info = await transporter.sendMail({
    from: `Admin ${User}`,
    ...mailOptions,
  });

  return console.log(info.accepted.length > 0 ? true : false);
};

export const generateOTP = async (): Promise<string> => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
