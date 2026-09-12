require("dotenv").config();

// Fail-fast validation
const requiredVars = ["DATABASE_URL"];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`\n❌ [FATAL] Program Server is missing required environment variables:`);
  missingVars.forEach((key) => console.error(`   - ${key}`));
  console.error(`👉 Please define them in your .env file or hosting provider (Render/VPS).\n`);
  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === "supersecret")
) {
  console.warn(
    `\n⚠️  [SECURITY WARNING] Program Server is running in production with missing or default JWT_SECRET!`
  );
  console.warn(
    `👉 Ensure JWT_SECRET matches the Core Backend secret on production.\n`
  );
}

module.exports = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  coreBackendUrl: process.env.CORE_BACKEND_URL || "http://localhost:5000/api/v1",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
