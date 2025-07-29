import { ConsumeMessage } from "amqplib";
import { TMessageSchema } from "./types/rpcValidator.js";
import { ValidationError } from "../errors/validationError.js";
import { logger } from "../logger/logger.js";

export class RPCValidator {
  validateMessage(
    schema: TMessageSchema,
    msg: ConsumeMessage | null
  ): string[] | null {
    if (!msg) throw new ValidationError("No message recevied");
    const errors: string[] = [];
    const data = (() => {
      try {
        return JSON.parse(msg?.content.toString());
      } catch (e) {
        logger.error(e as string, "RPCValidator", true);
        errors.push("Message is not a valid JSON");
      }
    })();
    for (const key in schema) {
      const field = schema[key];
      const value = data[key];
      if (field?.required && !value) {
        errors.push(`Required field ${key} is missing`);
      }
      if (typeof value !== field?.type) {
        errors.push(`Wrong type for ${key} value, required ${field?.type}`);
      }
    }
    return errors[0] ? errors : null;
  }
}
