// {{ENTITY_NAME}} Contract Template
// Replace {{ENTITY_NAME}} with actual entity name (e.g., Ad, User, Product)
// Replace {{table_name}} with actual table variable (e.g., adTable, userTable)

import { t } from "elysia";
import { type InferDTO, spread } from "../helper/utils";
import { {{table_name}} } from "../table.schema";

// ============================================
// 1. Spread Table Fields
// ============================================

export const {{EntityName}}InsertFields = spread({{table_name}}, "insert");
export const {{EntityName}}Fields = spread({{table_name}}, "select");

// ============================================
// 2. Contract Schemas
// ============================================

export const {{EntityName}}Contract = {
  // ------------------------------------------
  // Base Schemas
  // ------------------------------------------

  /**
   * Single entity response
   * Used in: GET /{{entity-path}}/:id
   */
  Response: t.Object({
    ...{{EntityName}}Fields,
  }),

  /**
   * Complete entity (with computed/joined fields)
   * Used when returning entity with relations
   */
  Entity: t.Object({
    ...{{EntityName}}Fields,
    // Add computed fields here
    // Example: fullName: t.Optional(t.String()),
  }),

  // ------------------------------------------
  // Mutation Schemas
  // ------------------------------------------

  /**
   * Create new entity
   * Excludes: auto-generated and context fields
   * Used in: POST /{{entity-path}}
   */
  Create: t.Object({
    ...t.Omit(t.Object({{EntityName}}InsertFields), [
      "id",
      "createdAt",
      "updatedAt",
      "createdBy",
      // Add other auto/context fields
    ]).properties,
    // Transform fields as needed
    // Example: startDate: t.String({ format: "date-time" }),
  }),

  /**
   * Full update of entity
   * Excludes: auto-generated and immutable fields
   * Used in: PUT /{{entity-path}}/:id
   */
  Update: t.Object({
    ...t.Omit(t.Object({{EntityName}}InsertFields), [
      "id",
      "createdAt",
      "updatedAt",
      "createdBy",
      // Add immutable fields (can't be changed after creation)
      // Example: "siteId", "userId"
    ]).properties,
  }),

  /**
   * Partial update of entity
   * All fields optional
   * Used in: PATCH /{{entity-path}}/:id
   */
  Patch: t.Partial(
    t.Object({
      ...t.Omit(t.Object({{EntityName}}InsertFields), [
        "id",
        "createdAt",
        "updatedAt",
        "createdBy",
        // Add same exclusions as Update
      ]).properties,
    })
  ),

  // ------------------------------------------
  // Query Schemas
  // ------------------------------------------

  /**
   * Business-specific filters
   * Used for building WHERE clauses
   */
  BusinessQuery: t.Object({
    // Add entity-specific filter fields
    // Example:
    // status: t.Optional(t.String()),
    // categoryId: t.Optional(t.String({ format: "uuid" })),
    search: t.Optional(t.String()),
  }),

  /**
   * Complete list query with filters + pagination + sorting
   * Used in: GET /{{entity-path}}
   */
  ListQuery: t.Object({
    // Business filters (from BusinessQuery)
    search: t.Optional(t.String()),
    // Add other filters
    
    // Pagination
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 10 })),
    
    // Sorting
    sort: t.Optional(t.String()),
    sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  }),

  /**
   * Paginated list response
   * Used in: GET /{{entity-path}}
   */
  ListResponse: t.Object({
    data: t.Array(t.Object({ ...{{EntityName}}Fields })),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
  }),

  // ------------------------------------------
  // Additional Schemas (Optional)
  // ------------------------------------------

  // Add any entity-specific schemas
  // Examples:
  
  // BatchUpdate: t.Object({
  //   ids: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
  //   updates: t.Partial(Update),
  // }),

  // BatchDelete: t.Object({
  //   ids: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
  // }),

} as const;

// ============================================
// 3. Export Types
// ============================================

export type {{EntityName}}Contract = InferDTO<typeof {{EntityName}}Contract>;

// ============================================
// Usage Example
// ============================================

/*
import { Elysia } from "elysia";
import { {{EntityName}}Contract } from "./{{entity-name}}.contract";

const app = new Elysia()
  .post("/{{entity-path}}", async ({ body }) => {
    // body is typed as {{EntityName}}Contract["Create"]
  }, {
    body: {{EntityName}}Contract.Create,
    response: {{EntityName}}Contract.Response,
  })
  
  .get("/{{entity-path}}/:id", async ({ params }) => {
    // ...
  }, {
    response: {{EntityName}}Contract.Response,
  })
  
  .get("/{{entity-path}}", async ({ query }) => {
    // query is typed as {{EntityName}}Contract["ListQuery"]
  }, {
    query: {{EntityName}}Contract.ListQuery,
    response: {{EntityName}}Contract.ListResponse,
  })
  
  .put("/{{entity-path}}/:id", async ({ params, body }) => {
    // body is typed as {{EntityName}}Contract["Update"]
  }, {
    body: {{EntityName}}Contract.Update,
    response: {{EntityName}}Contract.Response,
  })
  
  .patch("/{{entity-path}}/:id", async ({ params, body }) => {
    // body is typed as {{EntityName}}Contract["Patch"]
  }, {
    body: {{EntityName}}Contract.Patch,
    response: {{EntityName}}Contract.Response,
  });
*/
