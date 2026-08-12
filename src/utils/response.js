/**
 * Utility helper functions for consistent API responses.
 */

function success(res, data = null, message = "Success", statusCode = 200, meta = undefined) {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

function error(res, message = "Internal Server Error", statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  success,
  error,
};
