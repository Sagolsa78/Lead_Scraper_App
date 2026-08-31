const rateLimit = require("express-rate-limit");
const logger = require("../config/logger");

/**
 * General API rate limiter — protects against abuse but is generous enough
 * to never interfere with normal frontend usage (polling, navigation, etc.).
 * 500 requests per 15 minutes per IP ≈ ~33 req/min, which is plenty for a
 * single-user dev/staging setup and still safe in production.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});

/**
 * Strict limiter for lead-generation / heavy Google API endpoints.
 * Only 5 requests per minute — each call triggers dozens of Google API
 * calls internally, so this must be kept tight to protect the API budget.
 */
const heavyEndpointLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many lead-generation requests. Please wait a moment before trying again.",
  },
  handler: (req, res, next, options) => {
    logger.warn(`Heavy endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});

module.exports = { apiLimiter, heavyEndpointLimiter };
