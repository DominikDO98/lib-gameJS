export class CustomError extends Error {
  private _defaultCode = 500;
  public statusCode: number;
  public logging?: boolean;
  public origin?: string;
  constructor(
    message: string,
    code?: number,
    logging?: boolean,
    origin?: string
  ) {
    super();
    this.message = message;
    this.statusCode = code ? code : this._defaultCode;
    this.logging = logging ? logging : true;
    this.origin = origin;
  }
}
