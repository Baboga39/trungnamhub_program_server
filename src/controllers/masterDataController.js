const masterDataService = require("../services/masterDataService");
const { success } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const getCommonPrograms = asyncHandler(async (req, res) => {
  const list = masterDataService.getCommonPrograms();
  return success(res, list, "Fetched common programs successfully");
});

const getLocations = asyncHandler(async (req, res) => {
  const list = masterDataService.getLocationList();
  return success(res, list, "Fetched locations successfully");
});

module.exports = {
  getCommonPrograms,
  getLocations,
};
