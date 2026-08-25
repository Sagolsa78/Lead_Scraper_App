/**
 * Worker entry point — runs BullMQ workers independently from the HTTP API.
 * Start with: node workers/index.js
 */
require("dotenv").config();
const logger = require("../config/logger");

logger.info("Starting LeadFinder workers...");

// Import workers (each registers itself with BullMQ)
const whatsappWorker = require("./whatsappWorker");
const discoveryWorker = require("./discoveryWorker");

logger.info("All workers registered and listening for jobs.");

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Received shutdown signal. Closing workers...");
  await whatsappWorker.close();
  await discoveryWorker.close();
  logger.info("Workers closed.");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
