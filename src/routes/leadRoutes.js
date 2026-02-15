const express = require("express");
const router = express.Router();
const geocodeService = require("../services/geocodeService");
const placesService = require("../services/placesService");
const sheetsService = require("../services/sheetsService");
const duplicateChecker = require("../utils/duplicateChecker");

router.get("/health", (req, res) => {
  res.json({ status: "running" });
});

router.post("/generate-leads", async (req, res, next) => {
  try {
    const { location, businessType, radius, limit } = req.body;

    if (!location || !businessType || !radius || !limit) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: location, businessType, radius, limit",
      });
    }

    // 0. Ensure Sheet Headers exist
    await sheetsService.checkAndAddHeaders();

    // 1. Convert location to lat/lng
    const { lat, lng } = await geocodeService.getCoordinates(location);

    // 2. Fetch nearby places
    const places = await placesService.findNearbyPlaces(
      lat,
      lng,
      radius,
      businessType,
      limit,
    );

    // 3. Process each place
    const processedLeads = [];
    let noWebsiteLeadsCount = 0;
    let duplicatesSkippedCount = 0;

    // Fetch existing phone numbers to check for duplicates
    // Using a simple in-memory set for this proof of concept, ideally this would be a DB check
    const existingPhones = await sheetsService.getExistingPhones();

    for (const place of places) {
      const details = await placesService.getPlaceDetails(place.place_id);

      if (!details) continue;

      // Filter: Skip if no phone number
      if (!details.formatted_phone_number) continue;

      // Filter: We want leads where website is missing/empty
      if (!details.website) {
        noWebsiteLeadsCount++;

        // Filter: Check for duplicates
        if (
          duplicateChecker.isDuplicate(
            existingPhones,
            details.formatted_phone_number,
          )
        ) {
          duplicatesSkippedCount++;
          continue;
        }

        processedLeads.push(details);
      }
    }

    console.log("processedLeads", processedLeads);
    // 4. Save to Sheets
    const savedCount = await sheetsService.appendLeads(processedLeads);

    res.json({
      success: true,
      totalFetched: places.length,
      noWebsiteLeads: noWebsiteLeadsCount,
      savedToSheet: savedCount,
      duplicatesSkipped: duplicatesSkippedCount,
      data: processedLeads,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
