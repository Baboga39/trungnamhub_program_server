const leaderService = require("../services/leaderService");
const { getUsersFromCore } = require("../integrations/core/userService");
const { success, error } = require("../utils/response");

async function getLeaders(req, res, next) {
  try {
    const { lessonId } = req.params;
    const authHeader = req.headers["authorization"];

    const leaders = await leaderService.getLeadersByLessonId(lessonId, authHeader);
    return success(res, leaders, "Fetched program leaders successfully");
  } catch (err) {
    next(err);
  }
}

async function addLeader(req, res, next) {
  try {
    const { lessonId } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const leader = await leaderService.addLeaderToLesson(
      lessonId,
      req.body,
      userScope,
      authHeader
    );
    return success(res, leader, "Program leader assigned successfully", 201);
  } catch (err) {
    next(err);
  }
}

async function removeLeader(req, res, next) {
  try {
    const { lessonId, userId } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };

    const result = await leaderService.removeLeaderFromLesson(lessonId, userId, userScope);
    return success(res, result, "Program leader removed successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Proxy API: GET /api/v1/users?branchId=2
 * Section 15 Requirement:
 * - Fetches Users from Core Backend filtered by requested branchId.
 * - Non-admin users are strictly restricted to their assigned branch.
 */
async function getUsersByBranch(req, res, next) {
  try {
    let targetBranch = req.query.branchId;

    // Non-admin scope restriction
    if (req.userBranch) {
      if (targetBranch && String(targetBranch) !== String(req.userBranch)) {
        return error(
          res,
          `Forbidden: You cannot fetch users for branch '${targetBranch}'. Your assigned branch is '${req.userBranch}'`,
          403
        );
      }
      targetBranch = req.userBranch;
    }

    const authHeader = req.headers["authorization"];
    const users = await getUsersFromCore(targetBranch, authHeader);

    return success(res, users, "Fetched branch users from Core Backend successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLeaders,
  addLeader,
  removeLeader,
  getUsersByBranch,
};
