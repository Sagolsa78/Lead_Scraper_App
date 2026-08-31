const geocodeService = require("../services/geocodeService");
const placesService = require("../services/placesService");
const leadSearchService = require("../services/leadSearchService");

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
        const details = await placesService.getPlaceDetails(lead.placeId);
        if (!details) continue;

        const isValid = await validationService.validateLeadData(details);
        if (!isValid) continue;

        const normalizedPhone = duplicateChecker.normalizePhone(details.formatted_phone_number);
        if (!normalizedPhone || normalizedPhone === "Pending") continue;

        const { calculateLeadPriority } = require("../services/finalScoringEngine");
        const scoreData = await calculateLeadPriority(details, details.reviews || []);

        const saved = await prisma.lead.upsert({
          where: { phone: normalizedPhone },
          update: {
            name: details.name,
            address: details.formatted_address,
            rating: details.rating,
            googleMapsUrl: details.url,
            businessType: businessType,
            subCategory: details.types?.[0] || "General",
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
            name: details.name,
            address: details.formatted_address,
            phone: normalizedPhone,
            rating: details.rating,
            website: details.website || "N/A",
            googleMapsUrl: details.url,
            businessType: businessType,
            subCategory: details.types?.[0] || "General",
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
      validLeadsCount: savedLeads.length,
      savedToPostgres: savedLeads.length,
      savedToSheet: 0,
    };

    if (savedLeads.length === 0) {
      return res
        .status(200)
        .json(
          responseFormatter(
            result,
            "No leads found matching the criteria in this area",
          ),
        );
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

    const organizationId = req.user?.organizationId;

    const where = { organizationId };
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
      where: { id, organizationId },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json(responseFormatter(job, "Job status retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;

    const [totalLeads, whatsappSent, verifiedPhones, highPriority] = await Promise.all([
      prisma.lead.count({ where: { organizationId } }),
      prisma.lead.count({ where: { organizationId, whatsapp_sent: true } }),
      prisma.lead.count({ where: { organizationId, phoneValid: true } }),
      prisma.lead.count({ where: { organizationId, priority: "HIGH" } }),
    ]);

    const conversionRate = totalLeads > 0 ? ((whatsappSent / totalLeads) * 100).toFixed(1) : "0.0";

    res.status(200).json(
      responseFormatter(
        {
          totalLeads,
          whatsappSent,
          verifiedPhones,
          highPriority,
          conversionRate,
        },
        "Statistics retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { status } = req.query;

    let where = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (status === "active") {
      // Return PENDING + RUNNING jobs
      where.status = { in: ["PENDING", "RUNNING"] };
    } else if (status === "completed") {
      where.status = "COMPLETED";
    } else if (status === "failed") {
      where.status = "FAILED";
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.status(200).json(
      responseFormatter(
        { jobs },
        "Jobs retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

const cancelJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const job = await prisma.job.findUnique({
      where: { id, organizationId },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      return res.status(400).json({ success: false, message: "Job is already finished" });
    }

    await prisma.job.update({
      where: { id },
      data: { status: "CANCELLED", completedAt: new Date() }
    });

    res.status(200).json(
      responseFormatter({}, "Job cancelled successfully")
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { generateLeads, advancedSearch, getLeads, getJobStatus, getJobs, getStats, cancelJob };

