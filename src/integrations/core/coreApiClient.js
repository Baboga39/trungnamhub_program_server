const axios = require("axios");
const coreConfig = require("../../config/coreApi");

function createCoreClient(authHeader = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  return axios.create({
    baseURL: coreConfig.baseUrl,
    timeout: coreConfig.timeout,
    headers,
  });
}

module.exports = {
  createCoreClient,
};
