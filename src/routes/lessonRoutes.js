const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lessonController");
const authMiddleware = require("../middlewares/authMiddleware");
const { enforceBranchScope } = require("../middlewares/branchScopeMiddleware");

router.use(authMiddleware);

router.get("/:id", enforceBranchScope(), lessonController.getLessonById);
router.patch("/:id", enforceBranchScope(), lessonController.updateLesson);
router.delete("/:id", enforceBranchScope(), lessonController.deleteLesson);

module.exports = router;
