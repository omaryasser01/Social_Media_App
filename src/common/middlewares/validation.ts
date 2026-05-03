import { NextFunction, Request, Response } from "express";
import { json, ZodType } from "zod";
import { AppError } from "../utils/global-error";

type reqType = keyof Request;

type schemaType = Partial<Record<reqType, ZodType>>;

export const validation = (schema: schemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validatioError = [];
    for (const key of Object.keys(schema) as reqType[]) {
      if (!schema[key]) continue;
      const result = schema[key].safeParse(req[key]);
      if (!result.success) {
        validatioError.push(result.error.message);
      }
      if (validatioError.length > 0) {
        throw new AppError(
          JSON.parse(validatioError as unknown as string),
          400,
        );
      }
    }
    next();
  };
};
