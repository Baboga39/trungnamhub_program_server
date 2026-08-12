const { createCoreClient } = require("./coreApiClient");


async function getAttendanceFromCore(
  date,
  branchId = null,
  sessionId = null,
  authHeader = null,
) {
  try {
    if (!sessionId) {
      throw new Error("sessionId is required to get attendance summary");
    }

    const client = createCoreClient(authHeader);

    const dateStr = new Date(date).toISOString().split("T")[0];

    const response = await client.get(
      `/attendance/summary/${dateStr}/${sessionId}`,
    );

    const summary = response.data?.data || response.data;

    if (!summary) {
      throw new Error("Invalid attendance summary response from Core");
    }

    console.log("[Attendance Summary]", {
      date: dateStr,
      branchId,
      sessionId,
      totalMemberCount: summary.totalMemberCount,
      presentCount: summary.presentCount,
      lateCount: summary.lateCount,
      absentCount: summary.absentCount,
      actualParticipantCount: summary.actualParticipantCount,
    });

    return {
      records: Array.isArray(summary.records)
        ? summary.records
        : [],

      totalMemberCount: Number(
        summary.totalMemberCount || 0,
      ),

      presentCount: Number(
        summary.presentCount || 0,
      ),

      lateCount: Number(
        summary.lateCount || 0,
      ),

      absentCount: Number(
        summary.absentCount || 0,
      ),

      actualParticipantCount: Number(
        summary.actualParticipantCount || 0,
      ),
    };
  } catch (err) {
    console.error(
      `Failed to fetch attendance from Core Backend for date ${date}, session ${sessionId}:`,
      err.response?.data || err.message,
    );

    return {
      records: [],
      totalMemberCount: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      actualParticipantCount: 0,
    };
  }
}

module.exports = {
  getAttendanceFromCore,
};