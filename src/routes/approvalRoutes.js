const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");

// Public / Token-authenticated 1-click approval endpoints
router.get("/detail", programController.getProgramApprovalDetail);
router.post("/handle", programController.handleProgramApproval);

module.exports = router;
