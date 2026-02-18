/**
 * Deterministic Scoring Engine
 * Calculates the Digital Health Score based on weighted factors.
 *
 * Formula:
 * Digital Health Score =
 *   (Rating * 0.20) +
 *   (Review Volume * 0.15) +
 *   (Website Quality * 0.20) +
 *   (Social Activity * 0.15) +
 *   (WhatsApp Availability * 0.10) +
 *   (Profile Completeness * 0.20)
 */

const logger = require("../config/logger");

const WEIGHTS = {
  RATING: 0.2,
  REVIEW_VOLUME: 0.15,
  WEBSITE: 0.2,
  SOCIAL: 0.15,
  WHATSAPP: 0.1,
  COMPLETENESS: 0.2,
};

/**
 * Normalizes a rating (0-5) to a score (0-100)
 */
const normalizeRating = (rating) => {
  return (rating / 5) * 100;
};

/**
 * Normalizes review count to a score (0-100)
 * Logarithmic scale to avoid skewing by massive review counts.
 * Target is ~1000 reviews = 100 score.
 */
const normalizeReviewVolume = (count) => {
  if (!count) return 0;
  // Math.log10(1000) = 3. Using base 10 log.
  // Score = (log10(count) / 3) * 100
  // Cap at 100.
  const score = (Math.log10(count + 1) / 3) * 100;
  return Math.min(score, 100);
};

/**
 * Calculates website quality score (placeholder logic)
 */
const calculateWebsiteScore = (business) => {
  if (!business.website) return 0;
  // TODO: Add real analysis (SSL, Mobile friendliness, Speed)
  return 50; // Base score for having a website
};

/**
 * Calculates social presence score (placeholder logic)
 */
const calculateSocialScore = (business) => {
  // TODO: Check if social profiles exist in raw data
  return 0;
};

/**
 * Calculates profile completeness score
 */
const calculateCompleteness = (business) => {
  let fields = 0;
  let filled = 0;

  const check = (val) => {
    fields++;
    if (val) filled++;
  };

  check(business.name);
  check(business.address);
  check(business.phone);
  check(business.website);
  check(business.rating);
  check(business.primaryCategory);
  // Add more fields as needed

  return (filled / fields) * 100;
};

/**
 * Main function to compute Digital Health Score
 */
const calculateScore = (business) => {
  try {
    const ratingScore = normalizeRating(business.rating || 0);
    const reviewScore = normalizeReviewVolume(business.reviewCount || 0);
    const websiteScore = calculateWebsiteScore(business);
    const socialScore = calculateSocialScore(business); // Needs external data
    const whatsappScore = business.phone ? 50 : 0; // Placeholder for lookup result
    const completenessScore = calculateCompleteness(business);

    const totalScore =
      ratingScore * WEIGHTS.RATING +
      reviewScore * WEIGHTS.REVIEW_VOLUME +
      websiteScore * WEIGHTS.WEBSITE +
      socialScore * WEIGHTS.SOCIAL +
      whatsappScore * WEIGHTS.WHATSAPP +
      completenessScore * WEIGHTS.COMPLETENESS;

    return {
      totalScore: Math.round(totalScore),
      breakdown: {
        rating: Math.round(ratingScore),
        reviewVolume: Math.round(reviewScore),
        website: Math.round(websiteScore),
        social: Math.round(socialScore),
        whatsapp: Math.round(whatsappScore),
        completeness: Math.round(completenessScore),
      },
    };
  } catch (error) {
    logger.error(
      `Error calculating score for business ${business.id}: ${error.message}`,
    );
    return { totalScore: 0, error: error.message };
  }
};

module.exports = { calculateScore };
