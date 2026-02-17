const geocodeService = require("./geocodeService");
const placesService = require("./placesService");
const logger = require("../config/logger");

/**
 * Extract businessType and subCategory from Google Places types array
 * @param {string[]} types
 * @returns {object}
 */
const aiService = require("./aiService");

/**
 * Enhanced Category Mapping based on Google Maps Place Types Table A
 */
const CATEGORY_MAPPING = [
  {
    group: "Automotive",
    googleTypes: [
      "car_dealer",
      "car_rental",
      "car_repair",
      "car_wash",
      "gas_station",
      "parking",
      "tire_shop",
    ],
  },
  {
    group: "Business",
    googleTypes: [
      "business_center",
      "corporate_office",
      "coworking_space",
      "manufacturer",
      "supplier",
    ],
  },
  {
    group: "Culture",
    googleTypes: [
      "art_gallery",
      "museum",
      "performing_arts_theater",
      "library",
    ],
  },
  {
    group: "Education",
    googleTypes: [
      "school",
      "university",
      "primary_school",
      "secondary_school",
      "preschool",
    ],
  },
  {
    group: "Entertainment and Recreation",
    googleTypes: [
      "amusement_park",
      "aquarium",
      "casino",
      "movie_theater",
      "night_club",
      "zoo",
      "park",
    ],
  },
  {
    group: "Finance",
    googleTypes: ["bank", "accounting", "atm"],
  },
  {
    group: "Food and Drink",
    googleTypes: [
      "restaurant",
      "cafe",
      "bar",
      "bakery",
      "meal_takeaway",
      "meal_delivery",
      "coffee_shop",
    ],
  },
  {
    group: "Government",
    googleTypes: [
      "city_hall",
      "courthouse",
      "embassy",
      "fire_station",
      "police",
      "post_office",
    ],
  },
  {
    group: "Health and Wellness",
    googleTypes: [
      "doctor",
      "dentist",
      "hospital",
      "pharmacy",
      "spa",
      "gym",
      "yoga_studio",
      "beauty_salon",
    ],
  },
  {
    group: "Lodging",
    googleTypes: [
      "hotel",
      "motel",
      "resort_hotel",
      "lodging",
      "bed_and_breakfast",
    ],
  },
  {
    group: "Services",
    googleTypes: [
      "lawyer",
      "locksmith",
      "painter",
      "plumber",
      "real_estate_agency",
      "roofing_contractor",
      "travel_agency",
    ],
  },
  {
    group: "Shopping",
    googleTypes: [
      "clothing_store",
      "electronics_store",
      "grocery_store",
      "shopping_mall",
      "supermarket",
      "store",
    ],
  },
  {
    group: "Sports",
    googleTypes: ["stadium", "sports_complex", "fitness_center"],
  },
  {
    group: "Transportation",
    googleTypes: ["airport", "bus_station", "train_station", "transit_station"],
  },
];

/**
 * Extract businessType (Main Category) and subCategory from Google Places types array
 * @param {string[]} types
 * @param {string} keyword
 * @param {string} placeName
 * @returns {Promise<object>}
 */
const extractCategories = async (types, keyword = "", placeName = "") => {
  if (!types || types.length === 0) {
    return {
      businessType: "General",
      subCategory: "Unknown",
    };
  }

  // 1. Try AI Categorization first
  const aiResult = await aiService.categorizeLead(placeName, types, keyword);
  if (aiResult) {
    return {
      businessType: aiResult.subCategory, // Mapping specific type to businessType as per current schema
      subCategory: aiResult.mainCategory, // Mapping broad group to subCategory as per current schema
    };
  }

  // 2. Fallback to Rule-based mapping
  let mainCategory = "Other";
  let specificType = types[0].replace(/_/g, " ");

  for (const mapping of CATEGORY_MAPPING) {
    if (types.some((t) => mapping.googleTypes.includes(t))) {
      mainCategory = mapping.group;
      break;
    }
  }

  // Clean up specificType
  if (
    types.length > 1 &&
    (types[0] === "point_of_interest" || types[0] === "establishment")
  ) {
    specificType = types[1].replace(/_/g, " ");
  }

  const result = {
    businessType:
      specificType.charAt(0).toUpperCase() +
      specificType.slice(1).toLowerCase(),
    subCategory: mainCategory,
  };

  logger.info(`Fallback mapping for "${placeName}": ${JSON.stringify(result)}`);
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

    const formattedResults = await Promise.all(
      response.results.map(async (place) => {
        // Use Google's types directly as the subCategory (fetched from API)
        const categories = await extractCategories(
          place.types,
          businessType,
          place.name,
        );

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
      }),
    );

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
