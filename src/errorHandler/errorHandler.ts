import { CustomError } from "errors/customError";
import { Request, Response, NextFunction } from "express";
export class ErrorHandler {
  private logErrors(err: Error) {
    if (err instanceof CustomError && err.logging) console.error(err.message);
    if (!(err instanceof CustomError)) console.error(err.message);
  }
  handleErrors(err: Error, _req: Request, res: Response, next: NextFunction) {
    this.logErrors(err);
    if (err instanceof CustomError) {
      res.status(err.statusCode).json({ message: err.message });
    } else if (err instanceof Error)
      res.status(500).json({
        message: "Oops! Something went wrong... Please try again latter.",
      });
    next();
  }
}
