const { calculateScore } = require("../services/scoringService");

function testScoring() {
  console.log("🚀 Testing Deterministic Scoring Engine...");

  const mockBusiness = {
    id: "test-biz-score",
    name: "Elite Plumbers",
    rating: 4.8,
    reviewCount: 1250,
    website: "https://eliteplumbers.com",
    phone: "+1234567890",
    primaryCategory: "Plumber",
    address: "123 Main St",
  };

  console.log("Mock Business:", JSON.stringify(mockBusiness, null, 2));

  const result = calculateScore(mockBusiness);

  console.log("\n📊 Score Result:", JSON.stringify(result, null, 2));

  // Validation
  if (result.totalScore > 0 && result.breakdown.rating > 0) {
    console.log("✅ Scoring logic working.");
  } else {
    console.error("❌ Scoring logic failed.");
  }
}

testScoring();
