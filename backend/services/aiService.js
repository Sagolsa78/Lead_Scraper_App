const axios = require("axios");
const logger = require("../config/logger");
const Bottleneck = require("bottleneck");
require("dotenv").config();

/**
 * STATIC GOOGLE TYPE → CATEGORY MAP
 * This handles 90% of cases without AI
 */
const TYPE_CATEGORY_MAP = {
  // FOOD & BEVERAGE
  restaurant: { main: "Food & Beverage", sub: "Restaurant" },
  cafe: { main: "Food & Beverage", sub: "Cafe" },
  bar: { main: "Food & Beverage", sub: "Bar" },
  bakery: { main: "Food & Beverage", sub: "Bakery" },
  meal_delivery: { main: "Food & Beverage", sub: "Meal Delivery" },
  meal_takeaway: { main: "Food & Beverage", sub: "Takeaway" },

  // HEALTH & WELLNESS
  hospital: { main: "Health & Wellness", sub: "Hospital" },
  doctor: { main: "Health & Wellness", sub: "Clinic" },
  dentist: { main: "Health & Wellness", sub: "Dentist" },
  pharmacy: { main: "Health & Wellness", sub: "Pharmacy" },
  physiotherapist: { main: "Health & Wellness", sub: "Physiotherapy" },
  gym: { main: "Health & Wellness", sub: "Gym" },
  spa: { main: "Health & Wellness", sub: "Spa" },
  yoga_studio: { main: "Health & Wellness", sub: "Yoga Studio" },

  // BEAUTY & PERSONAL CARE
  beauty_salon: { main: "Beauty & Personal Care", sub: "Salon" },
  hair_care: { main: "Beauty & Personal Care", sub: "Hair Care" },

  // EDUCATION
  school: { main: "Education", sub: "School" },
  university: { main: "Education", sub: "University" },
  primary_school: { main: "Education", sub: "Primary School" },
  secondary_school: { main: "Education", sub: "Secondary School" },

  // RETAIL & SHOPPING
  shopping_mall: { main: "Retail & Shopping", sub: "Mall" },
  clothing_store: { main: "Retail & Shopping", sub: "Clothing" },
  electronics_store: { main: "Retail & Shopping", sub: "Electronics" },
  supermarket: { main: "Retail & Shopping", sub: "Supermarket" },
  grocery_or_supermarket: { main: "Retail & Shopping", sub: "Grocery" },
  convenience_store: { main: "Retail & Shopping", sub: "Convenience Store" },
  furniture_store: { main: "Retail & Shopping", sub: "Furniture" },
  hardware_store: { main: "Retail & Shopping", sub: "Hardware" },
  home_goods_store: { main: "Retail & Shopping", sub: "Home Goods" },
  jewelry_store: { main: "Retail & Shopping", sub: "Jewelry" },
  pet_store: { main: "Retail & Shopping", sub: "Pet Store" },
  book_store: { main: "Retail & Shopping", sub: "Book Store" },
  shoe_store: { main: "Retail & Shopping", sub: "Shoe Store" },

  // PROFESSIONAL SERVICES
  lawyer: { main: "Professional Services", sub: "Legal" },
  accounting: { main: "Professional Services", sub: "Accounting" },
  consultant: { main: "Professional Services", sub: "Consulting" },
  insurance_agency: { main: "Professional Services", sub: "Insurance" },
  real_estate_agency: { main: "Professional Services", sub: "Real Estate" },
  travel_agency: { main: "Professional Services", sub: "Travel Agency" },
  marketing_agency: { main: "Professional Services", sub: "Marketing" },

  // HOME SERVICES
  plumber: { main: "Home Services", sub: "Plumbing" },
  electrician: { main: "Home Services", sub: "Electrical" },
  roofing_contractor: { main: "Home Services", sub: "Roofing" },
  moving_company: { main: "Home Services", sub: "Moving" },
  locksmith: { main: "Home Services", sub: "Locksmith" },
  painter: { main: "Home Services", sub: "Painting" },
  general_contractor: { main: "Home Services", sub: "Construction" },

  // AUTOMOTIVE
  car_dealer: { main: "Automotive", sub: "Car Dealer" },
  car_repair: { main: "Automotive", sub: "Car Repair" },
  car_rental: { main: "Automotive", sub: "Car Rental" },
  gas_station: { main: "Automotive", sub: "Gas Station" },

  // LODGING
  lodging: { main: "Lodging", sub: "Hotel" },
  hotel: { main: "Lodging", sub: "Hotel" },

  // IT & TECH
  computer_store: { main: "IT & Tech", sub: "Computer Store" },
  electronics_repair: { main: "IT & Tech", sub: "Electronics Repair" },
};

// Rate limiter for AI calls: 10 requests per minute (1 every 6 seconds)
const limiter = new Bottleneck({
  minTime: 6000,
});

/**
 * STEP 1: Try Static Categorization
 */
function categorizeByTypes(types = []) {
  for (let type of types) {
    if (TYPE_CATEGORY_MAP[type]) {
      return {
        mainCategory: TYPE_CATEGORY_MAP[type].main,
        subCategory: TYPE_CATEGORY_MAP[type].sub,
        source: "static",
      };
    }
  }

  return null;
}

/**
 * STEP 2: AI Categorization (only called if static fails)
 */
async function categorizeWithAI(placeName, types, keyword) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY is missing. Returning fallback category.");
    return {
      mainCategory: "Other",
      subCategory: "General",
      source: "fallback",
    };
  }

  try {
    const prompt = `
Categorize this business.

Name: ${placeName}
Types: ${types.join(", ")}
Keyword: ${keyword}

Return JSON:
{
  "mainCategory": "...",
  "subCategory": "..."
}
`;

    // Reverting to gemini-2.5-flash as other models returned 404.
    // Relying on Bottleneck rate limiter (10 RPM) to avoid 429s.
    const modelId = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const response = await axios.post(url, payload, { timeout: 15000 });
    const text = response.data.candidates[0].content.parts[0].text;

    const parsed = JSON.parse(text);

    return {
      mainCategory: parsed.mainCategory || "Other",
      subCategory: parsed.subCategory || "General",
      source: "ai",
    };
  } catch (error) {
    const status = error.response ? error.response.status : "Unknown";
    const errorData = error.response ? JSON.stringify(error.response.data) : "";
    logger.error(
      `AI categorization failed for "${placeName}". Status: ${status}, Message: ${error.message}, Data: ${errorData}`,
    );
    return {
      mainCategory: "Other",
      subCategory: "General",
      source: "fallback",
    };
  }
}

/**
 * STEP 3: Main Wrapper Function
 */
async function categorizeLead(placeName, types = [], keyword = "") {
  // 1️⃣ Try static mapping first
  const staticResult = categorizeByTypes(types);

  if (staticResult) {
    logger.info(
      `Static categorized "${placeName}" as ${staticResult.mainCategory}`,
    );
    return staticResult;
  }

  // 2️⃣ Only use AI if no match (Rate Limited)
  return limiter.schedule(() => categorizeWithAI(placeName, types, keyword));
}

module.exports = { categorizeLead };
