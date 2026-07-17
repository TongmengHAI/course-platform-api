# Pagination (Global Utility)

A single, reusable pagination helper shared by **every module** that returns a list.
Source: [`src/utils/pagination.js`](../src/utils/pagination.js)

Use it in courses, users, or any future module so all list endpoints behave the
same way and return an identical `pagination` response shape.

---

## API

```js
const {
    getPaginationParams,
    buildPaginationMeta,
    paginateQuery,
} = require("../../utils/pagination"); // adjust relative path per module
```

### `getPaginationParams(query)`
Parses and clamps pagination input from `req.query`.

- **Input:** `req.query` (reads `page`, `limit`)
- **Returns:** `{ page, limit, skip }`
- **Rules:** `page >= 1`, `1 <= limit <= 100`, defaults `page=1` / `limit=10`, `skip = (page - 1) * limit`

### `buildPaginationMeta(total, page, limit)`
Builds the response metadata block.

- **Returns:** `{ page, limit, total, totalPages, hasPrev, hasNext }`
- Use when you build the query yourself (e.g. `findAndCount` or raw SQL).

### `paginateQuery(qb, { page, limit, skip })`
Convenience wrapper for a TypeORM QueryBuilder.

- Applies `.skip(skip).take(limit)` and runs `getManyAndCount()`
- **Returns:** `{ data, pagination }`

---

## Standard Query Parameters

Every paginated endpoint accepts these (both optional):

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number (min `1`). |
| `limit` | number | `10` | Items per page (min `1`, max `100`). |

Module-specific params (search / filters / sort) are layered on top by each
controller — see the [Adding to a new module](#adding-to-a-new-module) example.

---

## Standard Response Shape

Every paginated endpoint returns:

```json
{
  "message": "...",
  "data": [ /* rows for this page */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasPrev": false,
    "hasNext": true
  }
}
```

| Field | Description |
|---|---|
| `page` | Current page number. |
| `limit` | Items per page. |
| `total` | Total rows matching the query (ignores paging). |
| `totalPages` | `ceil(total / limit)`. |
| `hasPrev` | `true` if a previous page exists. |
| `hasNext` | `true` if a next page exists. |

---

## Usage Patterns

### 1. With a QueryBuilder (recommended for filters/search/sort)

```js
const { getPaginationParams, paginateQuery } = require("../../utils/pagination");

const listItems = async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);

    const qb = repository()
        .createQueryBuilder("item")
        .where("item.is_deleted = :isDeleted", { isDeleted: false });

    // ...apply module-specific search / filters / sort here...

    const { data, pagination } = await paginateQuery(qb, { page, limit, skip });

    res.json({ message: "Items retrieved successfully", data, pagination });
};
```

### 2. With `findAndCount` (simple lists, no query builder)

```js
const { getPaginationParams, buildPaginationMeta } = require("../../utils/pagination");

const listItems = async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [data, total] = await repository().findAndCount({
        where: { is_deleted: false },
        skip,
        take: limit,
    });

    res.json({
        message: "Items retrieved successfully",
        data,
        pagination: buildPaginationMeta(total, page, limit),
    });
};
```

---

## Full Example: Courses Listing (search + filter + sort)

The `GET /courses` handler layers **search**, **filters**, and **sort** on top of
the shared pagination helper. This is the reference implementation to copy from.

**Supported query params:** `page`, `limit` (pagination) + `search`, `category`,
`level`, `instructorId`, `minPrice`, `maxPrice`, `sortBy`, `order`.

```js
const { getPaginationParams, paginateQuery } = require("../../utils/pagination");

const getAllCourses = async (req, res) => {
    // ---- Pagination (shared helper) ----
    const { page, limit, skip } = getPaginationParams(req.query);

    // ---- Search (free text across title + description) ----
    const search = (req.query.search || "").trim();

    // ---- Filters ----
    const { category, level, instructorId, minPrice, maxPrice } = req.query;

    // ---- Sort (whitelisted field + direction) ----
    const allowedSortFields = ["id", "title", "price", "category", "level"];
    const sortBy = allowedSortFields.includes(req.query.sortBy)
        ? req.query.sortBy
        : "id";
    const order = String(req.query.order).toUpperCase() === "ASC" ? "ASC" : "DESC";

    // ---- Build the query (paging NOT applied yet) ----
    const qb = courseRepository()
        .createQueryBuilder("course")
        .leftJoinAndSelect("course.instructor", "instructor")
        .where("course.is_deleted = :isDeleted", { isDeleted: false });

    if (search) {
        qb.andWhere(
            "(course.title LIKE :search OR course.description LIKE :search)",
            { search: `%${search}%` }
        );
    }

    if (category) qb.andWhere("course.category = :category", { category });
    if (level) qb.andWhere("course.level = :level", { level });
    if (instructorId) qb.andWhere("course.instructorId = :instructorId", { instructorId: Number(instructorId) });
    if (minPrice !== undefined) qb.andWhere("course.price >= :minPrice", { minPrice: Number(minPrice) });
    if (maxPrice !== undefined) qb.andWhere("course.price <= :maxPrice", { maxPrice: Number(maxPrice) });

    qb.orderBy(`course.${sortBy}`, order);

    // ---- Apply paging + count in one call ----
    const { data, pagination } = await paginateQuery(qb, { page, limit, skip });

    res.json({ message: "Courses retrieved successfully", data, pagination });
};
```

### What each piece does

| Concern | Technique | Why |
|---|---|---|
| **Search** | `title LIKE %x% OR description LIKE %x%` | Free-text match across multiple columns. |
| **Filter** | `andWhere` per field, only if present | Optional, composable exact/range filters. |
| **Sort** | Whitelist `sortBy` + normalize `order` | Prevents SQL injection via the sort field. |
| **Paging** | `paginateQuery(qb, params)` last | Runs after filters so `total` counts the full match set. |

### Example request

```
GET /courses?search=node&category=Backend&minPrice=10&sortBy=price&order=ASC&page=1&limit=5
```

**Ordering matters:** search and filters are applied **before** `paginateQuery`, so
`pagination.total` reflects every matching course — not just the current page.

---

## Adding to a New Module

1. `require` the helper with the correct relative path from your controller.
2. Call `getPaginationParams(req.query)` at the top of the list handler.
3. Build your query (add search/filter/sort as needed) **without** applying paging.
4. Finish with `paginateQuery(qb, { page, limit, skip })` (QueryBuilder) or
   `buildPaginationMeta(total, page, limit)` (findAndCount).
5. Return `{ message, data, pagination }`.

> Keep filters/search/sort **before** paging so `total` reflects the full
> matching set, not just the current page.

---

## How It Works (under the hood)

1. **Parse & clamp** — `getPaginationParams` normalizes `page`/`limit` and computes `skip`.
2. **Build query** — filters/search/sort applied; paging **not** yet applied.
3. **Window + count** — `.skip().take()` maps to SQL `OFFSET`/`LIMIT`; `getManyAndCount()` returns the page rows **and** the total match count in one round-trip.
4. **Build meta** — `buildPaginationMeta` derives `totalPages`, `hasPrev`, `hasNext`.

| Concept | Formula | SQL |
|---|---|---|
| `skip` | `(page - 1) * limit` | `OFFSET` |
| `limit` | client value (clamped) | `LIMIT` |
| `total` | `COUNT(*)` of matches | — |

---

## Currently Used By

| Module | Endpoint | Extra params |
|---|---|---|
| Courses | `GET /courses` | `search`, `category`, `level`, `instructorId`, `minPrice`, `maxPrice`, `sortBy`, `order` |

_Add a row here whenever a new module adopts the utility._
