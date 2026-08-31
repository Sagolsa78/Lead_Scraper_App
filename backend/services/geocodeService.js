const axios = require("axios");
const axiosRetry = require("axios-retry").default || require("axios-retry");
const logger = require("../config/logger");
const googleConfig = require("../config/google");
const { connection: redis } = require("../config/bullQueue");

// Create dedicated axios client for Geocoding with retry logic
const client = axios.create({
  timeout: 10000,
});

axiosRetry(client, {
  retries: 4,
  retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s, 4s
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.code === "ECONNABORTED" ||
      error.code === "EAI_AGAIN" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET"
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn(
      `Geocoding request failed (${error.code || error.message}). Retrying attempt #${retryCount}...`
    );
  },
});

const getCoordinates = async (location) => {
  const cacheKey = `geocode:${location.toLowerCase().replace(/\s+/g, "_")}`;

  try {
    // Check Cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Geocode cache hit for ${location}`);
      return JSON.parse(cached);
    }

    const response = await client.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: location,
          key: googleConfig.geocodingApiKey,
        },
      },
    );

    if (response.data.status !== "OK") {
      const error = new Error(`Geocoding API error: ${response.data.status}`);
      error.status = response.data.status === "INVALID_REQUEST" ? 400 : 502;
      throw error;
    }

    const { lat, lng } = response.data.results[0].geometry.location;
    const result = { lat, lng };

    // Store in Cache (24 hours)
    await redis.set(cacheKey, JSON.stringify(result), "EX", 86400);

    logger.info(`Geocoded ${location} to ${lat}, ${lng} (Cached)`);
    return result;
  } catch (error) {
    logger.error(`Geocoding failed for ${location}: ${error.message}`);
    throw error;
  }
};

module.exports = { getCoordinates };
