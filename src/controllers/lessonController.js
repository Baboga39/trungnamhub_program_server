const lessonService = require("../services/lessonService");
const programService = require("../services/programService");
const { validateCreateLesson, validateUpdateLesson } = require("../validators/lessonValidator");
const { success, error } = require("../utils/response");

async function getLessonsByProgram(req, res, next) {
  try {
    const { programId } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const lessons = await lessonService.getLessonsByProgramId(programId, userScope, authHeader);
    return success(res, lessons, "Fetched program lessons successfully");
  } catch (err) {
    next(err);
  }
}

async function getLessonById(req, res, next) {
  try {
    const { id } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const lesson = await lessonService.getLessonById(id, userScope, authHeader);
    return success(res, lesson, "Fetched program lesson details successfully");
  } catch (err) {
    next(err);
  }
}

async function createLesson(req, res, next) {
  try {
    const { programId } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    // Fetch parent program for quarter date validation
    const program = await programService.getProgramById(programId, userScope, authHeader);

    const validation = validateCreateLesson(req.body, program);
    if (!validation.isValid) {
      return error(res, "Validation Error", 400, validation.errors);
    }

    const newLesson = await lessonService.createLesson(programId, validation.data, userScope);
    return success(res, newLesson, "Program lesson created successfully", 201);
  } catch (err) {
    next(err);
  }
}

async function updateLesson(req, res, next) {
  try {
    const { id } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    // Fetch existing lesson to get parent program for date validation if date is modified
    let parentProgram = null;
    if (req.body.date) {
      const existingLesson = await lessonService.getLessonById(id, userScope, authHeader);
      parentProgram = await programService.getProgramById(
        existingLesson.quarterProgramId,
        userScope,
        authHeader
      );
    }

    const validation = validateUpdateLesson(req.body, parentProgram);
    if (!validation.isValid) {
      return error(res, "Validation Error", 400, validation.errors);
    }

    const updated = await lessonService.updateLesson(id, validation.data, userScope);
    return success(res, updated, "Program lesson updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteLesson(req, res, next) {
  try {
    const { id } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };

    const deleted = await lessonService.deleteLesson(id, userScope);
    return success(res, deleted, "Program lesson deleted successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLessonsByProgram,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
};
