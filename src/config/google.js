require("dotenv").config();

const googleConfig = {
  placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  geocodingApiKey: process.env.GOOGLE_GEOCODING_API_KEY,
};

module.exports = googleConfig;
