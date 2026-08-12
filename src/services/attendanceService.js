const prisma = require("../libs/prisma");
const { getAttendanceFromCore } = require("../integrations/core/attendanceService");
const { ensureSessionInCore } = require("../integrations/core/sessionService");

/**
 * Service managing Attendance integration between Program Lesson and Core Backend.
 */

async function ensureSessionForLesson(lessonId, userScope = {}, authHeader = null) {
  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(lessonId) },
    include: { quarterProgram: true },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  const branchId = lesson.quarterProgram.branchId;

  if (userScope.restrictedBranch && String(branchId) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: "Forbidden: Access denied to lesson of another branch" };
  }

  // Call Core Backend to ensure session exists for this date and branch
  const coreSession = await ensureSessionInCore(
    lesson.date,
    branchId,
    userScope.userId || 1,
    authHeader
  );

  const updatedLesson = await prisma.programLesson.update({
    where: { id: Number(lessonId) },
    data: {
      coreSessionId: Number(coreSession.id),
    },
  });

  return {
    lessonId: updatedLesson.id,
    coreSessionId: updatedLesson.coreSessionId,
    date: updatedLesson.date,
    branchId,
  };
}

async function syncAttendanceForLesson(lessonId, userScope = {}, authHeader = null) {
  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(lessonId) },
    include: { quarterProgram: true },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  const branchId = lesson.quarterProgram.branchId;

  if (userScope.restrictedBranch && String(branchId) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: "Forbidden: Cannot sync attendance for another branch" };
  }

  // Ensure coreSessionId exists
  let coreSessionId = lesson.coreSessionId;
  if (!coreSessionId) {
    const sessionRes = await ensureSessionForLesson(lessonId, userScope, authHeader);
    coreSessionId = sessionRes.coreSessionId;
  }

  // Fetch attendance counts from Core Backend
  const attendanceData = await getAttendanceFromCore(
    lesson.date,
    branchId,
    coreSessionId,
    authHeader
  );

  console.log(attendanceData);

  // Update actualParticipantCount in local database
  const updatedLesson = await prisma.programLesson.update({
    where: { id: Number(lessonId) },
    data: {
      actualParticipantCount: attendanceData.actualParticipantCount,
      coreSessionId,
    },
  });

  return {
    lessonId: updatedLesson.id,
    coreSessionId: updatedLesson.coreSessionId,
    plannedParticipantCount: updatedLesson.plannedParticipantCount,
    actualParticipantCount: updatedLesson.actualParticipantCount,
    breakdown: {
      present: attendanceData.presentCount,
      late: attendanceData.lateCount,
      absent: attendanceData.absentCount,
    },
  };
}

async function getAttendanceForLesson(lessonId, userScope = {}, authHeader = null) {
  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(lessonId) },
    include: { quarterProgram: true },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  const branchId = lesson.quarterProgram.branchId;

  const attendanceData = await getAttendanceFromCore(
    lesson.date,
    branchId,
    lesson.coreSessionId,
    authHeader
  );

  return {
    lessonId: lesson.id,
    coreSessionId: lesson.coreSessionId,
    date: lesson.date,
    branchId,
    plannedParticipantCount: lesson.plannedParticipantCount,
    actualParticipantCount: attendanceData.actualParticipantCount,
    breakdown: {
      present: attendanceData.presentCount,
      late: attendanceData.lateCount,
      absent: attendanceData.absentCount,
    },
    records: attendanceData.records,
  };
}

module.exports = {
  ensureSessionForLesson,
  syncAttendanceForLesson,
  getAttendanceForLesson,
};
