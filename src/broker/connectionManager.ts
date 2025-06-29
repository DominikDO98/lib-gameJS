import { logger } from "../logger/logger";
import { RpcConnection } from "./connection";
import { ConsumeMessage } from "amqplib";
import { RpcRepository } from "./repository";

export class RpcConnectionMenager {
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
      this._conn.init();
    } catch (err) {
      logger.error(err as string, "Rpc Controller", true);
    }
  }
  listenQ(
    queue: string,
    callback: (replyQueue: string, msg: ConsumeMessage | null) => void
  ) {
    try {
      this._repo.listenQ(queue, callback).then(() => {
        logger.log(
          `Rpc Contorller is listening for ${callback.name} request`,
          "Rpc Controller",
          false
        );
      });
    } catch (err) {
      logger.error(err as string, "Rpc Controller", true);
    }
  }
  sendCall(
    queue: string,
    msg: string,
    callback: (reply: ConsumeMessage | null) => void
  ) {
    try {
      this._repo.sendCall(queue, msg, callback);
    } catch (err) {
      logger.error(err as string, "Rpc Controller", true);
    }
  }
  replyCall(replyQueue: string, msg: string) {
    try {
      this._repo.replyCall(replyQueue, msg);
    } catch (err) {
      logger.error(err as string, "Rpc Controller", true);
    }
  }
  private async checkConnection() {
    const q = "checkHealth";
    await this._conn.channel?.assertQueue(q);
    const res = await this._conn.channel?.checkQueue(q);
    if (!res) {
      this.isAlive = false;
    }
  }
  async reconnect() {
    setInterval(async () => {
      this.checkConnection();
      if (!this.isAlive) {
        this.init();
      }
    }, 1000);
  }
}
