import { CustomError } from "./customError.js";

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.logging = true;
  }
}
