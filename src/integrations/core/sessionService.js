const { createCoreClient } = require("./coreApiClient");

/**
 * Interface with Core Backend for Session management.
 */
async function ensureSessionInCore(
  date,
  branchId,
  userId,
  authHeader = null
) {
  const client = createCoreClient(authHeader);

  try {
    const response = await client.post(
      "/attendance/ensure-session",
      {
        date,
        branch: branchId,
        userId,
      }
    );

    const sessionData =
      response.data?.data ||
      response.data;

    if (!sessionData?.id) {
      throw new Error(
        "Core Backend returned invalid session data"
      );
    }

    console.log("[Core Session] Ensured:", {
      id: sessionData.id,
      date: sessionData.date,
      branch: sessionData.branch,
    });

    return sessionData;
  } catch (err) {
    console.error(
      "[Core Session] Failed to ensure session:",
      err.response?.data ||
        err.message
    );

    throw {
      statusCode: 502,
      message:
        "Unable to ensure attendance session in Core Backend",
      cause: err,
    };
  }
}

/**
 * Find existing attendance session in Core Backend without creating a ghost session.
 */
async function findSessionInCore(date, branchId, authHeader = null) {
  const client = createCoreClient(authHeader);

  try {
    const d = new Date(date);
    const dateStr = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : date;

    const response = await client.get("/attendance/find-session", {
      params: {
        date: dateStr,
        branch: branchId,
      },
    });

    const sessionData = response.data?.data || response.data;
    return sessionData?.id ? sessionData : null;
  } catch (err) {
    if (err.response?.status === 404) {
      return null;
    }
    console.error(
      "[Core Session] Failed to find session:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = {
  ensureSessionInCore,
  findSessionInCore,
};