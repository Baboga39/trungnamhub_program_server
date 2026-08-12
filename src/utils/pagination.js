/**
 * Pagination helper utility for parsing and formatting list endpoints.
 */

function getPaginationParams(query) {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildPaginationMeta(totalItems, page, limit) {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    totalItems,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = {
  getPaginationParams,
  buildPaginationMeta,
};
