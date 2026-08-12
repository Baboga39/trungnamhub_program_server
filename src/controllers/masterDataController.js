const masterDataService = require("../services/masterDataService");
const { success } = require("../utils/response");

async function getCommonPrograms(req, res, next) {
  try {
    const list = masterDataService.getCommonPrograms();
    return success(res, list, "Fetched common programs successfully");
  } catch (err) {
    next(err);
  }
}

async function getLocations(req, res, next) {
  try {
    const list = masterDataService.getLocationList();
    return success(res, list, "Fetched locations successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCommonPrograms,
  getLocations,
};
