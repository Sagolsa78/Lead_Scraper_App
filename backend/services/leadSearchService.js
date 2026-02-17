const geocodeService = require("./geocodeService");
const placesService = require("./placesService");
const logger = require("../config/logger");

/**
 * Extract businessType and subCategory from Google Places types array
 * @param {string[]} types
 * @returns {object}
 */
const CATEGORY_MAPPING = [
  {
    group: "Fitness & Recreation",
    googleTypes: [
      "gym",
      "yoga_studio",
      "sports_complex",
      "stadium",
      "amusement_park",
      "spa",
    ],
  },
  {
    group: "Education & Training",
    googleTypes: [
      "school",
      "university",
      "library",
      "primary_school",
      "secondary_school",
      "tutoring",
      "test_preparation_center",
    ],
  },
  {
    group: "Restaurants & Food",
    googleTypes: [
      "restaurant",
      "cafe",
      "bar",
      "bakery",
      "meal_takeaway",
      "meal_delivery",
      "food",
      "night_club",
    ],
  },
  {
    group: "Retail Stores",
    googleTypes: [
      "clothing_store",
      "electronics_store",
      "grocery_or_supermarket",
      "furniture_store",
      "department_store",
      "shoe_store",
      "shopping_mall",
      "store",
    ],
  },
  {
    group: "Health & Medical",
    googleTypes: [
      "doctor",
      "dentist",
      "hospital",
      "pharmacy",
      "health",
      "physiotherapist",
      "veterinary_care",
      "beauty_salon",
      "hair_care",
    ],
  },
  {
    group: "Professional Services",
    googleTypes: [
      "lawyer",
      "accountant",
      "real_estate_agency",
      "insurance_agency",
      "bank",
      "finance",
    ],
  },
  {
    group: "Hospitality & Travel",
    googleTypes: ["lodging", "hotel", "travel_agency", "car_rental", "airport"],
  },
  {
    group: "Automotive",
    googleTypes: ["car_repair", "car_dealer", "gas_station", "car_wash"],
  },
  {
    group: "Home & Local Services",
    googleTypes: [
      "plumber",
      "electrician",
      "cleaning_service",
      "locksmith",
      "painter",
      "roofing_contractor",
      "moving_company",
    ],
  },
  {
    group: "Entertainment & Attractions",
    googleTypes: [
      "movie_theater",
      "museum",
      "art_gallery",
      "zoo",
      "aquarium",
      "park",
    ],
  },
];

/**
 * Extract businessType (Main Category) and subCategory from Google Places types array
 * @param {string[]} types
 * @returns {object}
 */
const extractCategories = (types, keyword = "") => {
  if (!types || types.length === 0) {
    return {
      businessType: "Unknown",
      subCategory: "General",
    };
  }

  let mainCategory = "Other";
  let subCategory = types[0].replace(/_/g, " ");
  const normalizedKeyword = (keyword || "").toLowerCase();

  // 1. Try to match based on Google Types (high priority)
  for (const mapping of CATEGORY_MAPPING) {
    if (types.some((t) => mapping.googleTypes.includes(t))) {
      mainCategory = mapping.group;
      break;
    }
  }

  // 2. Fallback to Keyword matching if still "Other" or generic
  if (mainCategory === "Other") {
    if (
      normalizedKeyword.includes("coach") ||
      normalizedKeyword.includes("school") ||
      normalizedKeyword.includes("tutor") ||
      normalizedKeyword.includes("train") ||
      normalizedKeyword.includes("education")
    ) {
      mainCategory = "Education & Training";
    } else if (
      normalizedKeyword.includes("gym") ||
      normalizedKeyword.includes("fitness") ||
      normalizedKeyword.includes("yoga")
    ) {
      mainCategory = "Fitness & Recreation";
    } else if (
      normalizedKeyword.includes("restaurant") ||
      normalizedKeyword.includes("food") ||
      normalizedKeyword.includes("cafe")
    ) {
      mainCategory = "Restaurants & Food";
    } else if (
      normalizedKeyword.includes("store") ||
      normalizedKeyword.includes("shop") ||
      normalizedKeyword.includes("retail")
    ) {
      mainCategory = "Retail Stores";
    } else if (
      normalizedKeyword.includes("doctor") ||
      normalizedKeyword.includes("hospital") ||
      normalizedKeyword.includes("medical")
    ) {
      mainCategory = "Health & Medical";
    } else if (
      normalizedKeyword.includes("lawyer") ||
      normalizedKeyword.includes("legal") ||
      normalizedKeyword.includes("law")
    ) {
      mainCategory = "Professional Services";
    } else if (
      normalizedKeyword.includes("hotel") ||
      normalizedKeyword.includes("travel")
    ) {
      mainCategory = "Hospitality & Travel";
    } else if (
      normalizedKeyword.includes("auto") ||
      normalizedKeyword.includes("car")
    ) {
      mainCategory = "Automotive";
    } else if (
      normalizedKeyword.includes("plumb") ||
      normalizedKeyword.includes("repair") ||
      normalizedKeyword.includes("service")
    ) {
      mainCategory = "Home & Local Services";
    }
  }

  // Use the first type provided by Google as the subCategory (more specific)
  // but if it's the same as a main category group name, try to find a better one
  if (
    types.length > 1 &&
    (types[0] === "point_of_interest" || types[0] === "establishment")
  ) {
    subCategory = types[1].replace(/_/g, " ");
  }

  // If subCategory is still generic and we have a keyword, use the keyword as subCategory
  if (
    (subCategory === "establishment" || subCategory === "point of interest") &&
    keyword
  ) {
    subCategory = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  }

  // Result Swapped as per user request (Main Category is now the specific Google Type)
  const result = {
    businessType:
      subCategory.charAt(0).toUpperCase() + subCategory.slice(1).toLowerCase(),
    subCategory: mainCategory,
  };

  logger.info(
    `Mapped (types: [${types.join(", ")}], keyword: "${keyword}") to: ${JSON.stringify(result)}`,
  );

  return result;
};

/**
 * Delay for a given number of milliseconds
 * @param {number} ms
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch leads from Google Places with pagination handling
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius
 * @param {string} businessType
 * @param {number} targetLimit
 * @returns {Promise<any[]>}
 */
const fetchLeadsWithPagination = async (
  lat,
  lng,
  radius,
  businessType,
  targetLimit,
) => {
  let allLeads = [];
  let nextPageToken = null;

  do {
    const response = await placesService.findNearbyPlaces(
      lat,
      lng,
      radius,
      businessType,
      targetLimit,
      nextPageToken,
    );

    const formattedResults = response.results.map((place) => {
      // Use Google's types directly as the subCategory (fetched from API)
      const categories = extractCategories(place.types, businessType);

      return {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address,
        phone: "Pending", // Usually requires extra Details call
        rating: place.rating,
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        businessType: categories.businessType,
        subCategory: categories.subCategory,
        types: place.types,
      };
    });

    allLeads = [...allLeads, ...formattedResults];
    nextPageToken = response.nextPageToken;

    if (allLeads.length >= targetLimit) break;

    if (nextPageToken) {
      logger.info("Waiting for next_page_token to become valid...");
      await delay(2000); // 2 second delay before next call
    }
  } while (nextPageToken);

  return allLeads;
};

/**
 * Smart Lead Search with Geo-Expansion and Quadrants
 * @param {string} city
 * @param {string} businessType
 * @param {number} limit
 */
const searchLeads = async (city, businessType, limit) => {
  logger.info(
    `Starting lead search for ${businessType} in ${city} (Limit: ${limit})`,
  );

  // Step 1: Geocode City
  const { lat, lng } = await geocodeService.getCoordinates(city);

  let leads = [];

  if (limit <= 200) {
    // Step 2: Geo-Expansion Search Algorithm
    let radius = 2000; // Start = 2km
    const maxRadius = 20000; // Max = 20km
    const increment = 3000; // Increment = 3km

    while (leads.length < limit && radius <= maxRadius) {
      logger.info(`Searching with radius: ${radius}m`);
      const batch = await fetchLeadsWithPagination(
        lat,
        lng,
        radius,
        businessType,
        limit,
      );

      // Merge and deduplicate
      const combined = [...leads, ...batch];
      leads = [
        ...new Map(combined.map((item) => [item.placeId, item])).values(),
      ];

      if (leads.length >= limit) break;
      radius += increment;
    }
  } else {
    // Step 4: Advanced Scaling Strategy (Quadrants)
    logger.info("Limit > 200, initiating quadrant parallel search");

    // Offset for quadrants roughly 8-10km
    // 0.09 degrees lat is ~10km, 0.09 degrees lng is ~8.5km at 40 deg lat
    const offset = 0.08;

    const quadrants = [
      { lat: lat + offset, lng: lng, label: "North" },
      { lat: lat - offset, lng: lng, label: "South" },
      { lat: lat, lng: lng + offset, label: "East" },
      { lat: lat, lng: lng - offset, label: "West" },
    ];

    const radius = 10000; // 10km radius for each quadrant to cover enough area

    const quadrantSearches = quadrants.map((q) => {
      logger.info(`Launching parallel search for ${q.label} quadrant`);
      return fetchLeadsWithPagination(
        q.lat,
        q.lng,
        radius,
        businessType,
        Math.ceil(limit / 4),
      );
    });

    const results = await Promise.all(quadrantSearches);

    // Merge all results
    const combined = leads.concat(...results);
    leads = [...new Map(combined.map((item) => [item.placeId, item])).values()];
  }

  // Deduplicate and slice to limit
  const uniqueLeads = [
    ...new Map(leads.map((item) => [item.placeId, item])).values(),
  ];
  const finalLeads = uniqueLeads.slice(0, limit);

  logger.info(`Search complete. Found ${finalLeads.length} unique leads.`);
  return finalLeads;
};

module.exports = {
  searchLeads,
  extractCategories,
};
