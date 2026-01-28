---
name: db-to-typebox
description: Generate TypeBox contract schemas from Drizzle ORM table definitions. Use when converting table.schema.ts to TypeBox Contract files, creating API validation schemas for Elysia, or generating structured model files with Response, Create, Update, Patch, ListQuery, ListResponse, Entity, and BusinessQuery types.
---

# DB to TypeBox Contract Generator

Professional guide for converting Drizzle ORM table schemas into TypeBox Contract files for Elysia API validation.

## Core Concept

Transform Drizzle table definitions into structured TypeBox contracts that provide:
- **Runtime validation** for API endpoints
- **Type safety** with automatic TypeScript inference
- **Consistent structure** across all entities
- **Reusable schemas** for common patterns

## Project Structure

```
src/
├── table.schema.ts          # All Drizzle table definitions
├── table.relation.ts        # All table relationships
└── modules/
    ├── ads/
    │   └── ads.contract.ts   # Ad entity contract
    ├── user/
    │   └── user.contract.ts  # User entity contract
    └── helper/
        ├── utils.ts          # spread, InferDTO utilities
        └── query-types.t.model.ts  # Shared query types
```

## Standard Contract Structure

Every contract file must include these schemas:

1. **Response** - Single entity response
2. **Create** - Create new entity (exclude auto-generated fields)
3. **Update** - Full update (exclude auto-generated + immutable fields)
4. **Patch** - Partial update (all fields optional)
5. **ListQuery** - Query parameters for list endpoints
6. **ListResponse** - Paginated list response
7. **Entity** - Complete entity with computed fields
8. **BusinessQuery** - Domain-specific query filters

## Step-by-Step Conversion

### Step 1: Identify the Table Schema

Locate the Drizzle table definition in `table.schema.ts`:

```typescript
export const adTable = p.pgTable("advertisement", {
  ...Audit, // id, createdAt, updatedAt
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
  ...siteScopedCols, // siteId, createdBy
});
```

### Step 2: Create Contract File

Create `[entity].contract.ts` in the appropriate module folder.

**File structure:**
```typescript
// 1. Imports
import { t } from "elysia";
import { type InferDTO, spread } from "../helper/utils";
import { PaginationParams, SortParams } from "../helper/query-types.t.model";
import { adTable } from "../table.schema";

// 2. Spread table fields
export const AdInsertFields = spread(adTable, "insert");
export const AdFields = spread(adTable, "select");

// 3. Define contract schemas
export const AdContract = {
  // ... schemas here
} as const;

// 4. Export types
export type AdContract = InferDTO<typeof AdContract>;
```

### Step 3: Define Base Schemas

```typescript
// Spread the table into reusable field objects
export const AdInsertFields = spread(adTable, "insert");
export const AdFields = spread(adTable, "select");

export const AdContract = {
  // Single entity response
  Response: t.Object({
    ...AdFields,
  }),

  // Complete entity with relations/computed fields
  Entity: t.Object({
    ...AdFields,
    // Add computed or joined fields if needed
    // mediaUrl: t.Optional(t.String()),
  }),
} as const;
```

### Step 4: Create Mutation Schemas

```typescript
export const AdContract = {
  // ... Response, Entity

  // Create - exclude auto-generated fields
  Create: t.Object({
    ...t.Omit(t.Object(AdInsertFields), [
      "id",           // Auto-generated
      "createdAt",    // Auto-generated
      "updatedAt",    // Auto-generated
      "createdBy",    // Set from auth context
    ]).properties,
    // Transform date fields to ISO strings
    startDate: t.String({ format: "date-time" }),
    endDate: t.String({ format: "date-time" }),
  }),

  // Update - full update, exclude auto + immutable fields
  Update: t.Object({
    ...t.Omit(t.Object(AdInsertFields), [
      "id",
      "createdAt",
      "updatedAt",
      "createdBy",    // Immutable - can't change creator
      "siteId",       // Immutable - can't move to different site
    ]).properties,
    startDate: t.String({ format: "date-time" }),
    endDate: t.String({ format: "date-time" }),
  }),

  // Patch - partial update (all fields optional)
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
} as const;
```

### Step 5: Define Query Schemas

```typescript
export const AdContract = {
  // ... other schemas

  // Business-specific filters
  BusinessQuery: t.Object({
    type: t.Optional(t.String()),
    position: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    siteId: t.Optional(t.String()),
  }),

  // List query combines filters + pagination + sorting
  ListQuery: t.Object({
    // Business filters
    type: t.Optional(t.String()),
    position: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    siteId: t.Optional(t.String()),
    search: t.Optional(t.String()),
    // Pagination (from PaginationParams)
    page: t.Optional(t.Number({ minimum: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
    // Sorting (from SortParams)
    sort: t.Optional(t.String()),
    sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  }),

  // Paginated response
  ListResponse: t.Object({
    data: t.Array(t.Object({ ...AdFields })),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
  }),
} as const;
```

## Complete Example

See [ad-contract-example.md](references/ad-contract-example.md) for a full working example.

## Common Patterns

### Pattern 1: Date/Timestamp Fields

```typescript
// Drizzle schema
startDate: p.timestamp("start_date").notNull()

// Contract - convert to ISO string
Create: t.Object({
  startDate: t.String({ format: "date-time" }),
})
```

### Pattern 2: Enum Fields

```typescript
// Drizzle schema
type: adTypeEnum("type").notNull()

// Contract - use original enum or string
Create: t.Object({
  type: t.String(), // or t.Union([t.Literal("banner"), t.Literal("popup")])
})
```

### Pattern 3: Array Fields

```typescript
// Drizzle schema (JSON array)
tags: p.json("tags").$type<string[]>()

// Contract
Create: t.Object({
  tags: t.Array(t.String()),
})
```

### Pattern 4: Optional vs Required

```typescript
// Drizzle has default or nullable
description: p.varchar("description", { length: 255 })
sortOrder: p.integer("sort_order").default(0)

// Contract - make optional in Create
Create: t.Object({
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
})
```

### Pattern 5: UUID References

```typescript
// Drizzle schema
mediaId: p.uuid("media_id").references(() => mediaTable.id)

// Contract
Create: t.Object({
  mediaId: t.Optional(t.String({ format: "uuid" })),
})

// Or if required:
mediaId: t.String({ format: "uuid" })
```

## Field Exclusion Rules

### Auto-Generated Fields (Always Exclude)
- `id` - Generated by database
- `createdAt` - Set automatically
- `updatedAt` - Set automatically

### Context-Dependent Fields (Exclude from Client Input)
- `createdBy` - Set from auth context
- `siteId` - Often set from context/tenant
- `companyId` - Set from context

### Immutable Fields (Exclude from Update/Patch)
- `createdBy` - Cannot change creator
- `siteId` - Cannot move entity to different site
- Entity-specific immutable fields

## Best Practices

1. **Consistent Naming**: Use `[Entity]Contract` and `[Entity]Fields` naming
2. **Group Related Schemas**: Keep all entity schemas in one contract file
3. **Reuse Utilities**: Use `spread()`, `InferDTO`, `PaginationParams`, `SortParams`
4. **Type Safety**: Always export both value and type for contracts
5. **Date Handling**: Convert timestamps to ISO string format
6. **Validation**: Add format, min, max constraints where appropriate
7. **Documentation**: Add comments for complex transformations

## Common Mistakes to Avoid

❌ **Don't mix Insert and Select fields without spread()**
```typescript
// Wrong
const Create = t.Object(adTable); // Won't work
```

✅ **Use spread() helper**
```typescript
// Correct
const AdInsertFields = spread(adTable, "insert");
const Create = t.Object({ ...t.Omit(t.Object(AdInsertFields), [...]).properties });
```

❌ **Don't forget to exclude auto-generated fields**
```typescript
// Wrong - includes id, createdAt, updatedAt
const Create = t.Object(AdInsertFields);
```

✅ **Exclude auto-generated fields**
```typescript
// Correct
const Create = t.Object({
  ...t.Omit(t.Object(AdInsertFields), ["id", "createdAt", "updatedAt"]).properties,
});
```

❌ **Don't use Partial for required fields**
```typescript
// Wrong - makes required fields optional
const Create = t.Partial(t.Object(AdInsertFields));
```

✅ **Use Partial only for Patch (partial updates)**
```typescript
// Correct
const Patch = t.Partial(t.Object({ ...excludedFields }));
```

## Workflow Summary

1. **Locate** the Drizzle table in `table.schema.ts`
2. **Create** `[entity].contract.ts` in module folder
3. **Spread** table fields using `spread()` helper
4. **Define** Response and Entity schemas
5. **Build** Create schema (exclude auto-generated)
6. **Build** Update schema (exclude auto + immutable)
7. **Build** Patch schema (partial of Update)
8. **Define** BusinessQuery with entity-specific filters
9. **Combine** into ListQuery with pagination/sorting
10. **Create** ListResponse with data array + metadata
11. **Export** contract value and type using `InferDTO`

## Resources

- **Examples**: [ad-contract-example.md](references/ad-contract-example.md)
- **Utilities**: [helper-utilities.md](references/helper-utilities.md)
- **Patterns**: [advanced-patterns.md](references/advanced-patterns.md)
