const express = require("express");
const router = express.Router();
const { lookupPhoneNumber } = require("../services/phoneLookupService");
const { normalizeIndianNumber } = require("../utils/phoneUtils");
const logger = require("../config/logger");
const { authenticate } = require("../middleware/authMiddleware");

// All phone routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/phone/validate
 * @desc Validate a phone number using Twilio Lookup (with local caching)
 * @access Authenticated
 */
router.post("/validate", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number required" });
    }

    // 1. Normalize Indian Numbers (Before Lookup)
    const normalized = normalizeIndianNumber(phone);
    if (!normalized) {
      return res.status(400).json({ error: "Invalid format" });
    }

    // 2. Perform Lookup (Hit Cache or Twilio)
    const result = await lookupPhoneNumber(normalized);

    if (result.error) {
      return res.status(400).json({ error: "Lookup failed" });
    }

    if (!result.valid) {
      return res.json({
        status: "Rejected",
        reason: "Not a mobile number",
      });
    }

    // 3. Success
    res.json({
      status: "Valid Mobile",
      phone: result.phoneNumber,
      carrier: result.carrier,
    });
  } catch (error) {
    logger.error(`Phone validation error: ${error.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
