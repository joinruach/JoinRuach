import { ContractError } from "./errors";

export function validateEnum(
  field: string,
  value: unknown,
  allowed: string[]
) {
  if (value === undefined || value === null) return;

  if (!allowed.includes(value as string)) {
    throw new ContractError(
      `Invalid enum value for "${field}": "${value}". Allowed: ${allowed.join(
        ", "
      )}`
    );
  }
}
