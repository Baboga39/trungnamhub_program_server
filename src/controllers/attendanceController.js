const attendanceService = require("../services/attendanceService");
const { success } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const getAttendance = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userScope = {
    userId: req.user.userId,
    restrictedBranch: req.userBranch,
  };
  const authHeader = req.headers["authorization"];

  const data = await attendanceService.getAttendanceForLesson(lessonId, userScope, authHeader);
  return success(res, data, "Fetched attendance summary successfully");
});

const syncAttendance = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userScope = {
    userId: req.user.userId,
    restrictedBranch: req.userBranch,
  };
  const authHeader = req.headers["authorization"];

  const result = await attendanceService.syncAttendanceForLesson(lessonId, userScope, authHeader);
  return success(res, result, "Attendance synchronized with Core Backend successfully");
});

const ensureSession = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userScope = {
    userId: req.user.userId,
    restrictedBranch: req.userBranch,
  };
  const authHeader = req.headers["authorization"];

  const result = await attendanceService.ensureSessionForLesson(lessonId, userScope, authHeader);
  return success(res, result, "Core session linked successfully");
});

module.exports = {
  getAttendance,
  syncAttendance,
  ensureSession,
};
