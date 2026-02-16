const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");

const logger = require("./config/logger");
const apiLimiter = require("./utils/apiLimiter");
const errorMiddleware = require("./middleware/errorMiddleware");
const leadRoutes = require("./routes/leadRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
// Start background worker
require("./workers/whatsappWorker");

const app = express();

// Request ID tracking
app.use((req, res, next) => {
  req.headers["x-request-id"] = req.headers["x-request-id"] || uuidv4();
  next();
});

// Security & Performance Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS || "*" })); // In production, restrict this
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
app.use("/api", apiLimiter);

// Logging (Morgan + Winston)
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Health Check
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "running", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/whatsapp", whatsappRoutes);

// 404 Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Centralized Error Handling
app.use(errorMiddleware);

module.exports = app;
