const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middlewares/authMiddleware");
const { enforceBranchScope } = require("../middlewares/branchScopeMiddleware");

router.use(authMiddleware);

router.get(
  "/program-lessons/:id/attendance",
  enforceBranchScope(),
  attendanceController.getAttendance
);

router.post(
  "/program-lessons/:id/sync-attendance",
  enforceBranchScope(),
  attendanceController.syncAttendance
);

router.post(
  "/program-lessons/:id/ensure-session",
  enforceBranchScope(),
  attendanceController.ensureSession
);

module.exports = router;
