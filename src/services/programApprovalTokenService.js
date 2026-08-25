const prisma = require("../libs/prisma");
const crypto = require("crypto");
const {
  sendProgramApprovalMail,
  sendProgramDecisionMailToCreator,
  sendProgramDecisionConfirmationToReviewer,
} = require("./mailService/mailService");
const { getUsersByIdsFromCore } = require("../integrations/core/userService");
const { getBranchInfo } = require("../integrations/core/branchService");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function getProgramById(id, tx = prisma) {
  return tx.quarterProgram.findUnique({
    where: { id: Number(id) },
    include: {
      lessons: {
        orderBy: { date: "asc" },
        include: {
          files: true,
          leaders: true,
        },
      },
    },
  });
}

async function getTokenByToken(token, tx = prisma) {
  return tx.programApprovalToken.findUnique({ where: { token } });
}

async function getTokenByReviewer(quarterProgramId, reviewerId, version, tx = prisma) {
  return tx.programApprovalToken.findFirst({
    where: { quarterProgramId: Number(quarterProgramId), reviewerId: Number(reviewerId), version: Number(version) },
  });
}

async function createApprovalHistory(data, tx = prisma) {
  return tx.programApproval.create({ data });
}

async function updateTokenStatus(id, status, tx = prisma) {
  return tx.programApprovalToken.update({
    where: { id },
    data: { status },
  });
}

async function updateProgramStatus(id, data, tx = prisma) {
  return tx.quarterProgram.update({
    where: { id: Number(id) },
    data,
  });
}

async function countTotalApprovers(quarterProgramId, version, tx = prisma) {
  return tx.programApprovalToken.count({
    where: { quarterProgramId: Number(quarterProgramId), version: Number(version) },
  });
}

async function countApproved(quarterProgramId, version, tx = prisma) {
  return tx.programApproval.count({
    where: {
      quarterProgramId: Number(quarterProgramId),
      version: Number(version),
      action: "APPROVE",
    },
  });
}

function validateToken(tokenData, action) {
  if (!tokenData) throw { statusCode: 404, message: "Invalid approval token" };

  if (tokenData.status === "APPROVED") {
    throw { statusCode: 400, message: "Already approved - cannot change decision" };
  }

  if (tokenData.status === "REJECTED" && action === "REJECT") {
    throw { statusCode: 400, message: "Already rejected" };
  }

  if (tokenData.expiredAt && new Date(tokenData.expiredAt) < new Date()) {
    throw { statusCode: 410, message: "Approval token expired" };
  }
}

function validateProgram(program) {
  if (!program) throw { statusCode: 404, message: "Quarter program not found" };

  if (program.status === "APPROVED" || program.status === "PUBLISHED") {
    throw { statusCode: 400, message: "Quarter program is already finalized" };
  }
}

function validateVersion(tokenData, program) {
  if (tokenData.version !== program.version) {
    throw { statusCode: 400, message: "Token is outdated for this program version" };
  }
}

async function handleApprovalCore({ tx, program, tokenData, action, comment }) {
  await createApprovalHistory(
    {
      quarterProgramId: program.id,
      reviewerId: tokenData.reviewerId,
      action,
      comment: comment || null,
      version: program.version,
    },
    tx
  );

  await updateTokenStatus(
    tokenData.id,
    action === "APPROVE" ? "APPROVED" : "REJECTED",
    tx
  );

  if (action === "REJECT") {
    await updateProgramStatus(
      program.id,
      { status: "NEED_REVISION" },
      tx
    );

    return { success: true, status: "NEED_REVISION", message: "Program marked for revision" };
  }

  const [total, approved] = await Promise.all([
    countTotalApprovers(program.id, program.version, tx),
    countApproved(program.id, program.version, tx),
  ]);

  if (approved >= total) {
    await updateProgramStatus(
      program.id,
      {
        status: "APPROVED",
        approvedById: tokenData.reviewerId,
      },
      tx
    );

    return { success: true, status: "APPROVED", message: "Program fully approved" };
  }

  return { success: true, status: "PENDING", message: `Approved (${approved}/${total})` };
}

async function notifyApprovalDecision({ program, tokenData, action, comment, resultStatus, authHeader }) {
  try {
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const programLink = `${frontendUrl}/programs/${program.id}`;

    const userIds = [];
    if (program.createdBy) userIds.push(Number(program.createdBy));
    if (tokenData?.reviewerId) userIds.push(Number(tokenData.reviewerId));

    const userMap = await getUsersByIdsFromCore(userIds, authHeader);
    const creator = program.createdBy ? userMap.get(Number(program.createdBy)) : null;
    const reviewer = userMap.get(Number(tokenData.reviewerId));
    const reviewerName = reviewer?.name || `Trưởng #${tokenData.reviewerId}`;

    // 1. Gửi mail thông báo tới người tạo chương trình
    if (creator && creator.email) {
      sendProgramDecisionMailToCreator({
        toEmail: creator.email,
        creatorName: creator.name || "Ban Phụ Trách",
        reviewerName,
        program,
        action,
        comment,
        programStatus: resultStatus,
        programLink,
      }).catch((err) => console.error("Lỗi khi gửi email kết quả duyệt tới người tạo:", err));
    }

    // 2. Gửi mail xác nhận tới người duyệt
    if (reviewer && reviewer.email) {
      sendProgramDecisionConfirmationToReviewer({
        toEmail: reviewer.email,
        reviewerName,
        program,
        action,
        comment,
        programStatus: resultStatus,
        programLink,
      }).catch((err) => console.error("Lỗi khi gửi email xác nhận cho người duyệt:", err));
    }
  } catch (err) {
    console.error("Failed to process approval decision notification emails:", err);
  }
}

async function handleProgramApproval(token, action, comment, authHeader = null) {
  let contextData = null;

  const result = await prisma.$transaction(async (tx) => {
    const tokenData = await getTokenByToken(token, tx);
    validateToken(tokenData, action);

    const program = await getProgramById(tokenData.quarterProgramId, tx);
    validateProgram(program);
    validateVersion(tokenData, program);

    const coreResult = await handleApprovalCore({
      tx,
      program,
      tokenData,
      action,
      comment,
    });

    contextData = { program, tokenData, action, comment, resultStatus: coreResult.status };
    return coreResult;
  });

  if (contextData) {
    notifyApprovalDecision({ ...contextData, authHeader });
  }

  return result;
}

async function handleProgramApprovalByUser({
  quarterProgramId,
  reviewerId,
  action,
  comment,
}, authHeader = null) {
  let contextData = null;

  const result = await prisma.$transaction(async (tx) => {
    const program = await getProgramById(quarterProgramId, tx);
    validateProgram(program);

    const tokenData = await getTokenByReviewer(
      quarterProgramId,
      reviewerId,
      program.version,
      tx
    );

    if (!tokenData) {
      throw { statusCode: 403, message: "You are not assigned to approve this program" };
    }

    validateToken(tokenData, action);

    const coreResult = await handleApprovalCore({
      tx,
      program,
      tokenData,
      action,
      comment,
    });

    contextData = { program, tokenData, action, comment, resultStatus: coreResult.status };
    return coreResult;
  });

  if (contextData) {
    notifyApprovalDecision({ ...contextData, authHeader });
  }

  return result;
}


async function createProgramApprovalToken(quarterProgramId, reviewerIds, senderUser = null, tx = prisma, authHeader = null) {
  if (!reviewerIds || !reviewerIds.length) {
    throw { statusCode: 400, message: "No reviewers provided" };
  }

  const program = await getProgramById(quarterProgramId, tx);
  if (!program) throw { statusCode: 404, message: "Quarter program not found" };

  const uniqueReviewerIds = Array.from(new Set(reviewerIds.map((id) => Number(id))));

  const tokens = uniqueReviewerIds.map((reviewerId) => ({
    token: generateToken(),
    quarterProgramId: Number(quarterProgramId),
    reviewerId,
    version: program.version,
    expiredAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 48h
  }));

  const result = await tx.programApprovalToken.createMany({ data: tokens });

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  const links = tokens.map((t) => ({
    reviewerId: t.reviewerId,
    link: `${frontendUrl}/approve-program?token=${t.token}`,
  }));

  // Fetch reviewer user details from Core Backend
  const userMap = await getUsersByIdsFromCore(uniqueReviewerIds, authHeader);
  const programTitle = `Chương trình Sinh hoạt Ngành ${program.branchId} - Q${program.quarter}/${program.year}`;

  for (const { reviewerId, link } of links) {
    const reviewer = userMap.get(reviewerId);
    if (reviewer && reviewer.email) {
      sendProgramApprovalMail({
        toEmail: reviewer.email,
        programTitle,
        reviewerName: reviewer.name || `User #${reviewerId}`,
        senderName: senderUser?.name || "Ban Điều Hành",
        approvalLink: link,
        lessonCount: program.lessons.length,
      }).catch((err) => console.error("Lỗi khi gửi email phê duyệt chương trình:", err));
    }
  }

  return {
    count: result.count,
    links,
  };
}

async function getProgramApprovalDetail(token, authHeader = null) {
  const tokenData = await prisma.programApprovalToken.findUnique({
    where: { token },
    include: {
      quarterProgram: {
        include: {
          lessons: {
            orderBy: { date: "asc" },
            include: {
              files: true,
              leaders: true,
            },
          },
        },
      },
    },
  });

  if (!tokenData) {
    throw { statusCode: 404, message: "Invalid approval token" };
  }

  const program = tokenData.quarterProgram;
  const branch = getBranchInfo(program.branchId);

  // Fetch leader names
  const leaderUserIds = new Set();
  program.lessons.forEach((l) => l.leaders.forEach((ldr) => leaderUserIds.add(ldr.userId)));
  const userMap = await getUsersByIdsFromCore(Array.from(leaderUserIds), authHeader);

  const lessons = program.lessons.map((l) => ({
    id: l.id,
    date: l.date.toISOString().split("T")[0],
    lessonText: l.lessonText,
    prepared: l.prepared,
    durationMinutes: l.durationMinutes,
    plannedParticipantCount: l.plannedParticipantCount,
    locationCode: l.locationCode,
    note: l.note,
    leaders: l.leaders.map((ldr) => ({
      userId: ldr.userId,
      name: userMap.get(ldr.userId)?.name || `Trưởng #${ldr.userId}`,
      role: ldr.role,
    })),
    files: l.files.map((f) => ({
      id: f.id,
      originalName: f.originalName,
      url: f.cloudinaryUrl,
    })),
  }));

  return {
    token: tokenData.token,
    status: tokenData.status,
    expiredAt: tokenData.expiredAt,
    version: tokenData.version,
    reviewerId: tokenData.reviewerId,
    program: {
      id: program.id,
      branchId: program.branchId,
      branch,
      year: program.year,
      quarter: program.quarter,
      status: program.status,
      version: program.version,
      note: program.note,
      lessons,
      createdAt: program.createdAt,
    },
  };
}

async function getProgramApprovalHistory(quarterProgramId, authHeader = null) {
  const logs = await prisma.programApproval.findMany({
    where: { quarterProgramId: Number(quarterProgramId) },
    orderBy: { createdAt: "desc" },
  });

  const reviewerIds = Array.from(new Set(logs.map((l) => l.reviewerId)));
  const userMap = await getUsersByIdsFromCore(reviewerIds, authHeader);

  return logs.map((log) => ({
    id: log.id,
    quarterProgramId: log.quarterProgramId,
    reviewerId: log.reviewerId,
    reviewerName: userMap.get(log.reviewerId)?.name || `User #${log.reviewerId}`,
    action: log.action,
    comment: log.comment,
    version: log.version,
    createdAt: log.createdAt,
  }));
}

async function getPendingProgramApprovals(reviewerId) {
  const pendingTokens = await prisma.programApprovalToken.findMany({
    where: {
      reviewerId: Number(reviewerId),
      status: "PENDING",
    },
    include: {
      quarterProgram: {
        include: {
          lessons: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return pendingTokens
    .filter((t) => t.quarterProgram !== null)
    .map((t) => {
      const prog = t.quarterProgram;
      const branch = getBranchInfo(prog.branchId);
      return {
        tokenId: t.id,
        token: t.token,
        expiredAt: t.expiredAt,
        createdAt: t.createdAt,
        program: {
          id: prog.id,
          branchId: prog.branchId,
          branch,
          year: prog.year,
          quarter: prog.quarter,
          status: prog.status,
          version: prog.version,
          note: prog.note,
          lessonCount: prog.lessons.length,
        },
      };
    });
}

module.exports = {
  createProgramApprovalToken,
  handleProgramApproval,
  handleProgramApprovalByUser,
  getProgramApprovalDetail,
  getProgramApprovalHistory,
  getPendingProgramApprovals,
};
