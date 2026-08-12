const app = require("./app");
const env = require("./config/env");

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 TRUNG NAM HUB - PROGRAM SERVER STARTED`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${env.nodeEnv}`);
  console.log(`🔗 Core Backend API: ${env.coreBackendUrl}`);
  console.log(`==================================================`);
});

// Graceful shutdown handling
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("Shutting down Program Server gracefully...");
  server.close(() => {
    console.log("Server stopped.");
    process.exit(0);
  });
}
