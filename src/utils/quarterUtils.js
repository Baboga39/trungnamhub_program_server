/**
 * Helper utilities for Quarter and Date Range validations.
 */

function getQuarterDateRange(year, quarter) {
  const y = Number(year);
  const q = Number(quarter);

  if (isNaN(y) || isNaN(q) || q < 1 || q > 4) {
    throw new Error("Invalid year or quarter");
  }

  let startMonth = 0; // 0-indexed (Jan = 0)
  let endMonth = 2;   // (Mar = 2)

  if (q === 2) {
    startMonth = 3; // Apr
    endMonth = 5;   // Jun
  } else if (q === 3) {
    startMonth = 6; // Jul
    endMonth = 8;   // Sep
  } else if (q === 4) {
    startMonth = 9;  // Oct
    endMonth = 11;  // Dec
  }

  // Start of quarter (00:00:00.000)
  const startDate = new Date(Date.UTC(y, startMonth, 1, 0, 0, 0, 0));

  // End of quarter (23:59:59.999 of last day of endMonth)
  const endDate = new Date(Date.UTC(y, endMonth + 1, 0, 23, 59, 59, 999));

  return { startDate, endDate };
}

function isDateInQuarter(dateInput, year, quarter) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  const { startDate, endDate } = getQuarterDateRange(year, quarter);
  return date >= startDate && date <= endDate;
}

function getQuarterFromDate(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 1-indexed

  let quarter = 1;
  if (month >= 4 && month <= 6) quarter = 2;
  else if (month >= 7 && month <= 9) quarter = 3;
  else if (month >= 10 && month <= 12) quarter = 4;

  return { year, quarter };
}

module.exports = {
  getQuarterDateRange,
  isDateInQuarter,
  getQuarterFromDate,
};
