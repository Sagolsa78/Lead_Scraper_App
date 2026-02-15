const axios = require("axios");
const googleConfig = require("../config/google");

const findNearbyPlaces = async (lat, lng, radius, type, limit = 20) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${lat},${lng}`,
          radius: radius,
          keyword: type,
          key: googleConfig.placesApiKey,
        },
      },
    );

    if (
      response.data.status !== "OK" &&
      response.data.status !== "ZERO_RESULTS"
    ) {
      throw new Error(`Places API error: ${response.data.status}`);
    }

    // Return only the number of results requested by limit
    return response.data.results.slice(0, limit);
  } catch (error) {
    console.error("Error in findNearbyPlaces:", error.message);
    throw error;
  }
};

const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          fields:
            "name,formatted_address,formatted_phone_number,rating,website,url",
          key: googleConfig.placesApiKey,
        },
      },
    );

    if (response.data.status !== "OK") {
      throw new Error(`Place Details API error: ${response.data.status}`);
    }

    console.log("response.data.result", response.data.result);
    return response.data.result;
  } catch (error) {
    console.error(
      `Error fetching details for placeId ${placeId}:`,
      error.message,
    );
    return null; // Return null so we can skip this place without crashing
  }
};

module.exports = { findNearbyPlaces, getPlaceDetails };
