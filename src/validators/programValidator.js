function validateCreateProgram(body) {
  const errors = [];
  const { year, quarter, branchId } = body;

  if (!branchId) {
    errors.push("branchId is required");
  }

  const yearNum = Number(year);
  if (!year || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    errors.push("year must be a valid 4-digit number (e.g. 2026)");
  }

  const quarterNum = Number(quarter);
  if (!quarter || isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
    errors.push("quarter must be an integer between 1 and 4 (Q1, Q2, Q3, Q4)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      branchId: String(branchId),
      year: yearNum,
      quarter: quarterNum,
      note: body.note || null,
      status: body.status || "DRAFT",
    },
  };
}

function validateUpdateProgram(body) {
  const errors = [];
  const data = {};

  if (body.status !== undefined) {
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(body.status)) {
      errors.push("status must be DRAFT, PUBLISHED, or ARCHIVED");
    } else {
      data.status = body.status;
    }
  }

  if (body.note !== undefined) {
    data.note = body.note;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

module.exports = {
  validateCreateProgram,
  validateUpdateProgram,
};
