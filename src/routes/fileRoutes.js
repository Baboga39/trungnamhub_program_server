const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const { enforceBranchScope } = require("../middlewares/branchScopeMiddleware");

router.use(authMiddleware);

router.post(
  "/program-lessons/:id/files",
  enforceBranchScope(),
  uploadMiddleware.single("file"),
  fileController.uploadFile
);

router.get("/program-lessons/:id/files", enforceBranchScope(), fileController.getFiles);

router.delete(
  "/program-lessons/:id/files/:fileId",
  enforceBranchScope(),
  fileController.deleteFile
);

module.exports = router;
