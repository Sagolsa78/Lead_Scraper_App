const logger = require("../config/logger");
const puppeteer = require("puppeteer");
// Use dynamic import or require for google-search-results-nodejs if possible, or standard require
const SerpApi = require("google-search-results-nodejs");

// Constants for Scoring
const SCORE_NONE = 0;
const SCORE_WEAK = 40;
const SCORE_ACTIVE = 80;

// Threshold for Deep Scraping (Puppeteer)
const DEEP_SCRAPE_THRESHOLD = 65;

/**
 * Main function to enrich a lead with social media data
 * Hybrid Model: SerpAPI (Discovery) -> Score -> Puppeteer (Deep Extraction if High Value)
 * @param {object} lead - The lead object from the database or scraper
 * @returns {Promise<object>} - Enriched lead object with social fields
 */
const enrichLead = async (lead) => {
  try {
    logger.info(`Starting social enrichment for: ${lead.name}`);

    // Initialize social data
    let socialData = {
      instagram: null,
      facebook: null,
      linkedin: null,
      status: "NONE",
      score: SCORE_NONE,
      metrics: {},
    };

    // 1. Detect Existing Links (from Website or Google Maps)
    const existingLinks = detectExistingLinks(lead);
    if (existingLinks.instagram) socialData.instagram = existingLinks.instagram;
    if (existingLinks.facebook) socialData.facebook = existingLinks.facebook;
    if (existingLinks.linkedin) socialData.linkedin = existingLinks.linkedin;

    // 2. Hybrid Step 1: Search for Social Links (if missing) via SerpAPI
    if (!socialData.instagram || !socialData.facebook) {
      const searchResults = await searchForSocial(lead);
      if (!socialData.instagram && searchResults.instagram) {
        socialData.instagram = searchResults.instagram;
      }
      if (!socialData.facebook && searchResults.facebook) {
        socialData.facebook = searchResults.facebook;
      }
    }

    // 3. Hybrid Step 2: Preliminary Scoring
    let score = calculateSocialScore(socialData, lead);
    socialData.score = score;
    logger.info(`Preliminary Social Score for ${lead.name}: ${score}`);

    // 4. Hybrid Step 3: Deep Extraction (Puppeteer) - ONLY for High Priority
    // If score > threshold AND we have an Instagram profile to scrape
    if (score > DEEP_SCRAPE_THRESHOLD && socialData.instagram) {
      logger.info(
        `High Value Lead detected (Score: ${score}). Initiating Deep Extract on: ${socialData.instagram}`,
      );
      try {
        const metrics = await extractActivitySignals(socialData.instagram);
        socialData.metrics = metrics;

        // Recalculate score with new metrics
        score = calculateSocialScore(socialData, lead);
        socialData.score = score;
      } catch (err) {
        logger.error(
          `Deep extraction failed for ${lead.name}: ${err.message}. Keeping preliminary score.`,
        );
      }
    } else {
      logger.info(
        `Skipping Deep Extract for ${lead.name} (Score: ${score} <= ${DEEP_SCRAPE_THRESHOLD} or no IG)`,
      );
    }

    // 5. Final Classification
    const status = classifySocialMaturity(score);
    socialData.status = status;
    socialData.lastCheck = new Date();

    logger.info(
      `Enrichment complete for ${lead.name}: Status=${status}, Score=${score}`,
    );

    return {
      ...lead,
      instagramProfile: socialData.instagram,
      facebookProfile: socialData.facebook,
      linkedinProfile: socialData.linkedin,
      socialStatus: socialData.status,
      socialScore: socialData.score,
      socialData: socialData.metrics,
      lastSocialCheck: socialData.lastCheck,
    };
  } catch (error) {
    logger.error(`Error enriching lead ${lead.name}: ${error.message}`);
    return lead; // Return original lead on error to avoid breaking flow
  }
};

/**
 * Detect social links from existing lead data
 */
const detectExistingLinks = (lead) => {
  const links = { instagram: null, facebook: null, linkedin: null };
  if (lead.instagramProfile) links.instagram = lead.instagramProfile;
  if (lead.facebookProfile) links.facebook = lead.facebookProfile;
  return links;
};

/**
 * Search for social profiles using SerpAPI
 * @param {object} lead
 * @returns {Promise<object>}
 */
const searchForSocial = async (lead) => {
  const links = { instagram: null, facebook: null };

  if (!process.env.SERPAPI_KEY) {
    logger.warn("SERPAPI_KEY is missing. Skipping social search.");
    return links;
  }

  // Construct query: "Business Name" "City" site:instagram.com OR site:facebook.com
  const query = `"${lead.name}" "${lead.city}" site:instagram.com OR site:facebook.com`;

  return new Promise((resolve) => {
    const search = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);
    search.json(
      {
        q: query,
        num: 5, // Top 5 results are enough
      },
      (result) => {
        if (result.organic_results) {
          result.organic_results.forEach((item) => {
            const link = item.link;
            if (link.includes("instagram.com/") && !links.instagram) {
              // Clean URL (remove query params)
              links.instagram = link.split("?")[0];
            }
            if (link.includes("facebook.com/") && !links.facebook) {
              links.facebook = link.split("?")[0];
            }
          });
        }
        resolve(links);
      },
    );
  });
};

/**
 * Validate and extract basic metrics from a social profile using Puppeteer
 * @param {string} url
 * @returns {Promise<object>}
 */
const extractActivitySignals = async (url) => {
  let browser = null;
  const metrics = {
    followers: 0,
    following: 0,
    posts: 0,
    lastPostDate: null, // approximate
  };

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set User Agent to avoid immediate blocking
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    // Timeout handled by caller or default (30s)
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract from meta tags (Open Graph) primarily as it's safer/faster than DOM scraping
    // Instagram meta description format: "X Followers, Y Following, Z Posts..."
    const description = await page
      .$eval('meta[property="og:description"]', (element) => element.content)
      .catch(() => null);

    if (description) {
      // Parse description: "100 Followers, 200 Following, 50 Posts - See Instagram photos..."
      const parts = description.split(",").map((s) => s.trim());

      parts.forEach((part) => {
        if (part.includes("Followers")) {
          metrics.followers = parseNumber(part);
        } else if (part.includes("Following")) {
          metrics.following = parseNumber(part);
        } else if (part.includes("Posts")) {
          metrics.posts = parseNumber(part);
        }
      });
    }

    // Optional: Check for "verify" badge or specific DOM elements if needed
    // But meta tag is usually sufficient for basic "Activity Score"

    return metrics;
  } catch (error) {
    logger.warn(`Puppeteer extraction warning for ${url}: ${error.message}`);
    // Return empty metrics/zeros rather than throwing full error
    return metrics;
  } finally {
    if (browser) await browser.close();
  }
};

const parseNumber = (str) => {
  // Handles "1.2k", "5m", "1,234"
  const clean = str.toLowerCase().replace(/,/g, "").split(" ")[0]; // "1.2k"
  let multiplier = 1;
  if (clean.includes("k")) multiplier = 1000;
  if (clean.includes("m")) multiplier = 1000000;

  return parseFloat(clean) * multiplier;
};

/**
 * Calculate Social Score
 * @param {object} socialData
 * @returns {number} score
 */
const calculateSocialScore = (socialData, lead = {}) => {
  let score = 0;

  // 1. Presence Score (Base)
  if (socialData.instagram) {
    score += 40;
    // Bonus: High potential if they have IG but no Website
    if (!lead.website || lead.website === "N/A") {
      score += 30; // Total 70 -> Triggers Deep Scrape
    }
  } else if (socialData.facebook) score += 20; // FB is less valuable than IG for many niches

  // If we only have preliminary data (no metrics), return just presence score (capped at 45)
  // But wait, if we have IG, score is 40. Detailed score adds on top.

  // 2. Metrics Score (Add-on)
  const { followers = 0, posts = 0 } = socialData.metrics || {};

  if (followers > 0 || posts > 0) {
    // Followers (Max 30)
    if (followers > 10000) score += 30;
    else if (followers > 2000) score += 20;
    else if (followers > 500) score += 10;
    else score += 5;

    // Posts (Max 20)
    if (posts > 100) score += 20;
    else if (posts > 20) score += 10;
    else score += 5;

    // Engagement/Activity (Mock/Derived)
    // If we successfully scraped, implies account is somewhat public/active
    score += 5;
  }

  return Math.min(score, 100);
};

/**
 * Classify Social Maturity based on Score
 * @param {number} score
 * @returns {string} status
 */
const classifySocialMaturity = (score) => {
  if (score < 30) return "NONE";
  if (score < 55) return "WEAK";
  if (score < 75) return "ACTIVE";
  return "STRONG";
};

module.exports = {
  enrichLead,
  detectExistingLinks,
  searchForSocial,
  extractActivitySignals,
  calculateSocialScore,
  classifySocialMaturity,
};
