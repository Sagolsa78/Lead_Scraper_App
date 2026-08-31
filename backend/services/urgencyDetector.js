// const logger = require("../config/logger");

/**
 * Urgency Signal Score (0-20)
 * Scans reviews for keywords indicating pain/urgency.
 *
 * Keywords:
 * - "no website"
 * - "hard to contact"
 * - "no booking"
 * - "no online"
 * - "slow response"
 *
 * @param {Array} reviews - List of review objects (text content)
 * @returns {number} urgencyScore (0, 10, or 20)
 */
const calculateUrgencyScore = (reviews = []) => {
  if (!reviews || reviews.length === 0) return 0;

  const urgencyKeywords = [
    "no website",
    "hard to contact",
    "no booking",
    "no online",
    "slow response",
    "availability",
    "difficult to reach",
    "nobody answers",
  ];

  let foundUrgency = false;
  let hitCount = 0;

  for (const review of reviews) {
    if (!review.text) continue;
    const textLower = review.text.toLowerCase();

    for (const keyword of urgencyKeywords) {
      if (textLower.includes(keyword)) {
        foundUrgency = true;
        hitCount++;
        // logger.debug(`Urgency signal found: "${keyword}" in review.`);
      }
    }
  }

  if (hitCount >= 2) return 20; // Strong urgency signal
  if (hitCount === 1) return 10; // Moderate signal

  return 0;
};

module.exports = {
  calculateUrgencyScore,
};
