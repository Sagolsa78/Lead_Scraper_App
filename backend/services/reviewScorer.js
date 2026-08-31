// const logger = require("../config/logger");

/**
 * Calculate Review Strength Score (0-100)
 * Components:
 * 1. Count Score (Max 40)
 * 2. Rating Score (Max 30)
 * 3. Recency Bonus (Max 30)
 *
 * @param {object} lead - The lead object containing reviewCount and rating
 * @param {Array} reviews - List of review objects (optional, for recency)
 * @returns {number} reviewScore
 */
const calculateReviewScore = (lead, reviews = []) => {
  let score = 0;

  // 1. Review Count Score (Max 40)
  const count = lead.reviewCount || 0;
  if (count >= 250) score += 40;
  else if (count >= 100) score += 35;
  else if (count >= 50) score += 25;
  else if (count >= 25) score += 15;
  else score += 0;

  // 2. Rating Score (Max 30)
  // ratingScore = rating * 6
  // Example: 4.5 * 6 = 27
  const rating = lead.rating || 0;
  const ratingScore = Math.min(rating * 6, 30); // Cap at 30 just in case
  score += ratingScore;

  // 3. Recency Bonus (Max 30)
  // Need to find the most recent review date
  let recencyBonus = 0;
  if (reviews && reviews.length > 0) {
    // Assuming reviews have a 'publishTime' or 'relativePublishTimeDescription'
    // For now, we might need to rely on what we have.
    // If we rely on 'reviews' array passed in (which might come from manual enrichment or detailed scrape)

    // safe parsing of dates
    const now = new Date();

    // Find most recent review
    let mostRecentDate = null;

    reviews.forEach((r) => {
      let rDate = null;
      if (r.publishTime) {
        rDate = new Date(r.publishTime);
      }
      // If we only have relative time text (e.g., "2 weeks ago"), parsing is harder without a helper.
      // Assuming we have some date object or ISO string in 'publishTime' from our scraper/API.

      if (rDate && !isNaN(rDate.getTime())) {
        if (!mostRecentDate || rDate > mostRecentDate) {
          mostRecentDate = rDate;
        }
      }
    });

    if (mostRecentDate) {
      const diffTime = Math.abs(now - mostRecentDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) recencyBonus = 30;
      else if (diffDays <= 60) recencyBonus = 20;
      else if (diffDays <= 90) recencyBonus = 10;
    }
  }

  // If no reviews provided to verify recency, we might default to 0 or check if lead has a 'lastReviewDate' field
  // For this v1, 0 is safe if no data.

  score += recencyBonus;

  return Math.min(Math.round(score), 100);
};

module.exports = {
  calculateReviewScore,
};
