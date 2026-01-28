# Complete Ad Contract Example

Full working example of converting a Drizzle table to TypeBox contract.

## Source: Drizzle Table Schema

```typescript
// table.schema.ts
import { pgTable as p, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Reusable audit fields
export const Audit = {
  id: p.uuid("id").primaryKey().defaultRandom(),
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
  updatedAt: p.timestamp("updated_at").defaultNow().notNull(),
};

// Site scoped fields
export const siteScopedCols = {
  siteId: p.uuid("site_id").references(() => siteTable.id).notNull(),
  createdBy: p.uuid("created_by").references(() => userTable.id).notNull(),
};

// Enums
export const adTypeEnum = p.pgEnum("ad_type", ["banner", "popup", "sidebar"]);
export const adPositionEnum = p.pgEnum("ad_position", [
  "home-top",
  "home-sidebar",
  "article-top",
  "article-bottom",
]);

// Advertisement table
export const adTable = p.pgTable("advertisement", {
  ...Audit,
  title: p.varchar("title", { length: 255 }).notNull(),
  description: p.varchar("description", { length: 255 }),
  type: adTypeEnum("type").notNull(),
  mediaId: p.uuid("media_id").references(() => mediaTable.id),
  link: p.varchar("link", { length: 500 }).notNull(),
  position: adPositionEnum("ads_position").default("home-top"),
  sortOrder: p.integer("sort_order").default(0),
  isActive: p.boolean("is_active").default(true),
  startDate: p.timestamp("start_date").notNull(),
  endDate: p.timestamp("end_date").notNull(),
  ...siteScopedCols,
});
```

## Result: TypeBox Contract

```typescript
// modules/ads/ads.contract.ts

import { t } from "elysia";
import { type InferDTO, spread } from "../helper/utils";
import { adTable } from "../table.schema";

// ============================================
// 1. Spread Table Fields
// ============================================

export const AdInsertFields = spread(adTable, "insert");
export const AdFields = spread(adTable, "select");

// ============================================
// 2. Contract Schemas
// ============================================

export const AdContract = {
  // ------------------------------------------
  // Base Schemas
  // ------------------------------------------

  /**
   * Single ad response
   * Used in: GET /ads/:id
   */
  Response: t.Object({
    ...AdFields,
  }),

  /**
   * Complete entity with computed fields
   * Used when returning ads with relations
   */
  Entity: t.Object({
    ...AdFields,
    // Optionally add computed/joined fields
    mediaUrl: t.Optional(t.Union([t.String(), t.Null()])),
  }),

  // ------------------------------------------
  // Mutation Schemas
  // ------------------------------------------

  /**
   * Create new ad
   * Excludes: id, createdAt, updatedAt, createdBy (auto-generated/context)
   * Used in: POST /ads
   */
  Create: t.Object({
    ...t.Omit(t.Object(AdInsertFields), [
      "id",
      "createdAt",
      "updatedAt",
      "createdBy", // Set from auth context
    ]).properties,
    // Convert timestamps to ISO strings
    startDate: t.String({ format: "date-time" }),
    endDate: t.String({ format: "date-time" }),
  }),

  /**
   * Full update of ad
   * Excludes: id, createdAt, updatedAt, createdBy (immutable), siteId (can't move sites)
   * Used in: PUT /ads/:id
   */
  Update: t.Object({
    ...t.Omit(t.Object(AdInsertFields), [
      "id",
      "createdAt",
      "updatedAt",
      "createdBy", // Can't change creator
      "siteId", // Can't move ad to different site
    ]).properties,
    startDate: t.String({ format: "date-time" }),
    endDate: t.String({ format: "date-time" }),
  }),

  /**
   * Partial update of ad
   * All fields optional
   * Used in: PATCH /ads/:id
   */
  Patch: t.Partial(
    t.Object({
      ...t.Omit(t.Object(AdInsertFields), [
        "id",
        "createdAt",
        "updatedAt",
        "createdBy",
        "siteId",
      ]).properties,
      startDate: t.String({ format: "date-time" }),
      endDate: t.String({ format: "date-time" }),
    })
  ),

  // ------------------------------------------
  // Query Schemas
  // ------------------------------------------

  /**
   * Business-specific filters for ads
   * Used for building WHERE clauses
   */
  BusinessQuery: t.Object({
    type: t.Optional(t.Union([
      t.Literal("banner"),
      t.Literal("popup"),
      t.Literal("sidebar"),
    ])),
    position: t.Optional(t.Union([
      t.Literal("home-top"),
      t.Literal("home-sidebar"),
      t.Literal("article-top"),
      t.Literal("article-bottom"),
    ])),
    isActive: t.Optional(t.Boolean()),
    siteId: t.Optional(t.String({ format: "uuid" })),
    search: t.Optional(t.String()),
  }),

  /**
   * Complete list query with filters + pagination + sorting
   * Used in: GET /ads?type=banner&page=1&limit=10
   */
  ListQuery: t.Object({
    // Business filters
    type: t.Optional(t.Union([
      t.Literal("banner"),
      t.Literal("popup"),
      t.Literal("sidebar"),
    ])),
    position: t.Optional(t.Union([
      t.Literal("home-top"),
      t.Literal("home-sidebar"),
      t.Literal("article-top"),
      t.Literal("article-bottom"),
    ])),
    isActive: t.Optional(t.Boolean()),
    siteId: t.Optional(t.String({ format: "uuid" })),
    search: t.Optional(t.String()),
    
    // Pagination
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 10 })),
    
    // Sorting
    sort: t.Optional(t.String()),
    sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  }),

  /**
   * Paginated list response
   * Used in: GET /ads
   */
  ListResponse: t.Object({
    data: t.Array(t.Object({ ...AdFields })),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
  }),

  // ------------------------------------------
  // Additional Schemas (Optional)
  // ------------------------------------------

  /**
   * Batch status update
   * Used in: PATCH /ads/batch/status
   */
  BatchStatusUpdate: t.Object({
    ids: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
    isActive: t.Boolean(),
  }),

  /**
   * Bulk delete
   * Used in: DELETE /ads/batch
   */
  BatchDelete: t.Object({
    ids: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
  }),
} as const;

// ============================================
// 3. Export Types
// ============================================

export type AdContract = InferDTO<typeof AdContract>;

// ============================================
// Usage in Elysia Routes
// ============================================

/*
import { Elysia, t } from "elysia";
import { AdContract } from "./ads.contract";

const app = new Elysia()
  // Create ad
  .post("/ads", async ({ body }) => {
    // body is typed as AdContract["Create"]
    const ad = await db.insert(adTable).values(body).returning();
    return ad[0];
  }, {
    body: AdContract.Create,
    response: AdContract.Response,
  })
  
  // Get ad by ID
  .get("/ads/:id", async ({ params }) => {
    const ad = await db.query.adTable.findFirst({
      where: eq(adTable.id, params.id),
    });
    return ad;
  }, {
    response: AdContract.Response,
  })
  
  // List ads with filters
  .get("/ads", async ({ query }) => {
    // query is typed as AdContract["ListQuery"]
    const { page = 1, limit = 10, type, isActive, search } = query;
    
    const ads = await db.query.adTable.findMany({
      where: and(
        type ? eq(adTable.type, type) : undefined,
        isActive !== undefined ? eq(adTable.isActive, isActive) : undefined,
      ),
      limit,
      offset: (page - 1) * limit,
    });
    
    const total = await db.select({ count: count() }).from(adTable);
    
    return {
      data: ads,
      total: total[0].count,
      page,
      limit,
      totalPages: Math.ceil(total[0].count / limit),
    };
  }, {
    query: AdContract.ListQuery,
    response: AdContract.ListResponse,
  })
  
  // Update ad
  .put("/ads/:id", async ({ params, body }) => {
    // body is typed as AdContract["Update"]
    const ad = await db
      .update(adTable)
      .set(body)
      .where(eq(adTable.id, params.id))
      .returning();
    return ad[0];
  }, {
    body: AdContract.Update,
    response: AdContract.Response,
  })
  
  // Partial update
  .patch("/ads/:id", async ({ params, body }) => {
    // body is typed as AdContract["Patch"]
    const ad = await db
      .update(adTable)
      .set(body)
      .where(eq(adTable.id, params.id))
      .returning();
    return ad[0];
  }, {
    body: AdContract.Patch,
    response: AdContract.Response,
  })
  
  // Batch update status
  .patch("/ads/batch/status", async ({ body }) => {
    await db
      .update(adTable)
      .set({ isActive: body.isActive })
      .where(inArray(adTable.id, body.ids));
    return { success: true };
  }, {
    body: AdContract.BatchStatusUpdate,
  });
*/
```

## Field Transformation Decisions

| Field | Drizzle Type | Create | Update | Patch | Notes |
|-------|-------------|--------|--------|-------|-------|
| id | uuid | ❌ Excluded | ❌ Excluded | ❌ Excluded | Auto-generated |
| createdAt | timestamp | ❌ Excluded | ❌ Excluded | ❌ Excluded | Auto-generated |
| updatedAt | timestamp | ❌ Excluded | ❌ Excluded | ❌ Excluded | Auto-generated |
| createdBy | uuid | ❌ Excluded | ❌ Excluded | ❌ Excluded | From auth context + immutable |
| siteId | uuid | ❌ Excluded | ❌ Excluded | ❌ Excluded | From context + immutable |
| title | varchar | ✅ Required | ✅ Required | ⚠️ Optional | - |
| description | varchar | ⚠️ Optional | ⚠️ Optional | ⚠️ Optional | Nullable in DB |
| type | enum | ✅ Required | ✅ Required | ⚠️ Optional | - |
| mediaId | uuid | ⚠️ Optional | ⚠️ Optional | ⚠️ Optional | Nullable reference |
| link | varchar | ✅ Required | ✅ Required | ⚠️ Optional | - |
| position | enum | ⚠️ Optional | ⚠️ Optional | ⚠️ Optional | Has default |
| sortOrder | integer | ⚠️ Optional | ⚠️ Optional | ⚠️ Optional | Has default |
| isActive | boolean | ⚠️ Optional | ⚠️ Optional | ⚠️ Optional | Has default |
| startDate | timestamp | ✅ String | ✅ String | ⚠️ Optional String | Convert to ISO |
| endDate | timestamp | ✅ String | ✅ String | ⚠️ Optional String | Convert to ISO |

## Key Patterns Used

1. **Spread Utility**: `spread(adTable, "insert")` - Converts Drizzle table to TypeBox fields
2. **Field Exclusion**: `t.Omit(t.Object(AdInsertFields), [...]).properties` - Remove unwanted fields
3. **Type Conversion**: `timestamp → t.String({ format: "date-time" })` - Transform DB types to API types
4. **Partial Schema**: `t.Partial(...)` - Make all fields optional for PATCH
5. **Type Inference**: `InferDTO<typeof AdContract>` - Auto-generate TypeScript types

## Benefits

✅ **Type Safety**: Full TypeScript inference from contract to API handlers  
✅ **Runtime Validation**: Automatic validation via Elysia  
✅ **Single Source of Truth**: DB schema drives API contracts  
✅ **Maintainability**: Changes to DB schema automatically flow to API  
✅ **Developer Experience**: Autocomplete and type errors in IDE
