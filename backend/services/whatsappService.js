const axios = require("axios");
const { encrypt, decrypt } = require("../config/encryption");
const prisma = require("../config/prisma");
const logger = require("../config/logger");

const getSettings = async (organizationId) => {
  if (!organizationId) throw new Error("Organization ID is required");
  let settings = await prisma.settings.findFirst({ where: { organizationId } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { whatsappMode: "manual", organizationId },
    });
  }
  return settings;
};

const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

const sendDirectMessage = async (leadId, customMessage, organizationId) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId, organizationId } });
    if (!lead) throw new Error("Lead not found or unauthorized");

    const settings = await getSettings(organizationId);
    const message =
      customMessage ||
      `Hello ${lead.name},\n\nWe came across your business listing and were impressed with your work.\n\nWe are a startup digital firm that helps local businesses build professional websites to improve customer engagement and increase public reach. A website can help you showcase services, receive inquiries, and build stronger online credibility.\n\nIf you're interested, we would be happy to share a quick demo and discuss how we can help your business grow.\n\nLooking forward to your response.`;

    if (settings.whatsappMode === "manual") {
      const encodedMessage = encodeURIComponent(message);
      const formattedPhone = formatPhoneNumber(lead.phone);
      const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      return { mode: "manual", url };
    }

    // Cloud API Mode
    if (!settings.whatsappToken) {
      throw new Error("WhatsApp Cloud API token not configured");
    }

    const token = decrypt(settings.whatsappToken);
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: lead.phone,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    await prisma.messageLog.create({
      data: {
        leadId: lead.id,
        status: "sent",
        response: response.data,
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { whatsapp_sent: true },
    });

    return { mode: "cloud", success: true };
  } catch (error) {
    // Log internally but don't expose raw provider errors
    const internalDetail = error.response
      ? error.response.data
      : error.message;
    logger.error("WhatsApp Send Failed:", { detail: internalDetail });

    if (leadId) {
      await prisma.messageLog
        .create({
          data: {
            leadId: leadId,
            status: "failed",
            response: { error: "Send failed" },
          },
        })
        .catch((logErr) =>
          logger.error("Failed to log message failure:", logErr.message),
        );
    }

    throw new Error("Failed to send WhatsApp message");
  }
};

const updateSettings = async (token, mode, organizationId) => {
  if (!organizationId) throw new Error("Organization ID is required");
  const encryptedToken = token ? encrypt(token) : null;
  
  const existing = await prisma.settings.findFirst({ where: { organizationId } });
  
  if (existing) {
    return await prisma.settings.update({
      where: { id: existing.id },
      data: { whatsappToken: encryptedToken, whatsappMode: mode },
    });
  } else {
    return await prisma.settings.create({
      data: { whatsappToken: encryptedToken, whatsappMode: mode, organizationId },
    });
  }
};

module.exports = {
  sendDirectMessage,
  updateSettings,
  getSettings,
};
