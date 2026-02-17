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

const validateLeadData = (details) => {
  const { name, types, website, formatted_phone_number } = details;

  // 1. Basic Requirement: Has Phone, No Website
  const hasPhone = !!formatted_phone_number;
  const hasNoWebsite = !website;

  if (!hasPhone || !hasNoWebsite) {
    return false;
  }

  // 2. Filter out Excluded Types (Banks, ATMs, etc.)
  if (types && types.some((type) => EXCLUDED_TYPES.includes(type))) {
    logger.debug(`Lead rejected (Excluded type): ${name}`);
    return false;
  }

  // 3. Keyword filtering for Name (e.g., "ATM" in Name)
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
