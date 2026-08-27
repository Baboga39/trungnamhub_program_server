const { getUsersFromCore } = require("./userService");

/**
 * Default master list of branches if Core Backend branch list endpoint is static or derived.
 */
const DEFAULT_BRANCHES = [
  { id: "1", name: "Ngành Ấu" },
  { id: "2", name: "Ngành Thiếu" },
  { id: "3", name: "Ngành Nghĩa" },
  { id: "4", name: "Ngành Hiệp" },
  { id: "5", name: "Ban trưởng" },
];

async function getBranchesFromCore(authHeader = null) {
  try {
    // Attempt to extract distinct branches from Core Backend users
    const users = await getUsersFromCore(null, authHeader);
    const branchSet = new Set();

    users.forEach((u) => {
      if (u.branch) {
        branchSet.add(String(u.branch));
      }
    });

    if (branchSet.size > 0) {
      return Array.from(branchSet).map((b) => {
        const found = DEFAULT_BRANCHES.find((def) => def.id === b || def.name === b);
        return {
          id: b,
          name: found ? found.name : `Ngành ${b}`,
        };
      });
    }

    return DEFAULT_BRANCHES;
  } catch (err) {
    console.error("Failed to fetch branches from Core Backend:", err.message);
    return DEFAULT_BRANCHES;
  }
}

function getBranchInfo(branchId) {
  const found = DEFAULT_BRANCHES.find((b) => String(b.id) === String(branchId) || b.name === String(branchId));
  if (found) return found;
  return {
    id: String(branchId),
    name: String(branchId),
  };
}

module.exports = {
  getBranchesFromCore,
  getBranchInfo,
};
