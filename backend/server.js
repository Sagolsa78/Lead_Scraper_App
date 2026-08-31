require("dotenv").config();
const http = require("http");
const app = require("./app");
const prisma = require("./config/prisma");
const logger = require("./config/logger");

const PORT = process.env.PORT || 5005;

const server = http.createServer(app);

const startServer = async () => {
  try {
    // 1. Connect and Verify Database (Prisma)
    await prisma.$connect();
    logger.info("PostgreSQL Database connected successfully via Prisma.");

    // 2. Start BullMQ Workers in-process (dev mode)
    try {
      const discoveryWorker = require("./workers/discoveryWorker");
      const whatsappWorker = require("./workers/whatsappWorker");
      logger.info("✅ BullMQ workers started in-process (discovery + whatsapp)");
      console.log("\n🔧 [WORKERS] Discovery worker and WhatsApp worker are ACTIVE and listening for jobs.\n");
    } catch (workerErr) {
      logger.error("Failed to start workers:", workerErr.message);
      console.error("❌ [WORKERS] Failed to start workers:", workerErr.message);
    }

    // 3. Start Server
    server.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
      );
      console.log(`\n🚀 [SERVER] LeadFinder API running on http://localhost:${PORT}`);
      console.log(`📡 [SERVER] Workers are processing jobs from Redis queue\n`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful Shutdown
const gracefulShutdown = () => {
  logger.info("Received shutdown signal. Closing server...");
  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await prisma.$disconnect();
      logger.info("Database connection closed.");
      process.exit(0);
    } catch (err) {
      logger.error("Error during database shutdown:", err);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer();
