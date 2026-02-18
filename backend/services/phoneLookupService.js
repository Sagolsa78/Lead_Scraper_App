const twilio = require("twilio");
const prisma = require("../config/prisma");
const { normalizeIndianNumber } = require("../utils/phoneUtils");
const logger = require("../config/logger");

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client;
if (accountSid && authToken && accountSid !== "your_account_sid") {
  client = twilio(accountSid, authToken);
} else {
  logger.warn(
    "Twilio credentials missing or valid. Phone lookup will be disabled/mocked.",
  );
}

/**
 * Validates a phone number using cached data or Twilio Lookup API.
 * @param {string} phone - The phone number to validate (will be normalized).
 * @returns {Promise<Object>} - Validation result.
 */
async function lookupPhoneNumber(phone) {
  if (!phone) {
    return { valid: false, error: "Phone number required" };
  }

  const normalized = normalizeIndianNumber(phone);
  if (!normalized) {
    return {
      valid: false,
      error: "Invalid format or not an Indian mobile number",
    };
  }

  try {
    // 1. Check Cache (PhoneLookup table) - Smart Filtering / Cost Control
    const cached = await prisma.phoneLookup.findUnique({
      where: { phone: normalized },
    });

    if (cached) {
      logger.info(`Cache hit for ${normalized}`);
      return {
        valid: cached.valid,
        phoneNumber: cached.phone,
        lineType: cached.lineType,
        carrier: cached.carrier,
        countryCode: cached.countryCode,
        cached: true,
      };
    }

    // 2. Call Twilio API (if enabled)
    if (!client) {
      return { valid: false, error: "Twilio not configured" };
    }

    logger.info(`Fetching from Twilio for ${normalized}`);
    const response = await client.lookups.v2
      .phoneNumbers(normalized)
      .fetch({ fields: "line_type_intelligence" });

    const lineType = response.lineTypeIntelligence?.type || null;
    const carrier = response.lineTypeIntelligence?.carrier_name || null;
    const countryCode = response.countryCode || "IN";

    // Strict check: Only mobile is considered "Valid Mobile"
    const isMobile = lineType === "mobile";

    // 3. Cache the result - Safe cost usage
    await prisma.phoneLookup.create({
      data: {
        phone: normalized,
        valid: isMobile,
        lineType: lineType,
        carrier: carrier,
        countryCode: countryCode,
      },
    });

    console.log({
      valid: isMobile,
      phoneNumber: response.phoneNumber,
      lineType: lineType,
      carrier: carrier,
      cached: false,
    })
    return {
      valid: isMobile,
      phoneNumber: response.phoneNumber,
      lineType: lineType,
      carrier: carrier,
      cached: false,
    };
  } catch (error) {
    logger.error(`Twilio Lookup Error for ${normalized}: ${error.message}`);

    if (error.status === 404) {
      // Cache as invalid to avoid re-lookup
      await prisma.phoneLookup.create({
        data: {
          phone: normalized,
          valid: false,
          lineType: "unknown",
        },
      });
      return { valid: false, error: "Number not found" };
    }

    return {
      valid: false,
      error: error.message,
    };
  }
}

module.exports = { lookupPhoneNumber };
