const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");

const logger = require("./config/logger");
const envConfig = require("./config/env");
const { apiLimiter, heavyEndpointLimiter } = require("./utils/apiLimiter");
const errorMiddleware = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const phoneRoutes = require("./routes/phoneRoutes");

const app = express();
app.set("trust proxy", 1);

// Request ID tracking
app.use((req, res, next) => {
  req.headers["x-request-id"] = req.headers["x-request-id"] || uuidv4();
  next();
});

// Security & Performance Middlewares
app.use(helmet());

// CORS: validate against configured allowed origins
const allowedOrigins = envConfig.allowedOrigins;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Rate Limiting
app.use("/api", apiLimiter);

// Logging (Morgan + Winston)
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Health Check (public, no auth)
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "running", timestamp: new Date().toISOString() });
});

// Also mount at /api/v1/health so frontend can use its base URL
app.get("/api/v1/health", (req, res) => {
  res
    .status(200)
    .json({ status: "running", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/whatsapp", whatsappRoutes);
app.use("/api/v1/phone", phoneRoutes);

// Serve Frontend in Production ONLY
if (envConfig.env === "production") {
  const clientDistPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// 404 Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Centralized Error Handling
app.use(errorMiddleware);

module.exports = app;
