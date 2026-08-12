const express = require("express");
const router = express.Router();
const leaderController = require("../controllers/leaderController");
const authMiddleware = require("../middlewares/authMiddleware");
const { enforceBranchScope } = require("../middlewares/branchScopeMiddleware");

router.use(authMiddleware);

// Leader management endpoints under program-lessons
router.get("/program-lessons/:lessonId/leaders", enforceBranchScope(), leaderController.getLeaders);
router.post("/program-lessons/:lessonId/leaders", enforceBranchScope(), leaderController.addLeader);
router.delete(
  "/program-lessons/:lessonId/leaders/:userId",
  enforceBranchScope(),
  leaderController.removeLeader
);

// Branch User selection proxy endpoint: GET /api/v1/users?branchId=2
router.get("/users", enforceBranchScope(), leaderController.getUsersByBranch);

module.exports = router;
