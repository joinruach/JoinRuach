import { ContractError } from "./errors";
import { validateEnum } from "./validateEnums";
import { validateRelation } from "./validateRelations";

export interface ContractEntity {
  [section: string]: Record<string, any>;
}

export interface Contract {
  enums: Record<string, string[]>;
  entities: Record<string, ContractEntity>;
}

interface ValidateOptions {
  mode?: "IMPORT" | "RUNTIME";
}

export function validateEntity(
  entityName: string,
  payload: Record<string, any>,
  contract: Contract,
  options: ValidateOptions = {}
) {
  const entity = contract.entities[entityName];

  if (!entity) {
    throw new ContractError(`Unknown entity "${entityName}"`);
  }

  const allowedKeys = new Set<string>();

  for (const section of Object.values(entity)) {
    if (typeof section !== "object" || section === null) continue;

    Object.keys(section).forEach((key) => allowedKeys.add(key));
  }

  Object.keys(payload).forEach((key) => {
    if (!allowedKeys.has(key)) {
      throw new ContractError(
        `Illegal field "${key}" for entity "${entityName}"`
      );
    }
  });

  for (const fields of Object.values(entity)) {
    if (typeof fields !== "object" || fields === null) continue;

    for (const [field, rules] of Object.entries(fields)) {
      if (typeof rules !== "object" || rules === null) continue;

      const value = payload[field];

      if (rules.required && (value === undefined || value === null)) {
        throw new ContractError(
          `Missing required field "${field}" on "${entityName}"`
        );
      }

      if (
        rules.immutable &&
        options.mode !== "IMPORT" &&
        value !== undefined &&
        value !== null
      ) {
        throw new ContractError(
          `Field "${field}" is immutable and cannot be modified`
        );
      }

      if (rules.type === "enum") {
        const enumValues = contract.enums[rules.enum];
        if (!enumValues) {
          throw new ContractError(`Unknown enum "${rules.enum}" for "${field}"`);
        }
        validateEnum(field, value, enumValues);
      }

      if (typeof rules.type === "string" && rules.type.includes("To")) {
        const isRequiredRelation = Boolean(rules.required);
        validateRelation(field, value, isRequiredRelation);
      }
    }
  }

  return payload;
}
