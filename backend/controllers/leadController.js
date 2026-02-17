const geocodeService = require("../services/geocodeService");
const placesService = require("../services/placesService");
const leadSearchService = require("../services/leadSearchService");
const sheetsService = require("../services/sheetsService");
const validationService = require("../services/validationService");
const duplicateChecker = require("../utils/duplicateChecker");
const responseFormatter = require("../utils/responseFormatter");
const prisma = require("../config/prisma");
const logger = require("../config/logger");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateLeads = async (req, res, next) => {
  try {
    const { city, keyword, radius, limit } = req.body;

    if (!city) {
      const error = new Error("City is required");
      error.status = 400;
      throw error;
    }

    if (!limit) {
      const error = new Error("Limit is required");
      error.status = 400;
      throw error;
    }

    logger.info(
      `Lead generation started: ${keyword || "Any"} in ${city} (radius: ${radius}, limit: ${limit})`,
    );

    // 1. Geocoding
    const coords = await geocodeService.getCoordinates(city);

    const validLeads = [];
    let duplicatesRemoved = 0;
    let totalFetched = 0;
    let nextPageToken = null;
    let pagesProcessed = 0;

    // 2. Fetch Nearby Places (Loop until limit or no more results)
    do {
      const { results, nextPageToken: token } =
        await placesService.findNearbyPlaces(
          coords.lat,
          coords.lng,
          radius,
          keyword,
          limit,
          nextPageToken,
        );

      totalFetched += results.length;
      nextPageToken = token;
      pagesProcessed++;

      // 3. Process Each Place
      for (const place of results) {
        if (validLeads.length >= limit) break;

        const details = await placesService.getPlaceDetails(place.place_id);
        if (!details) {
          logger.debug(`No details found for placeId: ${place.place_id}`);
          continue;
        }

        // Filter: Validate Lead (No Website, Has Phone)
        const isValid = validationService.validateLeadData(details);
        if (!isValid) {
          logger.debug(
            `Lead rejected by validation: ${details.name} (Phone: ${!!details.formatted_phone_number}, Website: ${!!details.website})`,
          );
          continue;
        }

        // Filter: Duplicate Check
        const isDup = await duplicateChecker.isDuplicate(
          details.formatted_phone_number,
        );
        if (isDup) {
          logger.debug(`Lead rejected as duplicate: ${details.name}`);
          duplicatesRemoved++;
          continue;
        }

        // Capture Categories from details types
        const categories = leadSearchService.extractCategories(
          details.types,
          keyword,
        );

        const leadData = {
          ...details,
          businessType: categories.businessType,
          subCategory: categories.subCategory,
          city,
        };

        validLeads.push(leadData);
      }

      // If we need more leads and there's a next page, wait for Google's token delay
      if (validLeads.length < limit && nextPageToken) {
        logger.info(
          `Fetching more leads... (Current: ${validLeads.length}/${limit})`,
        );
        await sleep(2000); // Wait for the token to become active
      }
    } while (validLeads.length < limit && nextPageToken && pagesProcessed < 3); // Limit to 3 pages (60 results) from Google

    if (validLeads.length === 0) {
      return res.status(200).json(
        responseFormatter(
          {
            totalFetched: 0,
            validLeadsCount: 0,
            duplicatesRemoved: 0,
            savedToPostgres: 0,
            savedToSheet: 0,
          },
          "No leads found matching the criteria in this area",
        ),
      );
    }

    // 4. Save to Postgres using Prisma
    const successfulSaves = [];
    for (const lead of validLeads) {
      try {
        const savedLead = await prisma.lead.create({
          data: {
            name: lead.name,
            address: lead.formatted_address || lead.address,
            phone: duplicateChecker.normalizePhone(
              lead.formatted_phone_number || lead.phone,
            ),
            rating: lead.rating || 0,
            website: lead.website || "N/A",
            googleMapsUrl: lead.url || lead.googleMapsUrl,
            businessType: lead.businessType,
            subCategory: lead.subCategory,
            city: lead.city,
            placeId: lead.place_id || lead.placeId,
            searchKeyword: keyword || "ALL",
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
    let savedToSheetCount = 0;
    try {
      savedToSheetCount = await sheetsService.appendLeads(validLeads, {
        city,
        businessType: keyword || "ALL",
      });
    } catch (err) {
      logger.error(`Failed to sync to Google Sheets: ${err.message}`);
    }

    const result = {
      totalFetched,
      validLeadsCount: validLeads.length,
      duplicatesRemoved,
      savedToPostgres: successfulSaves.length,
      savedToSheet: savedToSheetCount,
    };
    console.log(result);

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

const advancedSearch = async (req, res, next) => {
  try {
    const { city, businessType, limit } = req.body;

    // Validation
    if (!city || !businessType) {
      const error = new Error("City and businessType are required");
      error.status = 400;
      throw error;
    }

    if (!limit || limit > 500) {
      const error = new Error("Limit is required and max is 500");
      error.status = 400;
      throw error;
    }

    logger.info(
      `Advanced search initiated: ${businessType} in ${city} (limit: ${limit})`,
    );

    // 1. Fetch leads from Google via Service
    const leads = await leadSearchService.searchLeads(
      city,
      businessType,
      limit,
    );

    // 2. Save to Database
    const savedLeads = [];
    for (const lead of leads) {
      try {
        // Find existing by placeId or phone to avoid duplicates
        const existing = await prisma.lead.findFirst({
          where: {
            OR: [
              { placeId: lead.placeId },
              { phone: duplicateChecker.normalizePhone(lead.phone) },
            ],
          },
        });

        if (existing) {
          logger.debug(`Lead already exists: ${lead.name} (${lead.placeId})`);
          continue;
        }

        const saved = await prisma.lead.create({
          data: {
            name: lead.name,
            address: lead.address,
            phone: duplicateChecker.normalizePhone(lead.phone) || "Pending",
            rating: lead.rating,
            website: "N/A", // Details fetching would be a bonus
            googleMapsUrl: lead.googleMapsUrl,
            businessType: lead.businessType,
            subCategory: lead.subCategory,
            city: city,
            searchKeyword: businessType,
            placeId: lead.placeId,
          },
        });
        savedLeads.push(saved);
      } catch (err) {
        logger.warn(`Failed to save lead ${lead.name}: ${err.message}`);
      }
    }

    const result = {
      totalFound: leads.length,
      savedToPostgres: savedLeads.length,
      savedToSheet: 0,
    };

    // 3. Save to Google Sheets
    if (leads.length > 0) {
      try {
        result.savedToSheet = await sheetsService.appendLeads(leads, {
          city,
          businessType,
        });
      } catch (err) {
        logger.error(`Failed to sync to Google Sheets: ${err.message}`);
      }
    }

    res
      .status(200)
      .json(
        responseFormatter(result, "Advanced search completed successfully"),
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
      subCategory,
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
    if (subCategory)
      where.subCategory = { contains: subCategory, mode: "insensitive" };
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

module.exports = { generateLeads, getLeads, advancedSearch };
