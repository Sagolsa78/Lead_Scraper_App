const logger = require("../config/logger");

const validateLeadData = (details) => {
  // Requirement: Website is NOT present, Phone number exists
  const hasPhone = !!details.formatted_phone_number;
  const hasNoWebsite = !details.website;

  if (hasPhone && hasNoWebsite) {
    return true;
  }

  return false;
};

module.exports = { validateLeadData };
