const whatsappService = require("../services/whatsappService");
const responseFormatter = require("../utils/responseFormatter");
const { whatsappQueue } = require("../config/bullQueue");
const logger = require("../config/logger");

const sendMessage = async (req, res, next) => {
  try {
    const { leadId, customMessage } = req.body;
    const organizationId = req.user?.organizationId;
    const result = await whatsappService.sendDirectMessage(
      leadId,
      customMessage,
      organizationId
    );

    res
      .status(200)
      .json(
        responseFormatter(
          result,
          "WhatsApp message sent/generated successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

const sendBulkMessages = async (req, res, next) => {
  try {
    const { leadIds, customMessage } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res
        .status(400)
        .json(
          responseFormatter(null, "leadIds must be a non-empty array", false),
        );
    }

    const job = await whatsappQueue.add(
      "bulk-send",
      {
        leadIds,
        customMessage,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    );

    res
      .status(202)
      .json(responseFormatter({ jobId: job.id }, "Bulk sending job queued"));
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const settings = await whatsappService.getSettings(organizationId);
    // Don't leak the actual token, just indicate if it's set
    const sanitizedSettings = {
      ...settings,
      whatsappToken: settings.whatsappToken ? "********" : null,
    };
    res
      .status(200)
      .json(responseFormatter(sanitizedSettings, "Settings fetched"));
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { token, mode } = req.body;
    const organizationId = req.user?.organizationId;
    await whatsappService.updateSettings(token, mode, organizationId);
    res
      .status(200)
      .json(responseFormatter(null, "Settings updated successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  sendBulkMessages,
  getSettings,
  updateSettings,
};
