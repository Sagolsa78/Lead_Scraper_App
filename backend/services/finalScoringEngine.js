const logger = require("../config/logger");
const reviewScorer = require("./reviewScorer");
const urgencyDetector = require("./urgencyDetector");
const categoryScorer = require("./categoryScorer");

/**
 * Orchestrate the final scoring for a lead.
 *
 * Weights:
 * - Review Strength: 40%
 * - Social Strength: 30%
 * - Urgency Signal: 15%
 * - Category Value: 15%
 *
 * @param {object} lead - The lead object
 * @param {Array} reviews - Analyzed review objects
 * @returns {object} - Updated lead object with scores
 */
const calculateLeadPriority = async (lead, reviews = []) => {
  try {
    logger.debug(`Starting final scoring for: ${lead.name}`);

    // 1. Calculate Component Scores (Normalized to 0-100)
    
    // Review Score (0-100)
    const reviewScore = reviewScorer.calculateReviewScore(lead, reviews);

    // Social Score (0-100)
    const socialScore = lead.socialScore || 0;

    // Category Score (Raw 0-20, Normalized to 0-100)
    const rawCategoryScore = categoryScorer.calculateCategoryScore(
      lead.subCategory || lead.businessType,
    );
    const categoryScore = Math.min(rawCategoryScore * 5, 100);

    // Urgency Score (Raw 0-20, Normalized to 0-100)
    const rawUrgencyScore = urgencyDetector.calculateUrgencyScore(reviews);
    const urgencyScore = Math.min(rawUrgencyScore * 5, 100);

    // 2. Apply Formula
    // finalScore = (reviewScore * 0.4) + (socialScore * 0.3) + (categoryScore * 0.15) + (urgencyScore * 0.15)
    
    const finalVal =
      (reviewScore * 0.40) +
      (socialScore * 0.30) +
      (categoryScore * 0.15) +
      (urgencyScore * 0.15);

    // 3. Assign Priority
    let priority = "LOW";
    if (finalVal >= 75) priority = "HIGH";
    else if (finalVal >= 60) priority = "MEDIUM";

    return {
      reviewScore,
      socialScore,
      categoryScore,
      urgencyScore,
      finalScore: parseFloat(finalVal.toFixed(1)),
      priority,
    };
  } catch (error) {
    logger.error(`Error in final scoring for ${lead.name}: ${error.message}`);
    return {
      finalScore: 0,
      priority: "LOW",
    };
  }
};

module.exports = {
  calculateLeadPriority,
};
