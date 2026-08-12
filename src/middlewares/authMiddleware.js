const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { error } = require("../utils/response");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) {
    return error(res, "No authorization token provided", 401);
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return error(res, "Invalid token format. Use Bearer <token>", 401);
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    // Map userId if present in token as id or userId
    if (!req.user.userId && req.user.id) {
      req.user.userId = req.user.id;
    }
    next();
  } catch (err) {
    return error(res, "Unauthorized: Invalid or expired token", 401);
  }
}

module.exports = authMiddleware;
