/**
 * Shared Query Types for API Contracts
 * Place this in: src/modules/helper/query-types.t.model.ts
 */

import { type Static, t } from "elysia";

// ============================================
// Sorting Parameters
// ============================================

/**
 * Standard sorting parameters
 * 
 * @example
 * ```ts
 * // In contract
 * ListQuery: t.Object({
 *   ...SortParams.properties,
 * })
 * 
 * // In handler
 * const { sort, sortOrder } = query;
 * const orderBy = sort ? { [sort]: sortOrder || 'asc' } : undefined;
 * ```
 */
export const SortParams = t.Object({
  sort: t.Optional(t.String({
    description: "Field name to sort by (e.g., 'createdAt', 'title')",
  })),
  sortOrder: t.Optional(
    t.Union([t.Literal("asc"), t.Literal("desc")], {
      default: "asc",
      description: "Sort direction: ascending or descending",
    })
  ),
});

export type SortParams = Static<typeof SortParams>;

// ============================================
// Pagination Parameters
// ============================================

/**
 * Standard pagination parameters
 * 
 * @example
 * ```ts
 * // In contract
 * ListQuery: t.Object({
 *   ...PaginationParams.properties,
 * })
 * 
 * // In handler
 * const { page = 1, limit = 10 } = query;
 * const offset = (page - 1) * limit;
 * const items = await db.query.table.findMany({ limit, offset });
 * ```
 */
export const PaginationParams = t.Object({
  page: t.Optional(
    t.Number({
      minimum: 1,
      default: 1,
      description: "Page number (1-indexed)",
    })
  ),
  limit: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 100,
      default: 10,
      description: "Number of items per page (max 100)",
    })
  ),
});

export type PaginationParams = Static<typeof PaginationParams>;

// ============================================
// Base Query Parameters
// ============================================

/**
 * Basic query utilities (search, field selection)
 * 
 * @example
 * ```ts
 * // In contract
 * ListQuery: t.Object({
 *   ...BaseQueryParams.properties,
 * })
 * 
 * // In handler
 * const { search, fields } = query;
 * // Apply search across multiple fields
 * // Select only requested fields
 * ```
 */
export const BaseQueryParams = t.Object({
  search: t.Optional(
    t.String({
      description: "Search term to filter results",
    })
  ),
  fields: t.Optional(
    t.String({
      description: "Comma-separated field names to select (e.g., 'id,title,createdAt')",
    })
  ),
});

export type BaseQueryParams = Static<typeof BaseQueryParams>;

// ============================================
// Date Range Parameters
// ============================================

/**
 * Date range filtering
 * 
 * @example
 * ```ts
 * ListQuery: t.Object({
 *   ...DateRangeParams.properties,
 * })
 * 
 * // Usage
 * const { startDate, endDate } = query;
 * if (startDate && endDate) {
 *   where.push(
 *     and(
 *       gte(table.createdAt, new Date(startDate)),
 *       lte(table.createdAt, new Date(endDate))
 *     )
 *   );
 * }
 * ```
 */
export const DateRangeParams = t.Object({
  startDate: t.Optional(
    t.String({
      format: "date-time",
      description: "Filter from this date (ISO 8601)",
    })
  ),
  endDate: t.Optional(
    t.String({
      format: "date-time",
      description: "Filter until this date (ISO 8601)",
    })
  ),
});

export type DateRangeParams = Static<typeof DateRangeParams>;

// ============================================
// Helper: Create Paginated Response
// ============================================

/**
 * Create a paginated response schema
 * 
 * @param itemSchema - TypeBox schema for individual items
 * @returns Paginated response schema
 * 
 * @example
 * ```ts
 * const ListResponse = createPaginatedResponse(
 *   t.Object({ ...AdFields })
 * );
 * ```
 */
export function createPaginatedResponse<T extends t.TSchema>(
  itemSchema: T
) {
  return t.Object({
    data: t.Array(itemSchema),
    total: t.Number({ description: "Total number of items" }),
    page: t.Number({ description: "Current page number" }),
    limit: t.Number({ description: "Items per page" }),
    totalPages: t.Number({ description: "Total number of pages" }),
  });
}

// ============================================
// Helper: Create List Query Schema
// ============================================

/**
 * Create a complete list query schema with all standard params
 * 
 * @param businessFilters - Entity-specific filter schema
 * @returns Complete list query schema
 * 
 * @example
 * ```ts
 * const AdBusinessFilters = t.Object({
 *   type: t.Optional(t.String()),
 *   isActive: t.Optional(t.Boolean()),
 * });
 * 
 * const ListQuery = createListQuery(AdBusinessFilters);
 * ```
 */
export function createListQuery<T extends t.TObject>(
  businessFilters: T
) {
  return t.Object({
    ...businessFilters.properties,
    ...BaseQueryParams.properties,
    ...PaginationParams.properties,
    ...SortParams.properties,
  });
}

// ============================================
// Common Filter Patterns
// ============================================

/**
 * Boolean filter (tri-state: true/false/undefined)
 */
export const BooleanFilter = t.Optional(t.Boolean());

/**
 * UUID filter
 */
export const UUIDFilter = t.Optional(t.String({ format: "uuid" }));

/**
 * Enum filter (create specific unions as needed)
 */
export const createEnumFilter = <T extends string>(values: T[]) =>
  t.Optional(t.Union(values.map((v) => t.Literal(v)) as any));

/**
 * Number range filter
 */
export const createNumberRangeFilter = () =>
  t.Object({
    min: t.Optional(t.Number()),
    max: t.Optional(t.Number()),
  });
