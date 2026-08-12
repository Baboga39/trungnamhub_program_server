const prisma = require("../libs/prisma");
const { getBranchInfo } = require("../integrations/core/branchService");
const { getUsersByIdsFromCore } = require("../integrations/core/userService");
const { getCommonProgramByCode, getLocationByCode } = require("./masterDataService");
const {
  deleteFileFromLesson,
} = require("./fileService");

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

  if (filters.status) {
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

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
};
