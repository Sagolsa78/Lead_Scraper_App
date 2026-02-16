const axios = require("axios");
const CryptoJS = require("crypto-js");
const prisma = require("../config/prisma");
const logger = require("../config/logger");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_secret_key";

const encryptToken = (token) => {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
};

const decryptToken = (encryptedToken) => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const getSettings = async () => {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 1, whatsappMode: "manual" },
    });
  }
  return settings;


};


const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Remove all non-numeric characters (spaces, +, -, etc.)
  let cleaned = phone.replace(/\D/g, "");

  // Remove leading 0
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
};


const sendDirectMessage = async (leadId, customMessage) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error("Lead not found");

    const settings = await getSettings();
    const message =
      customMessage ||
      `Hello ${lead.name}, 

We came across your business listing and were impressed with your work. 

We are a startup digital firm that helps local businesses build professional websites to improve customer engagement and increase public reach. A website can help you showcase services, receive inquiries, and build stronger online credibility.

If you're interested, we would be happy to share a quick demo and discuss how we can help your business grow.

Looking forward to your response.`;

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

    const token = decryptToken(settings.whatsappToken);
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
      },
    );

    // Log the message
    await prisma.messageLog.create({
      data: {
        leadId: lead.id,
        status: "sent",
        response: response.data,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: lead.id },
      data: { whatsapp_sent: true },
    });

    return { mode: "cloud", success: true, response: response.data };
  } catch (error) {
    const errorMessage = error.response ? error.response.data : error.message;
    logger.error("WhatsApp Send Failed:", errorMessage);

    if (leadId) {
      await prisma.messageLog.create({
        data: {
          leadId: leadId,
          status: "failed",
          response: errorMessage,
        },
      });
    }

    throw error;
  }
};

const updateSettings = async (token, mode) => {
  const encryptedToken = token ? encryptToken(token) : null;
  return await prisma.settings.upsert({
    where: { id: 1 },
    update: { whatsappToken: encryptedToken, whatsappMode: mode },
    create: { id: 1, whatsappToken: encryptedToken, whatsappMode: mode },
  });
};

module.exports = {
  sendDirectMessage,
  updateSettings,
  getSettings,
  encryptToken,
  decryptToken,
};
