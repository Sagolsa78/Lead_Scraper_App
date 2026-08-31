const prisma = require("../config/prisma");
const logger = require("../config/logger");

/**
 * Stores raw data from any source into the RawData table.
 * This is the first step in the data pipeline: immutable raw storage.
 *
 * @param {string} source - Origin of data (e.g., "google_places", "website_scrape")
 * @param {string} dataType - Type of content (e.g., "business_list", "details")
 * @param {object} data - The full JSON payload
 * @returns {Promise<object>} The created RawData record
 */
const storeRawData = async (source, dataType, data) => {
  try {
    const rawRecord = await prisma.rawData.create({
      data: {
        source,
        dataType,
        data,
      },
    });
    logger.info(
      `Stored raw data from ${source} (${dataType}) with ID: ${rawRecord.id}`,
    );
    return rawRecord;
  } catch (error) {
    logger.error(`Failed to store raw data: ${error.message}`, {
      source,
      dataType,
    });
    throw error;
  }
};

module.exports = { storeRawData };
