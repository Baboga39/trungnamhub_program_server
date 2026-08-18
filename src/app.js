const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const registerRoutes = require("./routes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

// Trust Render's reverse proxy
app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

app.use(limiter);

// Request Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "trungnamhub_program_server",
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
registerRoutes(app);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;