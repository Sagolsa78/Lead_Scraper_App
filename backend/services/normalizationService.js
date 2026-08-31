/**
 * Normalization Engine
 * Transforms raw data from various sources into structured Business entities.
 */

const normalizeGooglePlace = (rawPlaceData) => {
  // Extract fields from Google Place Result
  const {
    place_id,
    name,
    formatted_address,
    formatted_phone_number,
    website,
    rating,
    user_ratings_total,
    price_level,
    types,
  } = rawPlaceData;

  // Domain extraction logic
  let domain = null;
  if (website) {
    try {
      const url = new URL(website);
      domain = url.hostname.replace("www.", "");
    } catch (e) {
      // invalid url, ignore
    }
  }

  // Determine Primary Category (simple heuristic for now)
  const primaryCategory =
    types && types.length > 0 ? types[0] : "Uncategorized";

  // Return structure matching the Prisma 'Business' model (mostly)
  return {
    googlePlaceId: place_id,
    name,
    address: formatted_address,
    phone: formatted_phone_number,
    website,
    domain,
    rating: rating || 0,
    reviewCount: user_ratings_total || 0,
    priceLevel: price_level,
    types: types || [],
    primaryCategory,
  };
};

module.exports = { normalizeGooglePlace };
