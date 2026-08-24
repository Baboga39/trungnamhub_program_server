const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const authMiddleware = require("../middlewares/authMiddleware");

// Public / Token-authenticated 1-click approval endpoints
router.get("/detail", programController.getProgramApprovalDetail);
router.post("/handle", programController.handleProgramApproval);

// Protected — requires JWT session
router.get("/pending", authMiddleware, programController.getPendingProgramApprovals);

module.exports = router;
