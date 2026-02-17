const axios = require("axios");
const logger = require("../config/logger");
const googleConfig = require("../config/google");

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

    const response = await axios.get(
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
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          place_id: placeId,
          fields:
            "name,formatted_address,formatted_phone_number,rating,website,url,types",
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

module.exports = { findNearbyPlaces, getPlaceDetails };
