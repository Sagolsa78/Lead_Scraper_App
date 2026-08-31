/**
 * Category Strength Score (0-20)
 * Assigns weight based on industry/category value.
 *
 * @param {string} category - Business subCategory or type
 * @returns {number} categoryScore
 */
const calculateCategoryScore = (category = "") => {
  if (!category) return 15; // Default average score

  const normalizedCat = category.toLowerCase();

  // High Value (20)
  if (
    normalizedCat.includes("dental") ||
    normalizedCat.includes("dentist") ||
    normalizedCat.includes("clinic") ||
    normalizedCat.includes("medical") || // skin clinic etc
    normalizedCat.includes("real estate") ||
    normalizedCat.includes("realtor") ||
    normalizedCat.includes("lawyer") ||
    normalizedCat.includes("legal")
  ) {
    return 20;
  }

  // High-Mid Value (18)
  if (
    normalizedCat.includes("coaching") ||
    normalizedCat.includes("consultant") ||
    normalizedCat.includes("travel") ||
    normalizedCat.includes("agency") ||
    normalizedCat.includes("architect") ||
    normalizedCat.includes("interior")
  ) {
    return 18;
  }

  // Mid Value (15)
  if (
    normalizedCat.includes("gym") ||
    normalizedCat.includes("fitness") ||
    normalizedCat.includes("restaurant") ||
    normalizedCat.includes("cafe") ||
    normalizedCat.includes("hotel") ||
    normalizedCat.includes("salon") ||
    normalizedCat.includes("spa")
  ) {
    return 15;
  }

  // Default for others
  return 15;
};

module.exports = {
  calculateCategoryScore,
};
