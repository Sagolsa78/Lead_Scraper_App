const axios = require("axios");
const logger = require("../config/logger");
require("dotenv").config();

/**
 * Categorize a business lead using AI based on Google Maps Place Types.
 * @param {string} placeName
 * @param {string[]} types
 * @param {string} keyword
 * @returns {Promise<{mainCategory: string, subCategory: string}>}
 */
const categorizeLead = async (placeName, types, keyword) => {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn(
      "GEMINI_API_KEY not found in environment, skipping AI categorization",
    );
    return null;
  }
  apiKey = apiKey.trim();

  try {
    const prompt = `
      You are a lead categorization expert. Categorize the following business lead based on its name, Google Maps types, and search keyword.
      You MUST use the provided Categories for Main Category.
      
      Business Name: "${placeName}"
      Google Types: [${types.join(", ")}]
      Search Keyword: "${keyword}"
      
      Response Format (JSON ONLY):
      {
        "mainCategory": "The broad group",
        "subCategory": "The specific business type"
      }
      
      Main Categories to choose from:
      Automotive, Business, Culture, Education, Entertainment and Recreation, Facilities, Finance, Food and Drink, Geographical Areas, Government, Health and Wellness, Housing, Lodging, Natural Features, Places of Worship, Services, Shopping, Sports, Transportation.
      
      Subcategories should be the most descriptive specific type (e.g., 'Restaurant', 'Gym', 'Hotel').
    `;

    // Use gemini-2.5-flash which was found to be available and not rate-limited
    const modelId = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const response = await axios.post(url, payload, { timeout: 15000 });

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0].content
    ) {
      const text = response.data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text);
      logger.info(
        `AI Categorized "${placeName}" as: ${parsed.mainCategory} > ${parsed.subCategory}`,
      );
      return {
        mainCategory: parsed.mainCategory || "Other",
        subCategory: parsed.subCategory || "General",
      };
    }

    throw new Error("Invalid AI response structure");
  } catch (error) {
    const errorMsg = error.response
      ? JSON.stringify(error.response.data)
      : error.message;
    logger.error(`AI (REST) failed for "${placeName}": ${errorMsg}`);

    // Final fallback to 1.5-flash just in case
    if (error.response && error.response.status === 404) {
      try {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const fResponse = await axios.post(fallbackUrl, {
          contents: [
            {
              parts: [{ text: "Categorize: " + placeName + ". Return JSON." }],
            },
          ],
        });
        if (fResponse.data && fResponse.data.candidates)
          return JSON.parse(fResponse.data.candidates[0].content.parts[0].text);
      } catch (e) {}
    }
    return null;
  }
};

module.exports = { categorizeLead };
