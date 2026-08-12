const attendanceService = require("../services/attendanceService");
const { success } = require("../utils/response");

async function getAttendance(req, res, next) {
  try {
    const { id: lessonId } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const data = await attendanceService.getAttendanceForLesson(lessonId, userScope, authHeader);
    return success(res, data, "Fetched attendance summary successfully");
  } catch (err) {
    next(err);
  }
}

async function syncAttendance(req, res, next) {
  try {
    const { id: lessonId } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const result = await attendanceService.syncAttendanceForLesson(lessonId, userScope, authHeader);
    return success(res, result, "Attendance synchronized with Core Backend successfully");
  } catch (err) {
    next(err);
  }
}

async function ensureSession(req, res, next) {
  try {
    const { id: lessonId } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const result = await attendanceService.ensureSessionForLesson(lessonId, userScope, authHeader);
    return success(res, result, "Core session linked successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAttendance,
  syncAttendance,
  ensureSession,
};
