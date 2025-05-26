import chalk, { ChalkInstance } from "chalk";
import winston from "winston";
import path from "path";

interface IColors {
  info: ChalkInstance;
  warn: ChalkInstance;
  error: ChalkInstance;
}
const colors: IColors = {
  info: chalk.white,
  warn: chalk.yellow,
  error: chalk.red,
};
class Logger {
  private _winston;
  constructor() {
    this._winston = winston.createLogger({
      levels: {
        error: 0,
        warn: 1,
        info: 2,
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.printf(({ level, message, ...meta }) => {
            const place = (meta[Symbol.for("splat")] as [string, boolean])[0];
            const time = this.getTime();
            return `${colors[level as keyof IColors](level.toUpperCase())} ${
              time[0]
            } ${chalk.grey(time[1])} ${place.toUpperCase()}: ${message}`;
          }),
        }),
        new winston.transports.File({
          filename: path.join(
            __dirname,
            "/logs/",
            `log ${this.getTime()[0]}.log`
          ),
          format: winston.format.combine(
            winston.format((info) => {
              const save = (info[Symbol.for("splat")] as [string, boolean])[1];
              return save ? info : false;
            })(),
            winston.format.printf(({ level, message, ...meta }) => {
              const place = (meta[Symbol.for("splat")] as [string, boolean])[0];
              const time = this.getTime();
              return `${level.toUpperCase()} ${time[0]} ${
                time[1]
              } ${place.toUpperCase()}: ${message} `;
            })
          ),
        }),
      ],
    });
  }
  private getTime() {
    const date = new Date();
    const h = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    const y = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;
    return [y, h];
  }
  log(message: string, place: string, save?: boolean) {
    this._winston.info(message, place, save);
  }
  warn(message: string, place: string, save?: boolean) {
    this._winston.warn(message, place, save);
  }
  error(message: string, place: string, save?: boolean) {
    this._winston.error(message, place, save);
  }
}
export const logger = new Logger();
