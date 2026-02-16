const prisma = require("../config/prisma");
const logger = require("../config/logger");

const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/[^0-9]/g, ""); // Keep only digits
};

const isDuplicate = async (phone) => {
  try {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return false;

    const existingLead = await prisma.lead.findUnique({
      where: { phone: normalizedPhone },
    });

    return !!existingLead;
  } catch (error) {
    logger.error(`Duplicate check failed for ${phone}: ${error.message}`);
    return false; // Error safe fallback
  }
};

module.exports = { normalizePhone, isDuplicate };
