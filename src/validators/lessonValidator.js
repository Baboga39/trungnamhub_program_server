const { isDateInQuarter } = require("../utils/quarterUtils");

function validateCreateLesson(body, quarterProgram) {
  const errors = [];

  const {
    date,
    lessonText,
    prepared,
    durationMinutes,
    plannedParticipantCount,
    commonProgramCode,
    locationCode,
    note,
    evaluationPercent,
    coreSessionId,
  } = body;

  if (!date) {
    errors.push("date is required");
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push("date must be a valid ISO date format");
    } else if (quarterProgram) {
      const isValidDate = isDateInQuarter(parsedDate, quarterProgram.year, quarterProgram.quarter);
      if (!isValidDate) {
        errors.push(
          `date '${parsedDate.toISOString().split("T")[0]}' does not fall into Quarter ${quarterProgram.quarter}/${quarterProgram.year}`
        );
      }
    }
  }

  if (!lessonText || typeof lessonText !== "string" || !lessonText.trim()) {
    errors.push("lessonText is required and cannot be empty");
  }

  let duration = null;
  if (durationMinutes !== undefined && durationMinutes !== null) {
    duration = Number(durationMinutes);
    if (isNaN(duration) || duration <= 0) {
      errors.push("durationMinutes must be a positive integer greater than 0");
    }
  }

  let plannedCount = 0;
  if (plannedParticipantCount !== undefined && plannedParticipantCount !== null) {
    plannedCount = Number(plannedParticipantCount);
    if (isNaN(plannedCount) || plannedCount < 0) {
      errors.push("plannedParticipantCount must be a non-negative integer (>= 0)");
    }
  }

  let evalPercent = null;
  if (evaluationPercent !== undefined && evaluationPercent !== null && evaluationPercent !== "") {
    evalPercent = Number(evaluationPercent);
    if (isNaN(evalPercent) || evalPercent < 0 || evalPercent > 100) {
      errors.push("evaluationPercent must be a number between 0 and 100");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      quarterProgramId: quarterProgram ? quarterProgram.id : Number(body.quarterProgramId),
      date: new Date(date),
      lessonText: lessonText ? lessonText.trim() : "",
      prepared: Boolean(prepared),
      durationMinutes: duration,
      plannedParticipantCount: plannedCount,
      commonProgramCode: commonProgramCode || null,
      locationCode: locationCode || null,
      note: note || null,
      evaluationPercent: evalPercent,
      coreSessionId: coreSessionId ? Number(coreSessionId) : null,
    },
  };
}

function validateUpdateLesson(body, quarterProgram = null) {
  const errors = [];
  const data = {};

  if (body.date !== undefined) {
    const parsedDate = new Date(body.date);
    if (isNaN(parsedDate.getTime())) {
      errors.push("date must be a valid ISO date format");
    } else {
      if (quarterProgram) {
        const isValidDate = isDateInQuarter(parsedDate, quarterProgram.year, quarterProgram.quarter);
        if (!isValidDate) {
          errors.push(
            `date '${parsedDate.toISOString().split("T")[0]}' does not fall into Quarter ${quarterProgram.quarter}/${quarterProgram.year}`
          );
        }
      }
      data.date = parsedDate;
    }
  }

  if (body.lessonText !== undefined) {
    if (typeof body.lessonText !== "string" || !body.lessonText.trim()) {
      errors.push("lessonText cannot be empty");
    } else {
      data.lessonText = body.lessonText.trim();
    }
  }

  if (body.prepared !== undefined) {
    data.prepared = Boolean(body.prepared);
  }

  if (body.durationMinutes !== undefined) {
    if (body.durationMinutes === null) {
      data.durationMinutes = null;
    } else {
      const dur = Number(body.durationMinutes);
      if (isNaN(dur) || dur <= 0) {
        errors.push("durationMinutes must be a positive integer greater than 0");
      } else {
        data.durationMinutes = dur;
      }
    }
  }

  if (body.plannedParticipantCount !== undefined) {
    const planned = Number(body.plannedParticipantCount);
    if (isNaN(planned) || planned < 0) {
      errors.push("plannedParticipantCount must be a non-negative integer (>= 0)");
    } else {
      data.plannedParticipantCount = planned;
    }
  }

  if (body.commonProgramCode !== undefined) {
    data.commonProgramCode = body.commonProgramCode || null;
  }

  if (body.locationCode !== undefined) {
    data.locationCode = body.locationCode || null;
  }

  if (body.note !== undefined) {
    data.note = body.note || null;
  }

  if (body.evaluationPercent !== undefined) {
    if (body.evaluationPercent === null || body.evaluationPercent === "") {
      data.evaluationPercent = null;
    } else {
      const evalP = Number(body.evaluationPercent);
      if (isNaN(evalP) || evalP < 0 || evalP > 100) {
        errors.push("evaluationPercent must be a number between 0 and 100");
      } else {
        data.evaluationPercent = evalP;
      }
    }
  }

  if (body.coreSessionId !== undefined) {
    data.coreSessionId = body.coreSessionId ? Number(body.coreSessionId) : null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

module.exports = {
  validateCreateLesson,
  validateUpdateLesson,
};
