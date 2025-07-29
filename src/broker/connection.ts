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
    this._connection = await connect(process.env.RABBITMQ_URI, {});
    this._channel = await this._connection.createChannel();
    this.validateConnection();
    this._channel?.on("close", () => {
      this._channel = null;
      this._connection = null;
    });
    this._channel?.on("error", () => {
      this.disconnect();
      this._channel = null;
      this._connection = null;
    });
  }
  disconnect() {
    try {
      this.validateConnection();
      this._channel?.close();
      this._connection?.close();
      this._channel = null;
      this._connection = null;
    } catch (err) {
      logger.warn(err as string, "Rpc connection", false);
      this._channel = null;
      this._connection = null;
    }
  }
  validateConnection() {
    if (!this._connection) throw new ValidationError("No connection!");
    if (!this._channel) throw new ValidationError("No channel!");
  }
}
