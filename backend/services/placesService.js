const axios = require("axios");
const axiosRetry = require("axios-retry").default || require("axios-retry");
const logger = require("../config/logger");
const googleConfig = require("../config/google");

// Dedicated axios client with retry logic for Places API
const client = axios.create({
  timeout: 10000,
});

axiosRetry(client, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
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
  onRetry: (retryCount, error) => {
    logger.warn(
      `Places API request failed (${error.code || error.message}). Retrying attempt #${retryCount}...`
    );
  },
});

/**
 * Types that should never make it past pre-filtering.
 * Checking these BEFORE calling getPlaceDetails saves one API call each.
 */
const PRE_FILTER_EXCLUDED_TYPES = [
  "bank", "atm", "park", "train_station", "stadium", "museum", "zoo",
  "aquarium", "church", "hindu_temple", "mosque", "synagogue",
  "government_office", "fire_station", "police", "post_office",
  "university", "school",
];

/**
 * Quick pre-filter using data already available from the Nearby Search response.
 * Returns false if we should skip calling getPlaceDetails for this place.
 */
const preFilterPlace = (place) => {
  // Skip permanently closed businesses
  if (place.business_status === "CLOSED_PERMANENTLY") {
    logger.debug(`Pre-filtered (permanently closed): ${place.name}`);
    return false;
  }

  // Skip excluded types (saves a Details API call)
  if (place.types && place.types.some(t => PRE_FILTER_EXCLUDED_TYPES.includes(t))) {
    logger.debug(`Pre-filtered (excluded type): ${place.name} [${place.types.join(", ")}]`);
    return false;
  }

  return true;
};

const findNearbyPlaces = async (
  lat,
  lng,
  radius,
  type,
  limit = 20,
  pageToken = null,
) => {
  try {
    const params = {
      key: googleConfig.placesApiKey,
    };

    if (pageToken) {
      params.pagetoken = pageToken;
    } else {
      params.location = `${lat},${lng}`;
      params.radius = radius;
      if (type) params.keyword = type;
    }

    const response = await client.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params,
        timeout: 10000,
      },
    );

    if (
      response.data.status !== "OK" &&
      response.data.status !== "ZERO_RESULTS"
    ) {
      if (response.data.status === "OVER_QUERY_LIMIT") {
        logger.error("Google Places API quota exceeded");
        const error = new Error("API quota exceeded");
        error.status = 429;
        throw error;
      }
      if (response.data.status === "INVALID_REQUEST" && pageToken) {
        // Sometimes tokens are not yet valid (Google's weird delay)
        logger.warn(
          "Received INVALID_REQUEST for pageToken, possibly too fast",
        );
        return { results: [], next_page_token: pageToken };
      }
      throw new Error(`Places API error: ${response.data.status}`);
    }

    const results = response.data.results;
    const nextPageToken = response.data.next_page_token;

    logger.info(
      `Found ${results.length} nearby places. Has next page: ${!!nextPageToken}`,
    );
    return { results, nextPageToken };
  } catch (error) {
    logger.error(`findNearbyPlaces failed: ${error.message}`);
    throw error;
  }
};

const getPlaceDetails = async (placeId) => {
  try {
    // Field cost tiers (Google Places API pricing):
    //   Basic ($5/1000): name, formatted_address, business_status, types, url
    //   Contact ($10/1000): formatted_phone_number, website
    //   Atmosphere ($15/1000): rating, user_ratings_total
    // We need all three tiers but only request fields we actually use.
    const response = await client.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          place_id: placeId,
          fields:
            "name,formatted_address,formatted_phone_number,rating,user_ratings_total,business_status,website,url,types",
          key: googleConfig.placesApiKey,
        },
        timeout: 5000,
      },
    );

    if (response.data.status !== "OK") {
      throw new Error(`Place Details API error: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    logger.warn(
      `Failed to fetch details for placeId ${placeId}: ${error.message}`,
    );
    return null;
  }
};

module.exports = { findNearbyPlaces, getPlaceDetails, preFilterPlace };
