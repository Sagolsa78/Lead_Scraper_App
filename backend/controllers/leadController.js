const geocodeService = require("../services/geocodeService");
const placesService = require("../services/placesService");
const leadSearchService = require("../services/leadSearchService");
const sheetsService = require("../services/sheetsService");
const validationService = require("../services/validationService");
const duplicateChecker = require("../utils/duplicateChecker");
const responseFormatter = require("../utils/responseFormatter");
const prisma = require("../config/prisma");
const logger = require("../config/logger");
const socialDiscoveryService = require("../services/socialDiscoveryService");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Strict allowlist for sortable columns to prevent injection
const ALLOWED_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "name",
  "city",
  "rating",
  "finalScore",
  "priority",
  "status",
  "socialScore",
];

const FALLBACK_KEYWORDS = [
  "plumber",
  "electrician",
  "dentist",
  "mechanic",
  "lawyer",
  "real estate agency",
  "insurance agency",
  "cleaning service",
  "pest control",
  "hvac",
  "landscaper",
  "beauty salon",
  "gym",
  "restaurant",
  "cafe",
];

const { discoveryQueue } = require("../config/bullQueue");

const generateLeads = async (req, res, next) => {
  try {
    const { city, keyword, radius, limit } = req.body;
    const organizationId = req.user?.organizationId;

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
      `Lead generation enqueued: ${keyword || "Any"} in ${city} (radius: ${radius}, limit: ${limit})`,
    );

    // Create Job Record
    const jobRecord = await prisma.job.create({
      data: {
        type: "DISCOVERY",
        status: "PENDING",
        data: { city, keyword, radius, limit, organizationId },
        organizationId
      }
    });

    // Enqueue BullMQ job
    await discoveryQueue.add("discover-leads", {
      city, keyword, radius, limit, organizationId
    }, {
      jobId: jobRecord.id // Sync BullMQ ID with DB ID
    });

    res.status(202).json(
      responseFormatter(
        { jobId: jobRecord.id },
        "Lead generation job started successfully. You can track progress in the jobs dashboard."
      )
    );
  } catch (error) {
    next(error);
  }
};

const { calculateLeadPriority } = require("../services/finalScoringEngine");

const advancedSearch = async (req, res, next) => {
  try {
    const { city, businessType, limit } = req.body;
    const organizationId = req.user?.organizationId;

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
        const normalizedPhone = duplicateChecker.normalizePhone(lead.phone);
        if (!normalizedPhone || normalizedPhone === "Pending") {
          continue;
        }

        const scoreData = await calculateLeadPriority(lead, lead.reviews || []);

        const saved = await prisma.lead.upsert({
          where: { phone: normalizedPhone },
          update: {
            name: lead.name,
            address: lead.address,
            rating: lead.rating,
            googleMapsUrl: lead.googleMapsUrl,
            businessType: lead.businessType,
            subCategory: lead.subCategory,
            city: city,
            searchKeyword: businessType,
            reviewScore: scoreData.reviewScore,
            socialScore: scoreData.socialScore,
            categoryScore: scoreData.categoryScore,
            urgencyScore: scoreData.urgencyScore,
            finalScore: scoreData.finalScore,
            priority: scoreData.priority,
          },
          create: {
            name: lead.name,
            address: lead.address,
            phone: normalizedPhone,
            rating: lead.rating,
            website: "N/A",
            googleMapsUrl: lead.googleMapsUrl,
            businessType: lead.businessType,
            subCategory: lead.subCategory,
            city: city,
            searchKeyword: businessType,
            placeId: lead.placeId,
            reviewScore: scoreData.reviewScore,
            urgencyScore: scoreData.urgencyScore,
            categoryScore: scoreData.categoryScore,
            finalScore: scoreData.finalScore,
            priority: scoreData.priority,
            organizationId
          },
        });
        savedLeads.push(saved);
      } catch (err) {
        logger.warn(`Failed to save lead ${lead.name}: ${err.message}`);
      }
    }

    const result = {
      totalFound: leads.length,
      validLeadsCount: leads.length,
      savedToPostgres: savedLeads.length,
      savedToSheet: 0,
    };

    if (leads.length === 0) {
      return res
        .status(200)
        .json(
          responseFormatter(
            result,
            "No leads found matching the criteria in this area",
          ),
        );
    }

    // 3. Save to Google Sheets
    try {
      result.savedToSheet = await sheetsService.appendLeads(leads, {
        city,
        businessType,
      });
    } catch (err) {
      logger.error(`Failed to sync to Google Sheets: ${err.message}`);
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

    // Validate sortBy against strict allowlist
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy)
      ? sortBy
      : "createdAt";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100); // Cap at 100

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
        orderBy: { [safeSortBy]: order === "asc" ? "asc" : "desc" },
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
            limit: take,
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

const getJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.organizationId && job.organizationId !== organizationId) {
      return res.status(403).json({ success: false, message: "Unauthorized access to job" });
    }

    res.status(200).json(
      responseFormatter(job, "Job status retrieved successfully")
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { generateLeads, advancedSearch, getLeads, getJobStatus };
