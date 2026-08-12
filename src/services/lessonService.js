const prisma = require("../libs/prisma");
const { getUsersByIdsFromCore } = require("../integrations/core/userService");
const { getCommonProgramByCode, getLocationByCode } = require("./masterDataService");
const {deleteFileFromLesson} = require("./fileService");

/**
 * Service managing ProgramLesson domain entities.
 */

async function getLessonsByProgramId(programId, userScope = {}, authHeader = null) {
  const program = await prisma.quarterProgram.findUnique({
    where: { id: Number(programId) },
  });

  if (!program) {
    throw { statusCode: 404, message: "Quarter program not found" };
  }

  const lessons = await prisma.programLesson.findMany({
    where: { quarterProgramId: Number(programId) },
    orderBy: { date: "asc" },
    include: {
      leaders: true,
      files: true,
      evaluations: true,
    },
  });

  const allLeaderUserIds = new Set();
  lessons.forEach((l) => l.leaders.forEach((ldr) => allLeaderUserIds.add(ldr.userId)));

  const userMap = await getUsersByIdsFromCore(Array.from(allLeaderUserIds), authHeader);

  return lessons.map((lesson) => formatLessonResponse(lesson, userMap));
}

async function getLessonById(id, userScope = {}, authHeader = null) {
  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(id) },
    include: {
      quarterProgram: true,
      leaders: true,
      files: true,
      evaluations: true,
    },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  const userIds = lesson.leaders.map((ldr) => ldr.userId);
  const userMap = await getUsersByIdsFromCore(userIds, authHeader);

  return formatLessonResponse(lesson, userMap);
}

async function createLesson(programId, data, userScope = {}) {
  const program = await prisma.quarterProgram.findUnique({
    where: { id: Number(programId) },
  });

  if (!program) {
    throw { statusCode: 404, message: "Quarter program not found" };
  }

  if (userScope.restrictedBranch && String(program.branchId) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: "Forbidden: Cannot create lesson for another branch" };
  }

  const newLesson = await prisma.programLesson.create({
    data: {
      quarterProgramId: Number(programId),
      date: data.date,
      lessonText: data.lessonText,
      prepared: data.prepared || false,
      durationMinutes: data.durationMinutes || null,
      plannedParticipantCount: data.plannedParticipantCount || 0,
      actualParticipantCount: 0,
      commonProgramCode: data.commonProgramCode || null,
      locationCode: data.locationCode || null,
      note: data.note || null,
      evaluationPercent: data.evaluationPercent || null,
      coreSessionId: data.coreSessionId || null,
    },
    include: {
      leaders: true,
      files: true,
    },
  });

  return formatLessonResponse(newLesson);
}

async function updateLesson(id, data, userScope = {}) {
  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(id) },
    include: { quarterProgram: true },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  if (
    userScope.restrictedBranch &&
    String(lesson.quarterProgram.branchId) !== String(userScope.restrictedBranch)
  ) {
    throw { statusCode: 403, message: "Forbidden: Cannot update lesson of another branch" };
  }

  const updated = await prisma.programLesson.update({
    where: { id: Number(id) },
    data,
    include: {
      leaders: true,
      files: true,
    },
  });

  return formatLessonResponse(updated);
}

async function deleteLesson(id, userScope = {}) {
  const lessonId = Number(id);

  const lesson = await prisma.programLesson.findUnique({
    where: {
      id: lessonId,
    },
    include: {
      quarterProgram: true,
      files: true,
    },
  });

  if (!lesson) {
    throw {
      statusCode: 404,
      message: "Program lesson not found",
    };
  }

  // Check branch permission
  if (
    userScope.restrictedBranch &&
    String(lesson.quarterProgram.branchId) !==
      String(userScope.restrictedBranch)
  ) {
    throw {
      statusCode: 403,
      message:
        "Forbidden: Cannot delete lesson of another branch",
    };
  }

  // Delete all related files
  for (const file of lesson.files) {
    await deleteFileFromLesson(
      lessonId,
      file.id,
      userScope
    );
  }

  // Delete lesson
  await prisma.programLesson.delete({
    where: {
      id: lessonId,
    },
  });

  return {
    id: lessonId,
  };
}

function formatLessonResponse(lesson, userMap = new Map()) {
  const leaders = (lesson.leaders || []).map((l) => {
    const user = userMap.get(l.userId);
    return {
      id: l.id,
      userId: l.userId,
      name: user ? user.name : `Trưởng #${l.userId}`,
      role: l.role,
    };
  });

  const files = (lesson.files || []).map((f) => ({
    id: f.id,
    originalName: f.originalName,
    fileName: f.fileName,
    mimeType: f.mimeType,
    size: f.size,
    url: f.cloudinaryUrl,
    createdAt: f.createdAt,
  }));

  return {
    id: lesson.id,
    quarterProgramId: lesson.quarterProgramId,
    date: lesson.date ? lesson.date.toISOString().split("T")[0] : null,
    lessonText: lesson.lessonText,
    prepared: lesson.prepared,
    durationMinutes: lesson.durationMinutes,
    plannedParticipantCount: lesson.plannedParticipantCount,
    actualParticipantCount: lesson.actualParticipantCount,
    commonProgram: getCommonProgramByCode(lesson.commonProgramCode),
    location: getLocationByCode(lesson.locationCode),
    leaders,
    files,
    evaluationPercent: lesson.evaluationPercent,
    note: lesson.note,
    coreSessionId: lesson.coreSessionId,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

module.exports = {
  getLessonsByProgramId,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  formatLessonResponse,
};
