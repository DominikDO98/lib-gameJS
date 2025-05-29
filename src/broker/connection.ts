import "dotenv/config";
import { Channel, connect, Connection, ConsumeMessage } from "amqplib";
import { logger } from "../logger/logger";
import { ValidationError } from "../errors/validationError";

export class RpcConnection {
  private _connection: Connection | null = null;
  private _channel: Channel | null = null;

  get connection(): Connection | null {
    return this._connection;
  }
  get channel(): Channel | null {
    return this._channel;
  }

  async init() {
    await connect(process.env.RABBITMQ_URI)
      .then((conn) => {
        this._connection = conn;
        return this._connection.createChannel();
      })
      .then((chan) => {
        this._channel = chan;
        this.valitadeConnection();
        return [this._connection, this._channel];
      })
      .catch((e) => {
        logger.error(e, "Rpc connection", true);
        setTimeout(() => {
          this.init(), 10000;
        });
      })
      .finally(() =>
        logger.log("Broker initialization is over", "Rpc connection", false)
      );
  }
  async listenQ(
    queue: string,
    callback: (replyQueue: string, msg: ConsumeMessage | null) => void
  ) {
    this.valitadeConnection();
    const replyQueue = `${queue}-reply`;
    await this._channel?.assertQueue(queue);
    await this._channel?.assertQueue(replyQueue);
    await this._channel?.prefetch(1);

    await this._channel?.consume(queue, (msg) => {
      if (!msg) throw Error("No message!");
      logger.log(msg?.content.toString(), "Rpc connection");
      callback(replyQueue, msg);
      this._channel?.ack(msg);
    });
  }
  async sendCall(
    queue: string,
    msg: string,
    callback: (reply: ConsumeMessage | null) => void
  ) {
    this.valitadeConnection();
    const replyQueue = `${queue}-reply`;
    await this._channel
      ?.assertQueue(queue)
      .then(async () => {
        await this._channel?.assertQueue(replyQueue);
        return this._channel?.sendToQueue(queue, Buffer.from(msg));
      })
      .then(async (send) => {
        if (!send) throw Error("Sending a msg was unsuccesful!");
        await this._channel?.consume(replyQueue, (replyMsg) => {
          if (!replyMsg) throw Error("No msg!");
          logger.log(replyMsg.content.toString(), "Rpc connection");
          callback(replyMsg);
          this._channel?.ack(replyMsg!);
        });
      })
      .catch((e) => {
        logger.error(e, "Rpc connection", true);
      });
  }
  async replyCall(replyQueue: string, msg: string) {
    this.valitadeConnection();
    await this._channel?.assertQueue(replyQueue);
    this._channel?.sendToQueue(replyQueue, Buffer.from(msg));
  }
  disconnect() {
    this.valitadeConnection();
    try {
      this._channel!.close().then(() => {
        this._channel = null;
      });
      this._connection!.close().then(() => {
        this._connection = null;
      });
    } catch (e) {
      logger.error(
        `Unable to disconnect from Message Broker!\n${e}`,
        "Rpc connection",
        true
      );
    }
  }
  valitadeConnection() {
    if (!this._connection) throw new ValidationError("No connection!");
    if (!this._channel) throw new ValidationError("No channel!");
  }
}
