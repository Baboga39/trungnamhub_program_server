const { error } = require("../utils/response");

/**
 * Middleware to enforce branch authorization rules:
 * - Admin users (role === "admin") can access any branch.
 * - Non-admin users can ONLY access data for their own branch (user.branch / user.branchId).
 * - Attempts to access/modify a different branch result in 403 Forbidden.
 */

function enforceBranchScope(options = {}) {
  const { paramName = "branchId", allowBodyOverride = false } = options;

  return (req, res, next) => {
    if (!req.user) {
      return error(res, "Unauthorized", 401);
    }

    const userRole = (req.user.role || "").toLowerCase();
    const userBranch = req.user.branch || req.user.branchId;

    // Admin has full access to all branches for read and write
    if (userRole === "admin") {
      req.userBranch = null;
      return next();
    }

    // GET requests: allow viewing any branch data
    if (req.method === "GET") {
      req.userBranch = null;
      return next();
    }

    // WRITE operations (POST, PATCH, DELETE, PUT): restrict to user's assigned branch
    if (!userBranch) {
      return error(res, "Forbidden: User has no branch assigned", 403);
    }

    req.userBranch = String(userBranch);

    let requestedBranchId = req.query[paramName] || req.params[paramName];
    if (allowBodyOverride && req.body && req.body[paramName]) {
      requestedBranchId = req.body[paramName];
    }

    if (requestedBranchId && String(requestedBranchId) !== String(userBranch)) {
      return error(
        res,
        `Forbidden: Bạn chỉ được phép chỉnh sửa dữ liệu thuộc Ngành của mình (${userBranch}).`,
        403
      );
    }

    if (req.body && req.body[paramName] !== undefined && !allowBodyOverride) {
      if (String(req.body[paramName]) !== String(userBranch)) {
        return error(
          res,
          `Forbidden: Bạn không thể tạo/sửa dữ liệu cho Ngành '${req.body[paramName]}'. Ngành của bạn là '${userBranch}'.`,
          403
        );
      }
    }

    next();
  };
}

module.exports = {
  enforceBranchScope,
};
