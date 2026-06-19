# Helper Utilities Reference

Complete reference for utility functions used in TypeBox contract generation.

## Core Utilities

### 1. `spread()` Function

Converts Drizzle table schema into flat TypeBox field objects.

**Source**: `helper/utils.ts`

```typescript
export const spread = <
  T extends TObject | Table,
  Mode extends "select" | "insert" | undefined,
>(
  schema: T,
  mode?: Mode
): Spread<T, Mode>
```

**Parameters:**
- `schema`: Drizzle table or TypeBox object
- `mode`: 
  - `"insert"` - Optimized for INSERT operations (excludes auto-generated defaults)
  - `"select"` - Optimized for SELECT operations (includes all fields)
  - `undefined` - Raw spread without optimization

**Usage:**

```typescript
import { adTable } from "../table.schema";
import { spread } from "../helper/utils";

// For creating/updating (excludes auto fields)
const AdInsertFields = spread(adTable, "insert");

// For reading (includes all fields)
const AdFields = spread(adTable, "select");

// Use in contract
const Create = t.Object({
  ...t.Omit(t.Object(AdInsertFields), ["id", "createdAt"]).properties,
});
```

**Output:**

```typescript
// AdInsertFields produces:
{
  title: TString,
  description: TOptional<TString>,
  type: TString,
  // ... all insertable fields
}

// AdFields produces:
{
  id: TString,
  title: TString,
  description: TOptional<TString>,
  createdAt: TString,
  // ... all selectable fields
}
```

---

### 2. `InferDTO<T>` Type

Automatically infers TypeScript types from TypeBox schemas.

**Source**: `helper/utils.ts`

```typescript
export type InferDTO<T> = {
  [K in keyof T]: T[K] extends TSchema ? Static<T[K]> : never;
};
```

**Usage:**

```typescript
export const AdContract = {
  Create: t.Object({ title: t.String() }),
  Update: t.Object({ title: t.String() }),
} as const;

// Auto-infer all types
export type AdContract = InferDTO<typeof AdContract>;

// Result:
// type AdContract = {
//   Create: { title: string };
//   Update: { title: string };
// }
```

**Benefits:**
- Single source of truth (schema defines types)
- No manual type definitions needed
- Automatic updates when schemas change

---

### 3. `spreads()` Function

Batch spread multiple tables at once.

**Source**: `helper/utils.ts`

```typescript
export const spreads = <
  T extends Record<string, TObject | Table>,
  Mode extends "select" | "insert" | undefined,
>(
  models: T,
  mode?: Mode
): {
  [K in keyof T]: Spread<T[K], Mode>;
}
```

**Usage:**

```typescript
import { adTable, userTable, mediaTable } from "../table.schema";

const InsertFields = spreads(
  { ad: adTable, user: userTable, media: mediaTable },
  "insert"
);

// Access individual spreads
const Create = t.Object({
  ...t.Omit(t.Object(InsertFields.ad), ["id"]).properties,
});
```

---

### 4. `pick()` Function

Type-safe object key picker.

**Source**: `helper/utils.ts`

```typescript
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>
```

**Usage:**

```typescript
const user = { id: "1", name: "John", email: "john@example.com", password: "hash" };

const publicUser = pick(user, ["id", "name", "email"]);
// Result: { id: "1", name: "John", email: "john@example.com" }
```

---

## Shared Query Types

### PaginationParams

Standard pagination parameters.

**Source**: `helper/query-types.t.model.ts`

```typescript
export const PaginationParams = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 10 })),
});

export type PaginationParams = Static<typeof PaginationParams>;
```

**Usage in Contract:**

```typescript
export const AdContract = {
  ListQuery: t.Object({
    // Business filters
    type: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    
    // Pagination
    ...PaginationParams.properties,
  }),
} as const;
```

---

### SortParams

Standard sorting parameters.

**Source**: `helper/query-types.t.model.ts`

```typescript
export const SortParams = t.Object({
  sort: t.Optional(t.String()),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
});

export type SortParams = Static<typeof SortParams>;
```

**Usage in Contract:**

```typescript
export const AdContract = {
  ListQuery: t.Object({
    type: t.Optional(t.String()),
    // Sorting
    ...SortParams.properties,
  }),
} as const;
```

---

### BaseQueryParams

Basic query utilities (search, field selection).

**Source**: `helper/query-types.t.model.ts`

```typescript
export const BaseQueryParams = t.Object({
  search: t.Optional(t.String()),
  fields: t.Optional(t.String()), // Comma-separated field names
});

export type BaseQueryParams = Static<typeof BaseQueryParams>;
```

---

## Common Patterns

### Pattern 1: Combining Query Types

```typescript
export const AdContract = {
  ListQuery: t.Object({
    // Business filters
    type: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    
    // Add standard query capabilities
    ...BaseQueryParams.properties,  // search, fields
    ...PaginationParams.properties, // page, limit
    ...SortParams.properties,       // sort, sortOrder
  }),
} as const;
```

### Pattern 2: Custom Pagination Response

```typescript
// Create reusable paginated response wrapper
export const createPaginatedResponse = <T extends TSchema>(itemSchema: T) =>
  t.Object({
    data: t.Array(itemSchema),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
  });

// Use in contract
export const AdContract = {
  ListResponse: createPaginatedResponse(t.Object({ ...AdFields })),
} as const;
```

### Pattern 3: Excluding Multiple Fields

```typescript
// Define common exclusions
const AUTO_FIELDS = ["id", "createdAt", "updatedAt"] as const;
const CONTEXT_FIELDS = ["createdBy", "siteId"] as const;
const IMMUTABLE_FIELDS = [...AUTO_FIELDS, ...CONTEXT_FIELDS] as const;

// Use in schemas
const Create = t.Object({
  ...t.Omit(t.Object(AdInsertFields), [...AUTO_FIELDS, ...CONTEXT_FIELDS]).properties,
});

const Update = t.Object({
  ...t.Omit(t.Object(AdInsertFields), IMMUTABLE_FIELDS).properties,
});
```

### Pattern 4: Nested Spreads

```typescript
// Spread multiple tables for join responses
const AdWithMedia = {
  ...AdFields,
  media: t.Object({
    ...MediaFields,
  }),
};

export const AdContract = {
  EntityWithMedia: t.Object(AdWithMedia),
} as const;
```

---

## TypeBox Common Schemas

### String Formats

```typescript
// Email
t.String({ format: "email" })

// UUID
t.String({ format: "uuid" })

// Date-time (ISO 8601)
t.String({ format: "date-time" })

// Date (YYYY-MM-DD)
t.String({ format: "date" })

// URL
t.String({ format: "uri" })
```

### Number Constraints

```typescript
// Positive integer
t.Number({ minimum: 1 })

// Range
t.Number({ minimum: 0, maximum: 100 })

// Integer only
t.Integer()

// With default
t.Number({ default: 0 })
```

### Array Constraints

```typescript
// Non-empty array
t.Array(t.String(), { minItems: 1 })

// Limited size
t.Array(t.String(), { minItems: 1, maxItems: 10 })

// Unique items
t.Array(t.String(), { uniqueItems: true })
```

### Union Types

```typescript
// Enum-like
t.Union([
  t.Literal("banner"),
  t.Literal("popup"),
  t.Literal("sidebar"),
])

// Multiple types
t.Union([t.String(), t.Number()])

// Nullable
t.Union([t.String(), t.Null()])
```

---

## Complete Workflow Example

```typescript
// 1. Import utilities
import { spread, type InferDTO } from "../helper/utils";
import { PaginationParams, SortParams } from "../helper/query-types.t.model";
import { adTable } from "../table.schema";

// 2. Spread table
const AdInsertFields = spread(adTable, "insert");
const AdFields = spread(adTable, "select");

// 3. Define exclusions
const AUTO_FIELDS = ["id", "createdAt", "updatedAt"] as const;
const CONTEXT_FIELDS = ["createdBy", "siteId"] as const;

// 4. Create contract
export const AdContract = {
  Create: t.Object({
    ...t.Omit(t.Object(AdInsertFields), [...AUTO_FIELDS, ...CONTEXT_FIELDS]).properties,
  }),
  
  ListQuery: t.Object({
    type: t.Optional(t.String()),
    ...PaginationParams.properties,
    ...SortParams.properties,
  }),
  
  ListResponse: t.Object({
    data: t.Array(t.Object({ ...AdFields })),
    total: t.Number(),
  }),
} as const;

// 5. Infer types
export type AdContract = InferDTO<typeof AdContract>;
```

---

## Troubleshooting

### Issue: Fields not appearing in spread

```typescript
// ❌ Wrong
const fields = spread(adTable); // Mode undefined, might miss fields

// ✅ Correct
const fields = spread(adTable, "insert"); // Explicit mode
```

### Issue: Type errors with Omit

```typescript
// ❌ Wrong
...t.Omit(AdInsertFields, ["id"]) // Omit expects TObject

// ✅ Correct
...t.Omit(t.Object(AdInsertFields), ["id"]).properties
```

### Issue: Optional fields required

```typescript
// ❌ Wrong - description is optional in DB but required here
const Create = t.Object(AdInsertFields);

// ✅ Correct - preserve optional nature
const Create = t.Object({
  ...AdInsertFields,
  description: t.Optional(AdInsertFields.description),
});
```
