import { logger } from "../logger/logger";
import { RpcConnection } from "./connection";
import { ConsumeMessage } from "amqplib";
import { RpcRepository } from "./repository";

export class RpcConnectionManager {
  public isAlive: boolean = false;
  private _conn: RpcConnection;
  private _repo: RpcRepository;

  get conn() {
    return this._conn;
  }
  constructor() {
    this._conn = new RpcConnection();
    this._repo = new RpcRepository(this._conn);
  }
  async init() {
    try {
      await this._conn.init();
      if (this.isAlive)
        logger.log("Broker initialization is over...", "Rpc Menager", false);
    } catch (err) {
      logger.error(err as string, "Rpc Menager", true);
    }
  }
  async listenQ(
    queue: string,
    callback: (replyQueue: string, msg: ConsumeMessage | null) => void,
    controller: string
  ) {
    try {
      await this._repo.listenQ(queue, callback).then(() => {
        logger.log(
          `Route for ${callback.name.split(" ")[1]} has been established`,
          controller,
          false
        );
      });
    } catch (err) {
      logger.error(err as string, "Rpc Menager", true);
    }
  }
  async sendCall(
    queue: string,
    msg: string,
    callback: (reply: ConsumeMessage | null) => void
  ) {
    try {
      await this._repo.sendCall(queue, msg, callback);
    } catch (err) {
      logger.error(err as string, "Rpc Menager", true);
    }
  }
  async replyCall(replyQueue: string, msg: string) {
    try {
      await this._repo.replyCall(replyQueue, msg);
    } catch (err) {
      logger.error(err as string, "Rpc Menager", true);
    }
  }
  private async checkConnection() {
    try {
      this._conn.validateConnection();
      const q = "checkHealth";
      if (this._conn.channel && this._conn.connection) {
        await this._conn.channel?.assertQueue(q);
        this.isAlive = (await this._conn.channel?.checkQueue(q)) ? true : false;
      }
      return;
    } catch (error) {
      this._conn.disconnect();
      this.isAlive = false;
    }
  }
  reconnect() {
    setInterval(async () => {
      this.checkConnection();
      if (!this.isAlive) {
        this.init();
      }
    }, 3000);
  }
}
