import type { Request, Response, NextFunction, Application } from "express";

export class AppError extends Error {
  constructor(
    public message: any,
    public status: number = 500,
  ) {
    super(message);
    this.message = message;
  }
}

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message,
    status: status,
    stack: err.stack,
  });
};
