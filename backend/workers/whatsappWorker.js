const { Worker } = require("bullmq");
const { connection } = require("../config/bullQueue");
const whatsappService = require("../services/whatsappService");
const logger = require("../config/logger");

const worker = new Worker(
  "whatsapp-queue",
  async (job) => {
    const { leadIds, customMessage } = job.data;

    logger.info(
      `Processing bulk-send job ${job.id} for ${leadIds.length} leads`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const leadId of leadIds) {
      try {
        await whatsappService.sendDirectMessage(leadId, customMessage);
        successCount++;
      } catch (error) {
        logger.error(
          `Failed to send message to lead ${leadId} in bulk job ${job.id}:`,
          error.message,
        );
        failCount++;
      }
    }

    logger.info(
      `Bulk-send job ${job.id} completed. Success: ${successCount}, Fail: ${failCount}`,
    );
  },
  {
    connection,
    concurrency: 5, // Process up to 5 messages in parallel
  },
);

worker.on("failed", (job, err) => {
  logger.error(`Job ${job.id} failed with error:`, err.message);
});

module.exports = worker;
