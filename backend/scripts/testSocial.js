const socialDiscoveryService = require("../services/socialDiscoveryService");
const logger = require("../config/logger");

const mockLead = {
  name: "Blue Tokai Coffee Roasters",
  city: "Mumbai",
  instagramProfile: "https://www.instagram.com/bluetokaicoffee/",
  facebookProfile: null,
  website: null, // Force "No Website" bonus
};

const runTest = async () => {
  console.log("Testing Social Discovery (Deep Scrape Trigger)...");
  try {
    const result = await socialDiscoveryService.enrichLead(mockLead);
    console.log("Enriched Lead Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test Failed:", error);
  }
};

runTest();
