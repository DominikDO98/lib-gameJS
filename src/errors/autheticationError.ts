import { CustomError } from "./customError";

export class AutheticaitonError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 401;
    this.logging = false;
  }
}
