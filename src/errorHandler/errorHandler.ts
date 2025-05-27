import { NextFunction, Request, Response } from "express";
import { CustomError } from "../errors/customError";
import { logger } from "../logger/logger";
export class ErrorHandler {
  handleErrors(err: Error, _req: Request, res: Response, next: NextFunction) {
    if (err instanceof CustomError) {
      logger.error(
        err.message,
        err.origin ? err.origin : "unkown",
        err.logging
      );
      res.status(err.statusCode).json({ message: err.message });
    } else if (err instanceof Error) {
      logger.error(err.message, "unkwon", true);
      res.status(500).json({
        message: "Oops! Something went wrong... Please try again latter.",
      });
    }
    next();
  }
}
