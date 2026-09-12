// src/utils/asyncHandler.js
/**
 * Wraps an async express route handler to automatically catch rejected promises
 * and pass them to next(err). Eliminates repetitive try/catch boilerplate.
 *
 * @param {Function} fn - Async express handler (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
