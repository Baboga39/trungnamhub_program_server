const { error } = require("../utils/response");

function errorMiddleware(err, req, res, next) {
  console.error("Unhandled Application Error:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || null;

  return error(res, message, statusCode, errors);
}

module.exports = errorMiddleware;
