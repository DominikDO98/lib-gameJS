import { Channel, connect, Connection } from "amqplib";
import "dotenv/config";
import { ValidationError } from "../errors/validationError";
import { logger } from "../logger/logger";

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
        this.validateConnection();
        logger.log("Broker initialization is over", "Rpc connection", false);
        return [this._connection, this._channel];
      })
      .catch((e) => {
        logger.error(e, "Rpc connection", true);
      });
  }
  disconnect() {
    this.validateConnection();
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
  validateConnection() {
    if (!this._connection) throw new ValidationError("No connection!");
    if (!this._channel) throw new ValidationError("No channel!");
  }
}
