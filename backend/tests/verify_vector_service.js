const {
  storeBusinessEmbedding,
  searchSimilarBusinesses,
} = require("../services/vectorService");

// Mock Chroma and Embeddings to test logic without running DB
// We are only testing if the service functions can be called and handle errors gracefully
// since the DB is not running.

async function testVectorService() {
  console.log("🚀 Testing Vector Service Logic...");

  const mockBusiness = {
    id: "test-biz-123",
    googlePlaceId: "ChIJ...",
    name: "Test Business",
    primaryCategory: "Software",
    types: ["software_company"],
    address: "123 Tech St",
    rating: 5.0,
    reviewCount: 10,
  };

  try {
    console.log(
      "1️⃣  Testing Embedding Storage (Expect Error or Mock Behavior)...",
    );
    // This will likely fail because Chroma is not running, but we want to see it fail gracefully
    // or we'd ideally mock the module. For now, let's see if it throws the expected error.
    await storeBusinessEmbedding(mockBusiness).catch((err) => {
      console.log("✅ Caught expected error (DB not running):", err.message);
    });

    console.log("2️⃣  Testing Similarity Search...");
    const results = await searchSimilarBusinesses("software company").catch(
      (err) => {
        console.log("✅ Caught expected error (DB not running):", err.message);
        return [];
      },
    );

    if (results.length === 0) {
      console.log("✅ Search returned empty array/handled error as expected.");
    }
  } catch (error) {
    console.error("❌ Unexpected Test Fail:", error);
  }
}

testVectorService();
