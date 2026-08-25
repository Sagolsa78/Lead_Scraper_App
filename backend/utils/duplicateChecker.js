const prisma = require("../config/prisma");
const logger = require("../config/logger");

const { normalizeIndianNumber } = require("./phoneUtils");

const normalizePhone = (phone) => {
  if (!phone) return null;
  const normalized = normalizeIndianNumber(phone);
  if (normalized) return normalized;
  // Fallback for non-Indian numbers: just keep digits and + 
  return phone.replace(/[^0-9+]/g, ""); 
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
