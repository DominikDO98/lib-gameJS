import { ConsumeMessage } from "amqplib";
import { logger } from "../logger/logger";
import { RpcConnection } from "./connection";

export class RpcRepository {
  private _conn: RpcConnection;

  constructor(connection: RpcConnection) {
    this._conn = connection;
  }

  async listenQ(
    queue: string,
    callback: (replyQueue: string, msg: ConsumeMessage | null) => void
  ) {
    const replyQueue = `${queue}-reply`;
    await this._conn.channel?.assertQueue(queue);
    await this._conn.channel?.assertQueue(replyQueue);
    await this._conn.channel?.prefetch(1);

    await this._conn.channel?.consume(queue, (msg) => {
      if (!msg) throw Error("No message!");
      logger.log(msg?.content.toString(), "Rpc connection");
      callback(replyQueue, msg);
      this._conn.channel?.ack(msg);
    });
  }
  async sendCall(
    queue: string,
    msg: string,
    callback: (reply: ConsumeMessage | null) => void
  ) {
    this._conn.validateConnection();
    const replyQueue = `${queue}-reply`;
    await this._conn.channel
      ?.assertQueue(queue)
      .then(async () => {
        await this._conn.channel?.assertQueue(replyQueue);
        return this._conn.channel?.sendToQueue(queue, Buffer.from(msg));
      })
      .then(async (send) => {
        if (!send) throw Error("Sending a msg was unsuccesful!");
        await this._conn.channel?.consume(replyQueue, (replyMsg) => {
          if (!replyMsg) throw Error("No msg!");
          logger.log(replyMsg.content.toString(), "Rpc connection");
          callback(replyMsg);
          this._conn.channel?.ack(replyMsg!);
        });
      })
      .catch((e) => {
        logger.error(e, "Rpc connection", true);
      });
  }
  async replyCall(replyQueue: string, msg: string) {
    this._conn.validateConnection();
    await this._conn.channel?.assertQueue(replyQueue);
    this._conn.channel?.sendToQueue(replyQueue, Buffer.from(msg));
  }
}
