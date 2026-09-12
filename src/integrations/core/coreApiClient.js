const axios = require("axios");
const axiosRetry = require("axios-retry").default || require("axios-retry");
const coreConfig = require("../../config/coreApi");

function createCoreClient(authHeader = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const client = axios.create({
    baseURL: coreConfig.baseUrl,
    timeout: coreConfig.timeout,
    headers,
  });

  axiosRetry(client, {
    retries: 3,
    retryDelay: (retryCount) => {
      // Exponential backoff with jitter: 1s, 2s, 4s (+ 0-300ms jitter)
      const delay = Math.pow(2, retryCount - 1) * 1000;
      const jitter = Math.random() * 300;
      return delay + jitter;
    },
    retryCondition: (error) => {
      // Retry on network errors, timeout (ECONNABORTED), or Core 5xx responses (502, 503, 504 during cold-start)
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.code === "ECONNABORTED" ||
        (error.response && error.response.status >= 500)
      );
    },
    onRetry: (retryCount, error, requestConfig) => {
      console.warn(
        `⚠️ [CoreApiClient] Request to Core failed (${error.message}). Retrying attempt ${retryCount}/3: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`
      );
    },
  });

  return client;
}

module.exports = {
  createCoreClient,
};
