import express from "express";
import type { Request, Response, NextFunction, Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { PORT } from "./config/config.service";
import { AppError, globalErrorHandler } from "./common/utils/global-error";
import authRouter from "./modules/auth/auth.controller";
import { checkDBconnection } from "./DB/connectionDB";
import RedisService from "./common/service/redis.service";
const app: Application = express();
const port: number = PORT;

const bootstrap = async () => {
  const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    handler: (req: Request, res: Response, next: NextFunction) => {
      throw new AppError(
        "Too many requests from this IP, please try again later.",
        429,
      );
    },
  });

  app.use(express.json());
  app.use(cors(), helmet(), rateLimiter);

  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome to the Social Media App " });
  });

  app.use("/auth", authRouter);

  checkDBconnection();
  await RedisService.connect();

  app.use("/{*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(`THIS URL  ${req.originalUrl} IS NOT FOUND`, 404);
  });

  app.use(globalErrorHandler);

  app.listen(port, () => {
    console.log(`App is running on port ${port}`);
  });
};

export default bootstrap;
