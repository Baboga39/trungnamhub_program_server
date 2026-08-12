const programService = require("../services/programService");
const { validateCreateProgram, validateUpdateProgram } = require("../validators/programValidator");
const { success, error } = require("../utils/response");

async function getPrograms(req, res, next) {
  try {
    const filters = {
      year: req.query.year,
      quarter: req.query.quarter,
      branchId: req.query.branchId,
      status: req.query.status,
    };

    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };

    const programs = await programService.getPrograms(filters, userScope);
    return success(res, programs, "Fetched quarter programs successfully");
  } catch (err) {
    next(err);
  }
}

async function getProgramById(req, res, next) {
  try {
    const { id } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const program = await programService.getProgramById(id, userScope, authHeader);
    return success(res, program, "Fetched quarter program details successfully");
  } catch (err) {
    next(err);
  }
}

async function createProgram(req, res, next) {
  try {
    // Non-admin cannot specify a different branchId
    if (req.userBranch && req.body.branchId && String(req.body.branchId) !== String(req.userBranch)) {
      return error(
        res,
        `Forbidden: You cannot create a program for branch '${req.body.branchId}'. Assigned branch: '${req.userBranch}'`,
        403
      );
    }

    // Force non-admin branchId to user's assigned branch
    if (req.userBranch) {
      req.body.branchId = req.userBranch;
    }

    const validation = validateCreateProgram(req.body);
    if (!validation.isValid) {
      return error(res, "Validation Error", 400, validation.errors);
    }

    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };

    const newProgram = await programService.createProgram(validation.data, userScope);
    return success(res, newProgram, "Quarter program created successfully", 201);
  } catch (err) {
    next(err);
  }
}

async function updateProgram(req, res, next) {
  try {
    const { id } = req.params;

    const validation = validateUpdateProgram(req.body);
    if (!validation.isValid) {
      return error(res, "Validation Error", 400, validation.errors);
    }

    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };

    const updated = await programService.updateProgram(id, validation.data, userScope);
    return success(res, updated, "Quarter program updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteProgram(req, res, next) {
  try {
    const { id } = req.params;
    const userScope = {
      userId: req.user.userId,
      restrictedBranch: req.userBranch,
    };

    const deleted = await programService.deleteProgram(id, userScope);
    return success(res, deleted, "Quarter program deleted successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
};
