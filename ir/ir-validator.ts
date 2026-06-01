import Ajv, { type ValidateFunction } from "ajv";
import schema from "./ir-schema-v1.json" with { type: "json" };

const ajv = new Ajv({ strict: true });
let validate: ValidateFunction | null = null;

export function getValidator(): ValidateFunction {
  if (!validate) {
    validate = ajv.compile(schema);
  }
  return validate;
}

export function validateIR(data: unknown): { valid: boolean; errors: string[] } {
  const fn = getValidator();
  const valid = fn(data) as boolean;
  return {
    valid,
    errors: valid ? [] : (fn.errors ?? []).map(e =>
      `${e.instancePath} ${e.message}${e.params ? " (" + JSON.stringify(e.params) + ")" : ""}`
    ),
  };
}
