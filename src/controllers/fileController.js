const fileService = require("../services/fileService");
const { validateUploadFile } = require("../validators/fileValidator");
const { success, error } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const uploadFile = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const validation = validateUploadFile(req.file);

  if (!validation.isValid) {
    return error(res, "Validation Error", 400, validation.errors);
  }

  const userScope = {
    userId: req.user.userId,
    restrictedBranch: req.userBranch,
  };

  const uploaded = await fileService.uploadFileToLesson(lessonId, req.file, userScope);
  return success(res, uploaded, "File uploaded successfully", 201);
});

const getFiles = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const files = await fileService.getFilesByLessonId(lessonId);
  return success(res, files, "Fetched lesson files successfully");
});

const deleteFile = asyncHandler(async (req, res) => {
  const { id: lessonId, fileId } = req.params;
  const userScope = {
    userId: req.user.userId,
    restrictedBranch: req.userBranch,
  };

  const deleted = await fileService.deleteFileFromLesson(lessonId, fileId, userScope);
  return success(res, deleted, "File deleted successfully");
});

module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
};
