const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const logger = require("./logger");

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

connection.on("error", (err) => {
  logger.error("Redis Connection Error:", err);
});

const whatsappQueue = new Queue("whatsapp-queue", { connection });

module.exports = { whatsappQueue, connection };
