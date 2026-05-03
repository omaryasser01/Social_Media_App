import crypto from "node:crypto";

const ENCRYPTION_KEY = Buffer.from("123812@32$%#312ASRR123123rere365");
const IV_LENGHT = 16;
export function encrypt(text: any) {
  const iv = crypto.randomBytes(IV_LENGHT);

  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf-8", "hex");

  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string) {
  const [ivHex, encryptedText]: string[] = text.split(":");

  const iv = Buffer.from(ivHex!, "hex");

  let decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let decrypt = decipher.update(encryptedText!, "hex", "utf-8");

  decrypt += decipher.final("utf-8");

  return decrypt;
}
