const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { storeRawData } = require("../services/dataAcquisitionService");
const { normalizeGooglePlace } = require("../services/normalizationService");
const prisma = require("../config/prisma");

async function testArchitecture() {
  console.log("🚀 Testing Enterprise Architecture v2.0 Components...");

  // Mock Data (Simulating a Google Places API response)
  const mockGoogleData = {
    place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    name: "Google Sydney",
    formatted_address: "48 Pirrama Rd, Pyrmont NSW 2009, Australia",
    formatted_phone_number: "(02) 9374 4000",
    website: "https://www.google.com.au/",
    rating: 4.5,
    user_ratings_total: 890,
    price_level: 2,
    types: ["software_company", "point_of_interest", "establishment"],
  };

  try {
    // 1. Test Raw Data Storage
    console.log("\n1️⃣  Testing Immutable Raw Data Storage...");
    const rawRecord = await storeRawData(
      "test_script",
      "google_place",
      mockGoogleData,
    );

    if (
      rawRecord &&
      rawRecord.id &&
      rawRecord.data.place_id === mockGoogleData.place_id
    ) {
      console.log(`✅ Success! Raw Data stored with ID: ${rawRecord.id}`);
    } else {
      console.error("❌ Failed to store raw data correctly.");
    }

    // 2. Test Normalization Engine
    console.log("\n2️⃣  Testing Normalization Engine...");
    const businessEntity = normalizeGooglePlace(mockGoogleData);

    console.log("Normalized Entity:", JSON.stringify(businessEntity, null, 2));

    if (
      businessEntity.name === "Google Sydney" &&
      businessEntity.domain === "google.com.au"
    ) {
      console.log("✅ Success! Data normalized correctly.");
    } else {
      console.error("❌ Normalization failed.");
    }

    // 3. Test Business Creation (Integration)
    console.log("\n3️⃣  Testing Business Model Creation (DB)...");
    const business = await prisma.business.create({
      data: businessEntity,
    });

    console.log(`✅ Success! Business created with ID: ${business.id}`);

    // Cleanup
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.rawData.delete({ where: { id: rawRecord.id } });
    console.log("\n🧹 Cleanup complete.");
  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testArchitecture();
