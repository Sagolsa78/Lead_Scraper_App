const geocodeService = require("../services/geocodeService");
const placesService = require("../services/placesService");
const sheetsService = require("../services/sheetsService");
const validationService = require("../services/validationService");
const duplicateChecker = require("../utils/duplicateChecker");
const responseFormatter = require("../utils/responseFormatter");
const prisma = require("../config/prisma");
const logger = require("../config/logger");

const generateLeads = async (req, res, next) => {
  try {
    const { city, keyword, radius = 3000, limit = 20 } = req.body;

    logger.info(
      `Lead generation started: ${keyword} in ${city} (radius: ${radius})`,
    );

    // 1. Geocoding
    const coords = await geocodeService.getCoordinates(city);

    // 2. Fetch Nearby Places
    const places = await placesService.findNearbyPlaces(
      coords.lat,
      coords.lng,
      radius,
      keyword,
      limit,
    );

    const validLeads = [];
    let duplicatesRemoved = 0;

    // 3. Process Each Place
    for (const place of places) {
      const details = await placesService.getPlaceDetails(place.place_id);
      if (!details) continue;

      // Filter: Validate Lead (No Website, Has Phone)
      if (!validationService.validateLeadData(details)) continue;

      // Filter: Duplicate Check
      const isDup = await duplicateChecker.isDuplicate(
        details.formatted_phone_number,
      );
      if (isDup) {
        duplicatesRemoved++;
        continue;
      }

      validLeads.push({
        ...details,
        businessType: keyword,
        city: city,
      });
    }

    // 4. Save to Postgres using Prisma
    const successfulSaves = [];
    for (const lead of validLeads) {
      try {
        const savedLead = await prisma.lead.create({
          data: {
            name: lead.name,
            address: lead.formatted_address,
            phone: duplicateChecker.normalizePhone(lead.formatted_phone_number),
            rating: lead.rating,
            website: lead.website || "N/A",
            googleMapsUrl: lead.url,
            businessType: lead.businessType,
            city: lead.city,
            searchKeyword: keyword,
          },
        });
        successfulSaves.push(savedLead);
      } catch (err) {
        logger.warn(
          `Failed to save lead to Postgres: ${lead.name} - ${err.message}`,
        );
      }
    }

    // 5. Save to Google Sheets
    const savedToSheetCount = await sheetsService.appendLeads(validLeads, {
      city,
      businessType: keyword,
    });

    const result = {
      totalFetched: places.length,
      validLeadsCount: validLeads.length,
      duplicatesRemoved,
      savedToPostgres: successfulSaves.length,
      savedToSheet: savedToSheetCount,
    };

    logger.info("Lead generation completed", result);
    res
      .status(200)
      .json(
        responseFormatter(result, "Lead generation completed successfully"),
      );
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      keyword,
      whatsapp_status,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (keyword)
      where.searchKeyword = { contains: keyword, mode: "insensitive" };
    if (whatsapp_status) where.whatsapp_sent = whatsapp_status === "sent";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
      }),
      prisma.lead.count({ where }),
    ]);

    res.status(200).json(
      responseFormatter(
        {
          leads,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / take),
          },
        },
        "Leads fetched successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { generateLeads, getLeads };
