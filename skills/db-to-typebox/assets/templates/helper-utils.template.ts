/**
 * Helper Utilities for TypeBox Contracts
 * Place this in: src/modules/helper/utils.ts
 */

import {
  Kind,
  type Static,
  type TObject,
  type TSchema,
} from "@sinclair/typebox";
import type { Table } from "drizzle-orm";
import {
  type BuildSchema,
  createInsertSchema,
  createSelectSchema,
} from "drizzle-typebox";

// ============================================
// Type Definitions
// ============================================

type Spread<
  T extends TObject | Table,
  Mode extends "select" | "insert" | undefined,
> = T extends TObject<infer Fields>
  ? {
      [K in keyof Fields]: Fields[K];
    }
  : T extends Table
    ? Mode extends "select"
      ? BuildSchema<"select", T["_"]["columns"], undefined>["properties"]
      : Mode extends "insert"
        ? BuildSchema<"insert", T["_"]["columns"], undefined>["properties"]
        : {}
    : {};

// ============================================
// Spread Function
// ============================================

/**
 * Spread a Drizzle table into TypeBox field objects
 * 
 * @param schema - Drizzle table or TypeBox object
 * @param mode - "select" | "insert" | undefined
 * @returns Flat object of TypeBox fields
 * 
 * @example
 * ```ts
 * const AdInsertFields = spread(adTable, "insert");
 * const AdFields = spread(adTable, "select");
 * 
 * const Create = t.Object({
 *   ...t.Omit(t.Object(AdInsertFields), ["id"]).properties,
 * });
 * ```
 */
export const spread = <
  T extends TObject | Table,
  Mode extends "select" | "insert" | undefined,
>(
  schema: T,
  mode?: Mode
): Spread<T, Mode> => {
  const newSchema: Record<string, unknown> = {};
  let table;

  switch (mode) {
    case "insert":
    case "select":
      if (Kind in schema) {
        table = schema;
        break;
      }

      table =
        mode === "insert"
          ? createInsertSchema(schema)
          : createSelectSchema(schema);

      break;

    default:
      if (!(Kind in schema)) throw new Error("Expected a schema");
      table = schema;
  }

  for (const key of Object.keys(table.properties))
    newSchema[key] = table.properties[key];

  return newSchema as any;
};

// ============================================
// Spreads Function (Batch)
// ============================================

/**
 * Spread multiple Drizzle tables at once
 * 
 * @param models - Record of table names to tables
 * @param mode - "select" | "insert" | undefined
 * @returns Record of table names to spread fields
 * 
 * @example
 * ```ts
 * const InsertFields = spreads(
 *   { ad: adTable, user: userTable },
 *   "insert"
 * );
 * 
 * const Create = t.Object({
 *   ...t.Omit(t.Object(InsertFields.ad), ["id"]).properties,
 * });
 * ```
 */
export const spreads = <
  T extends Record<string, TObject | Table>,
  Mode extends "select" | "insert" | undefined,
>(
  models: T,
  mode?: Mode
): {
  [K in keyof T]: Spread<T[K], Mode>;
} => {
  const newSchema: Record<string, unknown> = {};
  const keys = Object.keys(models);

  for (const key of keys) newSchema[key] = spread(models[key]!, mode);

  return newSchema as any;
};

// ============================================
// InferDTO Type
// ============================================

/**
 * Automatically infer TypeScript types from TypeBox contracts
 * 
 * @example
 * ```ts
 * export const AdContract = {
 *   Create: t.Object({ title: t.String() }),
 *   Update: t.Object({ title: t.String() }),
 * } as const;
 * 
 * export type AdContract = InferDTO<typeof AdContract>;
 * // Result: { Create: { title: string }, Update: { title: string } }
 * ```
 */
export type InferDTO<T> = {
  [K in keyof T]: T[K] extends TSchema ? Static<T[K]> : never;
};

// ============================================
// Pick Utility
// ============================================

/**
 * Type-safe object key picker
 * 
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns Object with only selected keys
 * 
 * @example
 * ```ts
 * const user = { id: "1", name: "John", email: "john@example.com", password: "hash" };
 * const publicUser = pick(user, ["id", "name", "email"]);
 * // Result: { id: "1", name: "John", email: "john@example.com" }
 * ```
 */
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

// ============================================
// Common Field Exclusions
// ============================================

/**
 * Standard fields that should be excluded from client input
 */
export const AUTO_FIELDS = ["id", "createdAt", "updatedAt"] as const;

/**
 * Fields that come from authentication/request context
 */
export const CONTEXT_FIELDS = ["createdBy", "siteId", "userId"] as const;

/**
 * Combined immutable fields (auto + context)
 */
export const IMMUTABLE_FIELDS = [...AUTO_FIELDS, ...CONTEXT_FIELDS] as const;

// ============================================
// Type Exports
// ============================================

export type AutoFields = typeof AUTO_FIELDS[number];
export type ContextFields = typeof CONTEXT_FIELDS[number];
export type ImmutableFields = typeof IMMUTABLE_FIELDS[number];
