const axios = require("axios");
const googleConfig = require("../config/google");

const getCoordinates = async (location) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: location,
          key: googleConfig.geocodingApiKey,
        },
      },
    );

    if (response.data.status !== "OK") {
      throw new Error(`Geocoding API error: ${response.data.status}`);
    }

    const { lat, lng } = response.data.results[0].geometry.location;
    return { lat, lng };
  } catch (error) {
    console.error("Error in geocodeService:", error.message);
    throw error;
  }
};

module.exports = { getCoordinates };
