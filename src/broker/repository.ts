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
    console.log("called");

    const replyQueue = `${queue}-reply`;
    await this._conn.channel?.assertQueue(queue);
    await this._conn.channel?.assertQueue(replyQueue);
    await this._conn.channel?.prefetch(1);
    await this._conn.channel?.consume(queue, (msg) => {
      try {
        console.log("message: ", msg?.content.toString());
        if (!msg) throw Error("No message!");
        this._conn.channel?.ack(msg);
        logger.log(msg?.content.toString(), "Rpc Repository");
        callback(replyQueue, msg);
      } catch (err) {
        logger.error(err as string, "Rpc Repository");
        if (msg) this._conn.channel?.nack(msg);
      }
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
          logger.log(replyMsg.content.toString(), "Rpc Repository");
          this._conn.channel?.ack(replyMsg!);
          callback(replyMsg);
        });
      })
      .catch((e) => {
        logger.error(e, "Rpc Repository", true);
      });
  }
  async replyCall(replyQueue: string, msg: string) {
    this._conn.validateConnection();
    await this._conn.channel?.assertQueue(replyQueue);
    this._conn.channel?.sendToQueue(replyQueue, Buffer.from(msg));
  }
}
