import { hashSync, compareSync } from "bcrypt";
import { SaltRounds } from "../../../config/config.service";

export const hash = ({
  plainText,
  saltRounds = SaltRounds,
}: {
  plainText: string;
  saltRounds?: number;
}): string => {
  return hashSync(plainText, Number(saltRounds));
};

export const compare = ({
  plainText,
  cipherText,
}: {
  plainText: string;
  cipherText: string;
}): boolean => {
  return compareSync(plainText, cipherText);
};
