const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const lessonController = require("../controllers/lessonController");
const authMiddleware = require("../middlewares/authMiddleware");
const { enforceBranchScope } = require("../middlewares/branchScopeMiddleware");

router.use(authMiddleware);

router.get("/", enforceBranchScope(), programController.getPrograms);
router.get("/:id", enforceBranchScope(), programController.getProgramById);
router.post("/", enforceBranchScope({ allowBodyOverride: false }), programController.createProgram);
router.patch("/:id", enforceBranchScope(), programController.updateProgram);
router.delete("/:id", enforceBranchScope(), programController.deleteProgram);

// Program Approval routes
router.post("/:id/send-approval", enforceBranchScope(), programController.sendProgramForApproval);
router.post("/:id/resubmit", enforceBranchScope(), programController.resubmitProgram);
router.post("/:id/handle-approval", programController.handleProgramApprovalByUser);
router.get("/:id/approval-history", programController.getProgramApprovalHistory);

// Nested lesson routes under programs
router.get("/:programId/lessons", enforceBranchScope(), lessonController.getLessonsByProgram);
router.post("/:programId/lessons", enforceBranchScope(), lessonController.createLesson);

module.exports = router;
