const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { Document } = require("@langchain/core/documents");
const logger = require("../config/logger");

// Initialize Embeddings (using OpenAI or a local alternative if configured)
// For MVP, we'll assume OpenAI key is present in .env as OPENAI_API_KEY
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-small", // Cost-effective model
});

// Initialize Chroma Client
// Note: In production, you might want to instantiate this per request or as a singleton
const vectorStorePromise = Chroma.fromExistingCollection(embeddings, {
  collectionName: "lead_scrapper_knowledge",
  url: "http://localhost:8000", // URL of the Chroma server from docker-compose
}).catch((err) => {
  // If collection doesn't exist, we might need to create it or handle it.
  // Chroma.fromExistingCollection throws if not found.
  // We can fallback to creating a new one or just logging.
  logger.warn(
    "Chroma collection might not exist, attempting to create/access default.",
    err,
  );
  return new Chroma(embeddings, {
    collectionName: "lead_scrapper_knowledge",
    url: "http://localhost:8000",
  });
});

/**
 * Generates and stores embeddings for a given business entity.
 * @param {object} business - The business entity from Prisma
 */
const storeBusinessEmbedding = async (business) => {
  try {
    const vectorStore = await vectorStorePromise;

    // Create a text representation for embedding
    // We want to capture the essence of the business for semantic search
    const textToEmbed = `
      Business Name: ${business.name}
      Category: ${business.primaryCategory || "Unknown"}
      Description: ${business.types ? business.types.join(", ") : ""}
      Address: ${business.address || ""}
      Rating: ${business.rating} (${business.reviewCount} reviews)
    `.trim();

    const doc = new Document({
      pageContent: textToEmbed,
      metadata: {
        businessId: business.id,
        googlePlaceId: business.googlePlaceId,
        type: "business_profile",
      },
    });

    await vectorStore.addDocuments([doc]);
    logger.info(
      `Stored embedding for business: ${business.name} (${business.id})`,
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to store embedding for business ${business.id}: ${error.message}`,
    );
    throw error;
  }
};

/**
 * Searches for similar businesses based on a query string.
 * @param {string} query - The search query
 * @param {number} k - Number of results to return
 */
const searchSimilarBusinesses = async (query, k = 5) => {
  try {
    const vectorStore = await vectorStorePromise;
    const results = await vectorStore.similaritySearch(query, k);

    return results.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score: doc.score, // Note: Chroma distances by default, but LangChain might normalize
    }));
  } catch (error) {
    logger.error(`Vector search failed: ${error.message}`);
    return [];
  }
};

module.exports = {
  storeBusinessEmbedding,
  searchSimilarBusinesses,
};
