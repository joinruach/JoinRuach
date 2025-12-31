import { ContractError } from "./errors";

export function validateRelation(
  field: string,
  value: unknown,
  required: boolean
) {
  if (required && (value === null || value === undefined)) {
    throw new ContractError(`Missing required relation "${field}"`);
  }

  if (value === undefined || value === null) return;

  if (typeof value !== "string" && typeof value !== "number") {
    throw new ContractError(
      `Relation "${field}" must be an ID reference (string or number)`
    );
  }
}
