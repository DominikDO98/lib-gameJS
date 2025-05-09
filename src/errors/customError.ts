export class CustomError extends Error {
  private _defaultCode = 500;
  public statusCode: number;
  public logging?: boolean;
  constructor(message: string, code?: number, logging?: boolean) {
    super();
    this.message = message;
    this.statusCode = code ? code : this._defaultCode;
    this.logging = logging ? logging : true;
  }
}
