const prisma = require("../libs/prisma");
const { getUserByIdFromCore, getUsersByIdsFromCore } = require("../integrations/core/userService");

/**
 * Service managing ProgramLeader entities.
 */

async function getLeadersByLessonId(lessonId, authHeader = null) {
  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(lessonId) },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  const leaders = await prisma.programLeader.findMany({
    where: { programLessonId: Number(lessonId) },
  });

  const userIds = leaders.map((l) => l.userId);
  const userMap = await getUsersByIdsFromCore(userIds, authHeader);

  return leaders.map((l) => {
    const user = userMap.get(l.userId);
    return {
      id: l.id,
      programLessonId: l.programLessonId,
      userId: l.userId,
      name: user ? user.name : `Trưởng #${l.userId}`,
      role: l.role,
      createdAt: l.createdAt,
    };
  });
}

async function addLeaderToLesson(lessonId, data, userScope = {}, authHeader = null) {
  const { userId, role = "MAIN" } = data;

  if (!userId) {
    throw { statusCode: 400, message: "userId is required" };
  }

  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(lessonId) },
    include: { quarterProgram: true },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  const lessonBranch = lesson.quarterProgram.branchId;

  if (userScope.restrictedBranch && String(lessonBranch) !== String(userScope.restrictedBranch)) {
    throw { statusCode: 403, message: "Forbidden: Cannot assign leaders for another branch" };
  }

  // Validate user exists in Core Backend and belongs to the lesson's branch
  const coreUser = await getUserByIdFromCore(userId, authHeader);
  if (!coreUser) {
    throw { statusCode: 404, message: `User ID ${userId} not found in Core system` };
  }

  if (coreUser.branch && String(coreUser.branch) !== String(lessonBranch)) {
    throw {
      statusCode: 400,
      message: `User '${coreUser.name}' belongs to branch '${coreUser.branch}', but this program is for branch '${lessonBranch}'`,
    };
  }

  // Upsert or create leader record
  const leader = await prisma.programLeader.upsert({
    where: {
      programLessonId_userId: {
        programLessonId: Number(lessonId),
        userId: Number(userId),
      },
    },
    update: {
      role: role || "MAIN",
    },
    create: {
      programLessonId: Number(lessonId),
      userId: Number(userId),
      role: role || "MAIN",
    },
  });

  return {
    id: leader.id,
    programLessonId: leader.programLessonId,
    userId: leader.userId,
    name: coreUser.name,
    role: leader.role,
  };
}

async function removeLeaderFromLesson(lessonId, userId, userScope = {}) {
  const lesson = await prisma.programLesson.findUnique({
    where: { id: Number(lessonId) },
    include: { quarterProgram: true },
  });

  if (!lesson) {
    throw { statusCode: 404, message: "Program lesson not found" };
  }

  if (
    userScope.restrictedBranch &&
    String(lesson.quarterProgram.branchId) !== String(userScope.restrictedBranch)
  ) {
    throw { statusCode: 403, message: "Forbidden: Cannot remove leaders for another branch" };
  }

  await prisma.programLeader.delete({
    where: {
      programLessonId_userId: {
        programLessonId: Number(lessonId),
        userId: Number(userId),
      },
    },
  });

  return { lessonId: Number(lessonId), userId: Number(userId) };
}

module.exports = {
  getLeadersByLessonId,
  addLeaderToLesson,
  removeLeaderFromLesson,
};
