const { Worker } = require("bullmq");
const { connection } = require("../config/bullQueue");
const prisma = require("../config/prisma");
const logger = require("../config/logger");

const geocodeService = require("../services/geocodeService");
const placesService = require("../services/placesService");
const leadSearchService = require("../services/leadSearchService");

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

  logger.info(`\n📍 [SCRAPER] Starting fetch for keyword="${keyword || "Any"}" in ${city}`);
  logger.info(`   📐 Coords: ${coords.lat}, ${coords.lng} | Radius: ${radius}m | Limit: ${limit}`);

  try {
    do {
      // Check if job was cancelled
      const dbJob = await prisma.job.findUnique({ where: { id: job.id }, select: { status: true } });
      if (dbJob?.status === "CANCELLED") {
        logger.info(`🛑 [SCRAPER] Job ${job.id} was CANCELLED — stopping fetch loop.`);
        break;
      }

      logger.info(`   🔎 [PLACES API] Fetching page ${pagesProcessed + 1}${nextPageToken ? " (with pageToken)" : ""}...`);
      
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

      logger.info(`   ✅ [PLACES API] Got ${results.length} results (total fetched: ${totalFetched}). Next page: ${!!nextPageToken}`);

      for (const place of results) {
        if (validLeads.length >= limit) break;

        if (existingPlaceIds.has(place.place_id)) {
          logger.info(`   ⏭️  Skipping duplicate placeId: ${place.place_id}`);
          continue;
        }

        // Pre-filter BEFORE calling Details API to save API credits
        if (!placesService.preFilterPlace(place)) {
          logger.info(`   ⏭️  Pre-filtered (excluded type or closed): ${place.name}`);
          hardFiltered++;
          continue;
        }

        logger.info(`   🏢 [DETAILS] Fetching details for: ${place.name || place.place_id}...`);
        const details = await placesService.getPlaceDetails(place.place_id);
        if (!details) {
          logger.info(`   ❌ [DETAILS] No details returned for placeId: ${place.place_id}`);
          continue;
        }

        logger.info(`   📋 [DETAILS] ${details.name} | Phone: ${details.formatted_phone_number || "NONE"} | Rating: ${details.rating || "N/A"} | Reviews: ${details.user_ratings_total || 0} | Website: ${details.website ? "YES" : "NO"} | Types: [${(details.types || []).slice(0, 4).join(", ")}]`);

        const isValid = validationService.validateLeadData(details);
        if (!isValid) {
          logger.info(`   🚫 [VALIDATION] REJECTED: ${details.name} (see debug log for reason)`);
          hardFiltered++;
          continue;
        }

        logger.info(`   ✅ [VALIDATION] PASSED: ${details.name}`);

        const isDup = await duplicateChecker.isDuplicate(
          details.formatted_phone_number,
        );
        if (isDup) {
          logger.info(`   🔄 [DUPLICATE] Rejected duplicate phone: ${details.name}`);
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

        logger.info(`   🌐 [SOCIAL] Enriching lead: ${details.name}...`);
        const enrichedLead = await socialDiscoveryService.enrichLead(leadData);
        validLeads.push(enrichedLead);
        existingPlaceIds.add(place.place_id);
        
        logger.info(`   🎯 [LEAD ${validLeads.length}/${limit}] ✅ ${enrichedLead.name} — ${enrichedLead.formatted_phone_number || enrichedLead.phone} — ${categories.businessType}/${categories.subCategory}`);

        if (job) {
           const progressVal = Math.floor((validLeads.length / limit) * 80);
           await job.updateProgress(progressVal);
           await prisma.job.update({
             where: { id: job.id },
             data: { progress: progressVal }
           }).catch(() => {});
        }
      }

      if (validLeads.length < limit && nextPageToken) {
        logger.info(`   ⏳ Waiting 2s before next page... (${validLeads.length}/${limit} leads so far)`);
        await sleep(2000);
      }
    } while (validLeads.length < limit && nextPageToken && pagesProcessed < 3);
  } catch (error) {
    logger.error(`   💥 [SCRAPER ERROR] keyword="${keyword}": ${error.message}`);
    logger.error(
      `Error fetching leads for keyword '${keyword}': ${error.message}`,
    );
  }

  logger.info(`\n📊 [SCRAPER SUMMARY] keyword="${keyword || "Any"}" → Fetched: ${totalFetched}, Valid: ${validLeads.length}, Filtered: ${hardFiltered}, Dupes: ${duplicatesRemoved}\n`);

  return { validLeads, totalFetched, duplicatesRemoved, hardFiltered };
};

const processDiscoveryJob = async (job) => {
  const { city, keyword, radius, limit, organizationId } = job.data;
  
  logger.info(`\n${"=".repeat(70)}`);
  logger.info(`🚀 [JOB START] Discovery job ${job.id}`);
  logger.info(`   City: ${city} | Keyword: ${keyword || "Any"} | Radius: ${radius} | Limit: ${limit}`);
  logger.info(`${"=".repeat(70)}\n`);
  
  logger.info(`Discovery job ${job.id} started for ${city}`);
  
  await prisma.job.update({
    where: { id: job.id },
    data: { status: "RUNNING", startedAt: new Date() }
  });

  try {
    logger.info(`📍 [GEOCODE] Resolving coordinates for: ${city}...`);
    let coords;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        coords = await geocodeService.getCoordinates(city);
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        logger.info(`⚠️  [GEOCODE] Attempt ${attempt} failed (${err.message}). Retrying in 2s...`);
        await sleep(2000);
      }
    }
    logger.info(`📍 [GEOCODE] Result: ${coords.lat}, ${coords.lng}\n`);

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

    // Check cancel before fallback
    const checkCancelled = async () => {
      const dbJob = await prisma.job.findUnique({ where: { id: job.id }, select: { status: true } });
      return dbJob?.status === "CANCELLED";
    };

    let fallbackUsed = false;
    let fallbackKeywords = [];

    if (allValidLeads.length === 0 && !(await checkCancelled())) {
      fallbackUsed = true;
      logger.info(`\n⚠️  [FALLBACK] No leads found with primary keyword. Trying fallback keywords...`);
      const fallbackOptions = [...FALLBACK_KEYWORDS];
      const MAX_RETRIES = 3;
      let retries = 0;

      while (
        allValidLeads.length < limit &&
        retries < MAX_RETRIES &&
        fallbackOptions.length > 0
      ) {
        if (await checkCancelled()) {
          logger.info(`🛑 [JOB] Cancelled during fallback loop.`);
          break;
        }

        const randomIndex = Math.floor(Math.random() * fallbackOptions.length);
        const randomKeyword = fallbackOptions[randomIndex];
        fallbackOptions.splice(randomIndex, 1);
        fallbackKeywords.push(randomKeyword);

        logger.info(`   🔄 [FALLBACK] Trying keyword: "${randomKeyword}" (attempt ${retries + 1}/${MAX_RETRIES})`);

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

    // Final cancel check
    if (await checkCancelled()) {
      logger.info(`\n🛑 [JOB CANCELLED] Job ${job.id} was stopped by user. Saving ${allValidLeads.length} leads found so far...\n`);
    }

    logger.info(`\n💾 [SAVING] Saving ${allValidLeads.length} leads to database...`);
    
    await job.updateProgress(90);
    await prisma.job.update({
      where: { id: job.id },
      data: { progress: 90 }
    }).catch(() => {});

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
        logger.info(`   💾 Saved: ${savedLead.name} — ${savedLead.phone} — Priority: ${savedLead.priority}`);
      } catch (err) {
        if (err.code !== "P2002") {
          logger.warn(`Failed to save lead: ${err.message}`);
          logger.info(`   ❌ Failed to save: ${lead.name} — ${err.message}`);
        } else {
          logger.info(`   ⏭️  Already exists (phone duplicate): ${lead.name}`);
        }
      }
    }

    let savedToSheetCount = 0;

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

    logger.info(`\n${"=".repeat(70)}`);
    logger.info(`✅ [JOB COMPLETE] Job ${job.id}`);
    logger.info(`   Fetched: ${grandTotalFetched} | Valid: ${allValidLeads.length} | Saved: ${successfulSaves.length} | Filtered: ${grandHardFiltered} | Dupes: ${grandDuplicatesRemoved}`);
    logger.info(`${"=".repeat(70)}\n`);

    return result;
  } catch (error) {
    logger.error(`\n💥 [JOB FAILED] Job ${job.id}: ${error.message}\n`);
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
    logger.info(`\n📥 [WORKER] Picked up job: ${job.id} (${job.name})`);
    return processDiscoveryJob(job);
  },
  {
    connection,
    concurrency: 2,
  }
);

discoveryWorker.on("completed", (job) => {
  logger.info(`🏁 [WORKER] Job ${job.id} completed successfully`);
  logger.info(`Discovery job ${job.id} completed successfully`);
});

discoveryWorker.on("failed", (job, err) => {
  logger.error(`❌ [WORKER] Job ${job.id} failed: ${err.message}`);
  logger.error(`Discovery job ${job.id} failed: ${err.message}`);
});

discoveryWorker.on("error", (err) => {
  logger.error(`❌ [WORKER ERROR] ${err.message}`);
});

module.exports = discoveryWorker;
