const { createCoreClient } = require("./coreApiClient");

/**
 * Service to interface with Core Backend for User data.
 */

async function getUsersFromCore(branchId = null, authHeader = null) {
  try {
    const client = createCoreClient(authHeader);
    const response = await client.get("/users");

    // Standard core API response structure: { success: true, message: ..., data: [...] } or array directly
    let users = response.data?.data || response.data || [];
    if (!Array.isArray(users)) {
      users = [];
    }

    // Filter by branchId if provided
    if (branchId) {
      users = users.filter((u) => String(u.branch) === String(branchId) || String(u.branchId) === String(branchId));
    }

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      branch: u.branch,
      active: u.active ?? true,
    }));
  } catch (err) {
    console.error("Failed to fetch users from Core Backend:", err.message);
    return [];
  }
}

async function getUserByIdFromCore(userId, authHeader = null) {
  try {
    const users = await getUsersFromCore(null, authHeader);
    return users.find((u) => Number(u.id) === Number(userId)) || null;
  } catch (err) {
    console.error(`Failed to fetch user ${userId} from Core Backend:`, err.message);
    return null;
  }
}

async function getUsersByIdsFromCore(userIds = [], authHeader = null) {
  if (!userIds || userIds.length === 0) return new Map();

  const users = await getUsersFromCore(null, authHeader);
  const userMap = new Map();
  users.forEach((u) => {
    userMap.set(Number(u.id), u);
  });

  return userMap;
}

module.exports = {
  getUsersFromCore,
  getUserByIdFromCore,
  getUsersByIdsFromCore,
};
