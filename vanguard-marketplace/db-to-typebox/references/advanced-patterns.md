# Advanced Patterns for DB to TypeBox Contracts

Complex patterns and edge cases for converting Drizzle schemas to TypeBox contracts.

## Pattern 1: Handling JSON Fields

### Array of Primitives

```typescript
// Drizzle schema
tags: p.json("tags").$type<string[]>().default([])

// Contract
const Create = t.Object({
  tags: t.Optional(t.Array(t.String())),
});

const Entity = t.Object({
  ...AdFields,
  tags: t.Array(t.String()), // Ensure it's always an array
});
```

### Complex Objects

```typescript
// Drizzle schema
metadata: p.json("metadata").$type<{
  clicks: number;
  impressions: number;
  ctr: number;
}>()

// Contract - define the shape
const AdMetadata = t.Object({
  clicks: t.Number(),
  impressions: t.Number(),
  ctr: t.Number(),
});

const Create = t.Object({
  metadata: t.Optional(AdMetadata),
});
```

### Nested Arrays of Objects

```typescript
// Drizzle schema
schedules: p.json("schedules").$type<Array<{
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}>>()

// Contract
const ScheduleItem = t.Object({
  dayOfWeek: t.Number({ minimum: 0, maximum: 6 }),
  startTime: t.String({ pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$" }),
  endTime: t.String({ pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$" }),
});

const Create = t.Object({
  schedules: t.Optional(t.Array(ScheduleItem)),
});
```

---

## Pattern 2: Handling Relationships

### One-to-One

```typescript
// Drizzle schema
profileId: p.uuid("profile_id").references(() => profileTable.id)

// Contract - basic
const Create = t.Object({
  profileId: t.Optional(t.String({ format: "uuid" })),
});

// Contract - with nested object
const EntityWithProfile = t.Object({
  ...UserFields,
  profile: t.Optional(t.Object({ ...ProfileFields })),
});
```

### One-to-Many

```typescript
// User has many posts
// Don't include relation in Create/Update
const Create = t.Object({
  name: t.String(),
  email: t.String({ format: "email" }),
  // No "posts" field here
});

// Include in Entity response
const EntityWithPosts = t.Object({
  ...UserFields,
  posts: t.Array(t.Object({ ...PostFields })),
});
```

### Many-to-Many (Junction Table)

```typescript
// Drizzle - junction table
export const adCategoryTable = p.pgTable("ad_category", {
  adId: p.uuid("ad_id").references(() => adTable.id).notNull(),
  categoryId: p.uuid("category_id").references(() => categoryTable.id).notNull(),
});

// Contract - array of IDs for Create
const Create = t.Object({
  title: t.String(),
  categoryIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
});

// Contract - nested objects for Entity
const EntityWithCategories = t.Object({
  ...AdFields,
  categories: t.Array(t.Object({ ...CategoryFields })),
});

// Don't create contract for junction table itself
// ❌ AdCategoryContract - not needed
```

---

## Pattern 3: Enums and Unions

### Database Enum

```typescript
// Drizzle
export const adTypeEnum = p.pgEnum("ad_type", ["banner", "popup", "sidebar"]);

type: adTypeEnum("type").notNull()

// Contract - as literal union
const Create = t.Object({
  type: t.Union([
    t.Literal("banner"),
    t.Literal("popup"),
    t.Literal("sidebar"),
  ]),
});

// Or create reusable enum
export const AdTypeEnum = t.Union([
  t.Literal("banner"),
  t.Literal("popup"),
  t.Literal("sidebar"),
]);

const Create = t.Object({
  type: AdTypeEnum,
});
```

### TypeScript Enum

```typescript
// TypeScript enum
enum AdStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

// Contract
const Create = t.Object({
  status: t.Union([
    t.Literal(AdStatus.Draft),
    t.Literal(AdStatus.Published),
    t.Literal(AdStatus.Archived),
  ]),
});
```

### Dynamic Enums (from database)

```typescript
// For enums that come from database lookup tables
const Create = t.Object({
  categoryId: t.String({ format: "uuid" }), // Validate as UUID
  // Validation of actual enum values happens in business logic
});
```

---

## Pattern 4: Conditional Fields

### Discriminated Unions

```typescript
// Different fields based on type
const BannerAd = t.Object({
  type: t.Literal("banner"),
  width: t.Number(),
  height: t.Number(),
  imageUrl: t.String(),
});

const PopupAd = t.Object({
  type: t.Literal("popup"),
  duration: t.Number(), // How long popup shows
  closeButton: t.Boolean(),
});

const SidebarAd = t.Object({
  type: t.Literal("sidebar"),
  position: t.Union([t.Literal("left"), t.Literal("right")]),
});

const Create = t.Union([BannerAd, PopupAd, SidebarAd]);

// Usage - TypeScript knows which fields are available
if (body.type === "banner") {
  console.log(body.width); // ✓ Available
  // console.log(body.duration); // ✗ Error
}
```

---

## Pattern 5: Computed Fields

### Runtime Computed

```typescript
// Fields calculated at runtime, not in database
const Entity = t.Object({
  ...AdFields,
  // Computed from clicks and impressions
  ctr: t.Optional(t.Number()),
  // Full URL from relative path
  fullImageUrl: t.Optional(t.String()),
  // Human-readable status
  statusLabel: t.Optional(t.String()),
});
```

### Aggregated Fields

```typescript
// Fields from aggregation queries
const EntityWithStats = t.Object({
  ...AdFields,
  totalClicks: t.Number(),
  totalImpressions: t.Number(),
  avgCtr: t.Number(),
  lastClickedAt: t.Optional(t.String({ format: "date-time" })),
});
```

---

## Pattern 6: File Uploads

### Single File Reference

```typescript
// Drizzle - stores file ID/path
imageId: p.uuid("image_id").references(() => mediaTable.id)

// Contract Create - accept upload or ID
const Create = t.Object({
  // Either provide existing media ID
  imageId: t.Optional(t.String({ format: "uuid" })),
  // Or will upload new file (handled separately)
});

// Entity - return full URL
const Entity = t.Object({
  ...AdFields,
  imageUrl: t.Optional(t.String()),
});
```

### Multiple Files

```typescript
// Drizzle - JSON array of IDs
imageIds: p.json("image_ids").$type<string[]>().default([])

// Contract
const Create = t.Object({
  imageIds: t.Array(t.String({ format: "uuid" }), {
    minItems: 1,
    maxItems: 5,
  }),
});

// Entity - return array of URLs
const Entity = t.Object({
  ...AdFields,
  imageUrls: t.Array(t.String()),
});
```

---

## Pattern 7: Soft Deletes

```typescript
// Drizzle
deletedAt: p.timestamp("deleted_at")

// Don't include in Create/Update
const Create = t.Object({
  title: t.String(),
  // No deletedAt
});

// Include in Entity (for admins)
const Entity = t.Object({
  ...AdFields,
  deletedAt: t.Optional(t.Union([t.String({ format: "date-time" }), t.Null()])),
});

// Filter in queries
const ListQuery = t.Object({
  includeDeleted: t.Optional(t.Boolean()), // Admin only
});
```

---

## Pattern 8: Multi-Tenancy

### Site/Tenant Scoped

```typescript
// Drizzle
siteId: p.uuid("site_id").references(() => siteTable.id).notNull()

// Create - exclude (set from context)
const Create = t.Object({
  ...t.Omit(t.Object(AdInsertFields), [
    "id",
    "createdAt",
    "updatedAt",
    "siteId", // Set from authenticated user's site
  ]).properties,
});

// Query - include for filtering (super admin)
const ListQuery = t.Object({
  siteId: t.Optional(t.String({ format: "uuid" })), // Super admin can filter by site
});
```

---

## Pattern 9: Versioning

### Optimistic Locking

```typescript
// Drizzle
version: p.integer("version").default(1).notNull()

// Update - require version
const Update = t.Object({
  version: t.Number(), // Must match current version
  title: t.String(),
  // ... other fields
});

// Entity - return current version
const Entity = t.Object({
  ...AdFields,
  version: t.Number(),
});
```

### Audit Trail

```typescript
// Drizzle
history: p.json("history").$type<Array<{
  timestamp: string;
  userId: string;
  action: string;
  changes: Record<string, unknown>;
}>>()

// Don't expose in Create/Update
const Create = t.Object({
  title: t.String(),
  // No history field
});

// Entity - include for admins only
const EntityWithHistory = t.Object({
  ...AdFields,
  history: t.Array(t.Object({
    timestamp: t.String({ format: "date-time" }),
    userId: t.String({ format: "uuid" }),
    action: t.String(),
    changes: t.Record(t.String(), t.Unknown()),
  })),
});
```

---

## Pattern 10: Batch Operations

### Bulk Create

```typescript
const BulkCreate = t.Object({
  items: t.Array(Create, { minItems: 1, maxItems: 100 }),
});

const BulkCreateResponse = t.Object({
  created: t.Array(t.Object({ ...AdFields })),
  failed: t.Array(t.Object({
    index: t.Number(),
    error: t.String(),
  })),
});
```

### Bulk Update

```typescript
const BulkUpdate = t.Object({
  ids: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
  updates: Patch, // Apply same updates to all
});
```

### Bulk Delete

```typescript
const BulkDelete = t.Object({
  ids: t.Array(t.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
  permanent: t.Optional(t.Boolean()), // Hard delete vs soft delete
});
```

---

## Pattern 11: Validation Rules

### Cross-Field Validation

```typescript
// In schema, document validation rules
const Create = t.Object({
  startDate: t.String({ format: "date-time" }),
  endDate: t.String({ format: "date-time" }),
  // Note: endDate must be after startDate (validated in handler)
});

// In handler
.post("/ads", async ({ body }) => {
  if (new Date(body.endDate) <= new Date(body.startDate)) {
    throw new ValidationError("endDate must be after startDate");
  }
  // ...
})
```

### Custom Formats

```typescript
// Phone number
const Create = t.Object({
  phone: t.String({ 
    pattern: "^\\+?[1-9]\\d{1,14}$", // E.164 format
  }),
});

// Hex color
const Create = t.Object({
  color: t.String({ 
    pattern: "^#[0-9A-Fa-f]{6}$",
  }),
});

// Slug
const Create = t.Object({
  slug: t.String({ 
    pattern: "^[a-z0-9-]+$",
  }),
});
```

---

## Pattern 12: Polymorphic Associations

```typescript
// Drizzle - polymorphic reference
commentableType: p.varchar("commentable_type", { length: 50 }).notNull()
commentableId: p.uuid("commentable_id").notNull()

// Contract
const Create = t.Object({
  commentableType: t.Union([
    t.Literal("ad"),
    t.Literal("post"),
    t.Literal("product"),
  ]),
  commentableId: t.String({ format: "uuid" }),
  content: t.String(),
});

// Entity - with actual related object (requires JOIN)
const EntityWithCommentable = t.Object({
  ...CommentFields,
  commentable: t.Optional(t.Union([
    t.Object({ type: t.Literal("ad"), ...AdFields }),
    t.Object({ type: t.Literal("post"), ...PostFields }),
    t.Object({ type: t.Literal("product"), ...ProductFields }),
  ])),
});
```

---

## Best Practices Summary

1. **Keep Junction Tables Simple**: Don't create contracts for pure junction tables
2. **Separate Concerns**: Use different schemas for Create vs Entity (with relations)
3. **Validate Deeply**: Add format, pattern, min/max constraints where appropriate
4. **Document Assumptions**: Comment cross-field validations that happen in handlers
5. **Reuse Components**: Extract common schemas like enums, nested objects
6. **Type Safety**: Always use discriminated unions for polymorphic data
7. **Computed Fields**: Only include in Entity, never in Create/Update
8. **Context Fields**: Exclude tenant/user context fields from client input
9. **Audit Fields**: Never allow direct manipulation of audit trail fields
10. **Batch Limits**: Always set maxItems on bulk operations
