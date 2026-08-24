const prisma = require("../libs/prisma");
const { getBranchInfo } = require("../integrations/core/branchService");
const { getUsersByIdsFromCore } = require("../integrations/core/userService");
const { getCommonProgramByCode, getLocationByCode } = require("./masterDataService");
const { deleteFileFromLesson } = require("./fileService");
const { createProgramApprovalToken } = require("./programApprovalTokenService");

/**
 * Service managing QuarterProgram domain entities.
 */

async function getPrograms(filters = {}, userScope = {}) {
  const where = {};

  // Branch Scope Authorization filter
  if (userScope.restrictedBranch) {
    where.branchId = String(userScope.restrictedBranch);
  } else if (filters.branchId) {
    where.branchId = String(filters.branchId);
  }

  if (filters.year) {
    where.year = Number(filters.year);
  }

  if (filters.quarter) {
    where.quarter = Number(filters.quarter);
  }

  const userRole = String(userScope.role || "").toLowerCase();
  const isAdmin = userRole === "admin";
  const currentUserId = userScope.userId ? Number(userScope.userId) : null;

  // Quyền riêng tư danh sách Chương trình sinh hoạt:
  // - Admin: Xem được toàn bộ trạng thái (DRAFT, PENDING, APPROVED, PUBLISHED...)
  // - User thường: Xem được bản nháp/đang duyệt DO CHÍNH MÌNH TẠO, hoặc các bản ĐÃ DUYỆT/PHÁT HÀNH của người khác
  if (!isAdmin && currentUserId) {
    const statusCondition = filters.status ? { status: filters.status } : {};
    where.AND = [
      statusCondition,
      {
        OR: [
          { createdBy: currentUserId },
          { status: { in: ["APPROVED", "PUBLISHED"] } },
        ],
      },
    ];
  } else if (filters.status) {
    where.status = filters.status;
  }

  const programs = await prisma.quarterProgram.findMany({
    where,
    orderBy: [{ year: "desc" }, { quarter: "desc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  return programs.map((p) => ({
    id: p.id,
    branchId: p.branchId,
    branch: getBranchInfo(p.branchId),
    year: p.year,
    quarter: p.quarter,
    status: p.status,
    note: p.note,
    lessonCount: p._count.lessons,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

async function getProgramById(id, userScope = {}, authHeader = null) {
  const program = await prisma.quarterProgram.findUnique({
    where: { id: Number(id) },
    include: {
      lessons: {
        orderBy: { date: "asc" },
        include: {
          leaders: true,
          files: true,
          evaluations: true,
        },
      },
    },
  });

  if (!program) {
    throw { statusCode: 404, message: "Quarter program not found" };
  }

  const userRole = String(userScope.role || "").toLowerCase();
  const isAdmin = userRole === "admin";
  const currentUserId = userScope.userId ? Number(userScope.userId) : null;

  // Kiểm tra quyền xem chi tiết: Người tạo hoặc Admin xem thoải mái, người khác chỉ được xem khi ĐÃ DUYỆT
  if (!isAdmin && currentUserId && program.createdBy !== currentUserId) {
    const isApprovedOrPublished = ["APPROVED", "PUBLISHED"].includes(program.status);
    if (!isApprovedOrPublished) {
      throw { statusCode: 403, message: "Chương trình này chưa được phê duyệt hoàn tất nên bạn chưa thể xem" };
    }
  }

  // Batch collect all leader userIds to populate names from Core Backend
  const allLeaderUserIds = new Set();
  program.lessons.forEach((lesson) => {
    lesson.leaders.forEach((leader) => {
      allLeaderUserIds.add(leader.userId);
    });
  });

  const userMap = await getUsersByIdsFromCore(Array.from(allLeaderUserIds), authHeader);

  // Format frontend-friendly response payload
  const formattedLessons = program.lessons.map((lesson) => {
    const formattedLeaders = lesson.leaders.map((leader) => {
      const coreUser = userMap.get(leader.userId);
      return {
        id: leader.id,
        userId: leader.userId,
        name: coreUser ? coreUser.name : `Trưởng #${leader.userId}`,
        role: leader.role,
      };
    });

    const formattedFiles = lesson.files.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.cloudinaryUrl,
      createdAt: file.createdAt,
    }));

    return {
      id: lesson.id,
      date: lesson.date.toISOString().split("T")[0],
      lessonText: lesson.lessonText,
      prepared: lesson.prepared,
      durationMinutes: lesson.durationMinutes,
      plannedParticipantCount: lesson.plannedParticipantCount,
      actualParticipantCount: lesson.actualParticipantCount,
      commonProgram: getCommonProgramByCode(lesson.commonProgramCode),
      location: getLocationByCode(lesson.locationCode),
      leaders: formattedLeaders,
      files: formattedFiles,
      evaluationPercent: lesson.evaluationPercent,
      note: lesson.note,
      coreSessionId: lesson.coreSessionId,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  });

  return {
    id: program.id,
    year: program.year,
    quarter: program.quarter,
    status: program.status,
    note: program.note,
    branch: getBranchInfo(program.branchId),
    lessons: formattedLessons,
    createdBy: program.createdBy,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
  };
}

async function createProgram(data, userScope = {}) {
  const { branchId, year, quarter, note, status } = data;

  // Authorization check for non-admin
  if (userScope.restrictedBranch && String(branchId) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: `Forbidden: Cannot create program for branch '${branchId}'` };
  }

  // Check unique constraint: @@unique([branchId, year, quarter])
  const existing = await prisma.quarterProgram.findUnique({
    where: {
      branchId_year_quarter: {
        branchId: String(branchId),
        year: Number(year),
        quarter: Number(quarter),
      },
    },
  });

  if (existing) {
    throw {
      statusCode: 409,
      message: `A Quarter Program for branch '${branchId}', year ${year}, Q${quarter} already exists`,
    };
  }

  const program = await prisma.quarterProgram.create({
    data: {
      branchId: String(branchId),
      year: Number(year),
      quarter: Number(quarter),
      note: note || null,
      status: status || "DRAFT",
      createdBy: userScope.userId || null,
    },
  });

  return {
    ...program,
    branch: getBranchInfo(program.branchId),
  };
}

async function updateProgram(id, data, userScope = {}) {
  const program = await prisma.quarterProgram.findUnique({
    where: { id: Number(id) },
  });

  if (!program) {
    throw { statusCode: 404, message: "Quarter program not found" };
  }

  if (userScope.restrictedBranch && String(program.branchId) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: "Forbidden: Cannot update program of another branch" };
  }

  const updated = await prisma.quarterProgram.update({
    where: { id: Number(id) },
    data: {
      ...data,
      updatedBy: userScope.userId || null,
    },
  });

  return {
    ...updated,
    branch: getBranchInfo(updated.branchId),
  };
}

async function deleteProgram(id, userScope = {}) {
  const programId = Number(id);

  const program = await prisma.quarterProgram.findUnique({
    where: {
      id: programId,
    },
    include: {
      lessons: {
        include: {
          files: true,
        },
      },
    },
  });

  if (!program) {
    throw {
      statusCode: 404,
      message: "Quarter program not found",
    };
  }

  // Check branch permission
  if (
    userScope.restrictedBranch &&
    String(program.branchId) !==
      String(userScope.restrictedBranch)
  ) {
    throw {
      statusCode: 403,
      message:
        "Forbidden: Cannot delete program of another branch",
    };
  }

  // Chặn xóa chương trình đã được phê duyệt
  if (["APPROVED", "PUBLISHED"].includes(program.status)) {
    throw {
      statusCode: 400,
      message: "Chương trình sinh hoạt đã được phê duyệt, không thể xóa.",
    };
  }

 
  let deletedFileCount = 0;

  for (const lesson of program.lessons) {
    for (const file of lesson.files) {
      await deleteFileFromLesson(
        lesson.id,
        file.id,
        userScope
      );

      deletedFileCount++;
    }
  }

  await prisma.quarterProgram.delete({
    where: {
      id: programId,
    },
  });

  return {
    id: programId,
    deletedFileCount,
  };
}

async function sendProgramForApproval(id, reviewerIds, userScope = {}, authHeader = null) {
  const programId = Number(id);

  const program = await prisma.quarterProgram.findUnique({
    where: { id: programId },
  });

  if (!program) {
    throw { statusCode: 404, message: "Quarter program not found" };
  }

  if (userScope.restrictedBranch && String(program.branchId) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: "Forbidden: Cannot send program of another branch for approval" };
  }

  if (program.status !== "DRAFT" && program.status !== "NEED_REVISION") {
    throw { statusCode: 400, message: `Program in status '${program.status}' cannot be sent for approval` };
  }

  await prisma.quarterProgram.update({
    where: { id: programId },
    data: { status: "PENDING" },
  });

  const result = await createProgramApprovalToken(
    programId,
    reviewerIds,
    { id: userScope.userId, name: userScope.userName },
    prisma,
    authHeader
  );

  return {
    success: true,
    programId,
    status: "PENDING",
    approversCount: result.count,
  };
}

async function resubmitProgram(id, reviewerIds = [], userScope = {}, authHeader = null) {
  const programId = Number(id);

  const program = await prisma.quarterProgram.findUnique({
    where: { id: programId },
  });

  if (!program) {
    throw { statusCode: 404, message: "Quarter program not found" };
  }

  if (userScope.restrictedBranch && String(program.branchId) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: "Forbidden: Cannot resubmit program of another branch" };
  }

  if (program.status !== "NEED_REVISION") {
    throw { statusCode: 400, message: "Program is not in revision state" };
  }

  // Find reviewers who rejected the previous version if reviewerIds is empty
  let targetReviewerIds = reviewerIds;
  if (!targetReviewerIds || targetReviewerIds.length === 0) {
    const rejectedLogs = await prisma.programApproval.findMany({
      where: {
        quarterProgramId: programId,
        version: program.version,
        action: "REJECT",
      },
      select: { reviewerId: true },
    });
    targetReviewerIds = Array.from(new Set(rejectedLogs.map((r) => r.reviewerId)));
  }

  if (!targetReviewerIds.length) {
    throw { statusCode: 400, message: "No reviewer specified for resubmission" };
  }

  const newVersion = program.version + 1;

  // Clear old tokens for this program
  await prisma.programApprovalToken.deleteMany({
    where: { quarterProgramId: programId },
  });

  // Update program version and status
  await prisma.quarterProgram.update({
    where: { id: programId },
    data: {
      version: newVersion,
      status: "PENDING",
      updatedBy: userScope.userId || null,
    },
  });

  // Record RESUBMIT audit log
  await prisma.programApproval.create({
    data: {
      quarterProgramId: programId,
      reviewerId: userScope.userId || 0,
      action: "RESUBMIT",
      version: newVersion,
      comment: "Đã cập nhật bài học và trình lại phiên bản mới",
    },
  });

  // Generate tokens for new version
  const result = await createProgramApprovalToken(
    programId,
    targetReviewerIds,
    { id: userScope.userId, name: userScope.userName },
    prisma,
    authHeader
  );

  return {
    success: true,
    programId,
    version: newVersion,
    status: "PENDING",
    approversCount: result.count,
  };
}

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  sendProgramForApproval,
  resubmitProgram,
};
