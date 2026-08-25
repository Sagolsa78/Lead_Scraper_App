const { Worker } = require("bullmq");
const { connection } = require("../config/bullQueue");
const prisma = require("../config/prisma");
const logger = require("../config/logger");

const geocodeService = require("../services/geocodeService");
const placesService = require("../services/placesService");
const leadSearchService = require("../services/leadSearchService");
const sheetsService = require("../services/sheetsService");
const validationService = require("../services/validationService");
const duplicateChecker = require("../utils/duplicateChecker");
const socialDiscoveryService = require("../services/socialDiscoveryService");
const { calculateLeadPriority } = require("../services/finalScoringEngine");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const fetchAndProcessLeads = async (
  coords,
  keyword,
  radius,
  limit,
  city,
  existingPlaceIds = new Set(),
  job
) => {
  const validLeads = [];
  let duplicatesRemoved = 0;
  let hardFiltered = 0;
  let totalFetched = 0;
  let nextPageToken = null;
  let pagesProcessed = 0;

  try {
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

      for (const place of results) {
        if (validLeads.length >= limit) break;

        if (existingPlaceIds.has(place.place_id)) {
          continue;
        }

        const details = await placesService.getPlaceDetails(place.place_id);
        if (!details) {
          logger.debug(`No details found for placeId: ${place.place_id}`);
          continue;
        }

        const isValid = validationService.validateLeadData(details);
        if (!isValid) {
          hardFiltered++;
          continue;
        }

        const isDup = await duplicateChecker.isDuplicate(
          details.formatted_phone_number,
        );
        if (isDup) {
          logger.debug(`Lead rejected as duplicate: ${details.name}`);
          duplicatesRemoved++;
          continue;
        }

        const categories = await leadSearchService.extractCategories(
          details.types,
          keyword,
          details.name,
        );

        const leadData = {
          ...details,
          businessType: categories.businessType,
          subCategory: categories.subCategory,
          city,
        };

        const enrichedLead = await socialDiscoveryService.enrichLead(leadData);
        validLeads.push(enrichedLead);
        existingPlaceIds.add(place.place_id);
        
        if (job) {
           await job.updateProgress(Math.floor((validLeads.length / limit) * 80)); // 0-80% progress for fetching
        }
      }

      if (validLeads.length < limit && nextPageToken) {
        logger.info(
          `Fetching more leads for '${keyword || "All"}'... (Current: ${validLeads.length}/${limit})`,
        );
        await sleep(2000);
      }
    } while (validLeads.length < limit && nextPageToken && pagesProcessed < 3);
  } catch (error) {
    logger.error(
      `Error fetching leads for keyword '${keyword}': ${error.message}`,
    );
  }

  return { validLeads, totalFetched, duplicatesRemoved, hardFiltered };
};

const processDiscoveryJob = async (job) => {
  const { city, keyword, radius, limit, organizationId } = job.data;
  
  logger.info(`Discovery job ${job.id} started for ${city}`);
  
  await prisma.job.update({
    where: { id: job.id },
    data: { status: "RUNNING", startedAt: new Date() }
  });

  try {
    const coords = await geocodeService.getCoordinates(city);

    let allValidLeads = [];
    let grandTotalFetched = 0;
    let grandDuplicatesRemoved = 0;
    let grandHardFiltered = 0;
    const processedPlaceIds = new Set();

    const initialResult = await fetchAndProcessLeads(
      coords,
      keyword,
      radius,
      limit,
      city,
      processedPlaceIds,
      job
    );

    allValidLeads = [...initialResult.validLeads];
    grandTotalFetched += initialResult.totalFetched;
    grandDuplicatesRemoved += initialResult.duplicatesRemoved;
    grandHardFiltered += initialResult.hardFiltered;

    let fallbackUsed = false;
    let fallbackKeywords = [];

    if (allValidLeads.length === 0) {
      fallbackUsed = true;
      const fallbackOptions = [...FALLBACK_KEYWORDS];
      const MAX_RETRIES = 3;
      let retries = 0;

      while (
        allValidLeads.length < limit &&
        retries < MAX_RETRIES &&
        fallbackOptions.length > 0
      ) {
        const randomIndex = Math.floor(Math.random() * fallbackOptions.length);
        const randomKeyword = fallbackOptions[randomIndex];
        fallbackOptions.splice(randomIndex, 1);
        fallbackKeywords.push(randomKeyword);

        const remainingLimit = limit - allValidLeads.length;
        const fallbackResult = await fetchAndProcessLeads(
          coords,
          randomKeyword,
          radius,
          remainingLimit,
          city,
          processedPlaceIds,
          job
        );

        allValidLeads = [...allValidLeads, ...fallbackResult.validLeads];
        grandTotalFetched += fallbackResult.totalFetched;
        grandDuplicatesRemoved += fallbackResult.duplicatesRemoved;
        grandHardFiltered += fallbackResult.hardFiltered;

        if (allValidLeads.length >= limit) break;
        retries++;
        if (allValidLeads.length < limit) await sleep(1000);
      }
    }

    await job.updateProgress(90);

    const successfulSaves = [];
    for (const lead of allValidLeads) {
      try {
        const scoreData = await calculateLeadPriority(lead, lead.reviews || []);
        
        const savedLead = await prisma.lead.upsert({
          where: { phone: duplicateChecker.normalizePhone(lead.formatted_phone_number || lead.phone) },
          update: {
            rating: lead.rating || 0,
            reviewScore: scoreData.reviewScore,
            socialScore: scoreData.socialScore,
            categoryScore: scoreData.categoryScore,
            urgencyScore: scoreData.urgencyScore,
            finalScore: scoreData.finalScore,
            priority: scoreData.priority,
            lastSocialCheck: lead.lastSocialCheck,
          },
          create: {
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
            searchKeyword: keyword || lead.businessType || "Fallback",
            instagramProfile: lead.instagramProfile,
            facebookProfile: lead.facebookProfile,
            linkedinProfile: lead.linkedinProfile,
            socialStatus: lead.socialStatus,
            socialScore: lead.socialScore,
            socialData: lead.socialData || {},
            lastSocialCheck: lead.lastSocialCheck,
            reviewScore: scoreData.reviewScore,
            urgencyScore: scoreData.urgencyScore,
            categoryScore: scoreData.categoryScore,
            finalScore: scoreData.finalScore,
            priority: scoreData.priority,
            organizationId
          },
        });
        successfulSaves.push(savedLead);
      } catch (err) {
        if (err.code !== "P2002") {
          logger.warn(`Failed to save lead: ${err.message}`);
        }
      }
    }

    let savedToSheetCount = 0;
    try {
      savedToSheetCount = await sheetsService.appendLeads(allValidLeads, {
        city,
        businessType: keyword || "Mixed/Fallback",
      });
    } catch (err) {
      logger.error(`Failed to sync to Google Sheets: ${err.message}`);
    }

    await job.updateProgress(100);

    const result = {
      totalFetched: grandTotalFetched,
      validLeadsCount: allValidLeads.length,
      duplicatesRemoved: grandDuplicatesRemoved,
      hardFiltered: grandHardFiltered,
      savedToPostgres: successfulSaves.length,
      savedToSheet: savedToSheetCount,
      fallbackUsed,
      fallbackKeywords,
    };

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: result,
        completedAt: new Date()
      }
    });

    return result;
  } catch (error) {
    logger.error(`Discovery job ${job.id} failed: ${error.message}`);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error.message,
        completedAt: new Date()
      }
    });
    throw error;
  }
};

const discoveryWorker = new Worker(
  "discovery-queue",
  async (job) => {
    return processDiscoveryJob(job);
  },
  {
    connection,
    concurrency: 2, // Limit concurrency to respect Google API limits
  }
);

discoveryWorker.on("completed", (job) => {
  logger.info(`Discovery job ${job.id} completed successfully`);
});

discoveryWorker.on("failed", (job, err) => {
  logger.error(`Discovery job ${job.id} failed: ${err.message}`);
});

module.exports = discoveryWorker;
