type Primitive = "string" | "number" | "boolean";
interface ISchemaField {
  type: Primitive;
  required: boolean;
}
export type TMessageSchema = Record<string, ISchemaField>;
