const app = require("./app");
const env = require("./config/env");
const prisma = require("./libs/prisma");

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

async function shutdown() {
  console.log("\n🛑 Shutting down Program Server gracefully...");
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("🔌 Prisma disconnected cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("Error disconnecting Prisma:", err);
      process.exit(1);
    }
  });
}

module.exports = server;
