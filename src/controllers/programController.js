const programService = require("../services/programService");
const approvalTokenService = require("../services/programApprovalTokenService");
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
      role: req.user.role,
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
      role: req.user.role,
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

async function sendProgramForApproval(req, res, next) {
  try {
    const { id } = req.params;
    const { reviewerIds } = req.body;

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return error(res, "Vui lòng chọn ít nhất 1 người phê duyệt", 400);
    }

    const userScope = {
      userId: req.user.userId,
      userName: req.user.name,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const result = await programService.sendProgramForApproval(id, reviewerIds, userScope, authHeader);
    return success(res, result, "Gửi yêu cầu phê duyệt chương trình thành công");
  } catch (err) {
    next(err);
  }
}

async function resubmitProgram(req, res, next) {
  try {
    const { id } = req.params;
    const { reviewerIds } = req.body;

    const userScope = {
      userId: req.user.userId,
      userName: req.user.name,
      restrictedBranch: req.userBranch,
    };
    const authHeader = req.headers["authorization"];

    const result = await programService.resubmitProgram(id, reviewerIds || [], userScope, authHeader);
    return success(res, result, "Trình lại phiên bản mới thành công");
  } catch (err) {
    next(err);
  }
}

async function handleProgramApproval(req, res, next) {
  try {
    const { token, action, comment } = req.body;

    if (!token || !action || !["APPROVE", "REJECT"].includes(action)) {
      return error(res, "Token và hành động (APPROVE/REJECT) là bắt buộc", 400);
    }

    const result = await approvalTokenService.handleProgramApproval(token, action, comment);
    return success(res, result, "Xử lý phê duyệt thành công");
  } catch (err) {
    next(err);
  }
}

async function handleProgramApprovalByUser(req, res, next) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return error(res, "Hành động (APPROVE/REJECT) là bắt buộc", 400);
    }

    const result = await approvalTokenService.handleProgramApprovalByUser({
      quarterProgramId: id,
      reviewerId: req.user.userId,
      action,
      comment,
    });
    return success(res, result, "Xử lý phê duyệt thành công");
  } catch (err) {
    next(err);
  }
}

async function getProgramApprovalDetail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return error(res, "Thiếu token phê duyệt", 400);
    }

    const authHeader = req.headers["authorization"];
    const detail = await approvalTokenService.getProgramApprovalDetail(token, authHeader);
    return success(res, detail, "Lấy thông tin phê duyệt thành công");
  } catch (err) {
    next(err);
  }
}

async function getProgramApprovalHistory(req, res, next) {
  try {
    const { id } = req.params;
    const authHeader = req.headers["authorization"];

    const history = await approvalTokenService.getProgramApprovalHistory(id, authHeader);
    return success(res, history, "Lấy lịch sử phê duyệt thành công");
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
  sendProgramForApproval,
  resubmitProgram,
  handleProgramApproval,
  handleProgramApprovalByUser,
  getProgramApprovalDetail,
  getProgramApprovalHistory,
};
