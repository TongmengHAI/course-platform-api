// Reusable pagination helpers for list endpoints.

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse & normalize pagination params from a request query.
 * Clamps page >= 1 and 1 <= limit <= MAX_LIMIT so clients can't
 * request negative pages or huge result sets.
 *
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPaginationParams = (query = {}) => {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, Number(query.limit) || DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Build the pagination metadata block for a list response.
 *
 * @param {number} total - total rows matching the query (ignoring paging)
 * @param {number} page
 * @param {number} limit
 * @returns {{ page, limit, total, totalPages, hasPrev, hasNext }}
 */
const buildPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit) || 0;

    return {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
    };
};

/**
 * Convenience wrapper: paginate a TypeORM QueryBuilder.
 * Applies skip/take, runs getManyAndCount, and returns rows + meta.
 *
 * @param {import("typeorm").SelectQueryBuilder} qb
 * @param {{ page: number, limit: number, skip: number }} params
 * @returns {Promise<{ data: any[], pagination: object }>}
 */
const paginateQuery = async (qb, { page, limit, skip }) => {
    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { data, pagination: buildPaginationMeta(total, page, limit) };
};

module.exports = {
    getPaginationParams,
    buildPaginationMeta,
    paginateQuery,
};
