import { CustomError } from "./customError";

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.logging = false;
  }
}
