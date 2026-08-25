const logger = require("../config/logger");
const EXCLUDED_TYPES = [
  "bank",
  "atm",
  "park",
  "train_station",
  "stadium",
  "museum",
  "zoo",
  "aquarium",
  "church",
  "hindu_temple",
  "mosque",
  "synagogue",
  "government_office",
  "fire_station",
  "police",
  "post_office",
  "university",
  "school",
];

const HIGH_VALUE_CATEGORIES = [
  "dentist",
  "beauty_salon",
  "spa",
  "doctor",
  "school",
  "gym",
  "restaurant",
  "travel_agency",
  "real_estate_agency",
  "home_goods_store",
  "general_contractor",
  "interior_designer",
];

const validateLeadData = (details) => {
  const {
    name,
    types,
    website,
    formatted_phone_number,
    user_ratings_total,
    rating,
    business_status,
  } = details;

  // 1. Basic Requirement: Has Phone
  if (!formatted_phone_number) {
    logger.debug(`Lead rejected (No phone): ${name}`);
    return false;
  }

  // 2. Closed Status
  if (business_status === "CLOSED_PERMANENTLY") {
    logger.debug(`Lead rejected (Permanently closed): ${name}`);
    return false;
  }

  // 3. Website Requirement (Must NOThave website for Category 1)
  if (website) {
    logger.debug(`Lead rejected (Has website): ${name}`);
    return false;
  }

  // 4. Review Threshold
  if (!user_ratings_total || user_ratings_total < 25) {
    logger.debug(
      `Lead rejected (Low reviews: ${user_ratings_total || 0}): ${name}`,
    );
    return false;
  }

  // 5. Rating Threshold
  if (!rating || rating < 3.8) {
    logger.debug(`Lead rejected (Low rating: ${rating || 0}): ${name}`);
    return false;
  }

  // 6. Category Whitelist
  if (types && types.length > 0) {
    const isHighValue = types.some((type) =>
      HIGH_VALUE_CATEGORIES.includes(type),
    );
    if (!isHighValue) {
      // Double check against EXCLUDED_TYPES to be safe, but whitelist is stricter
      logger.debug(
        `Lead rejected (Not high value category): ${name} [${types.join(", ")}]`,
      );
      return false;
    }
  } else {
    logger.debug(`Lead rejected (No types found): ${name}`);
    return false;
  }

  // 7. Filter out Excluded Types (Banks, ATMs, etc.) - Redundant if using Whitelist but good for safety
  if (types && types.some((type) => EXCLUDED_TYPES.includes(type))) {
    logger.debug(`Lead rejected (Excluded type): ${name}`);
    return false;
  }

  // 8. Keyword filtering for Name (e.g., "ATM" in Name)
  const lowerName = name.toLowerCase();
  if (
    lowerName.includes(" atm") ||
    lowerName.startsWith("atm ") ||
    lowerName === "atm"
  ) {
    logger.debug(`Lead rejected (ATM keyword in name): ${name}`);
    return false;
  }

  return true;
};

module.exports = { validateLeadData };
