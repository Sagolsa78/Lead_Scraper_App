const { ChatOpenAI } = require("@langchain/openai");
const { z } = require("zod");
const logger = require("../config/logger");

// Define the structured output schema for the report
const ReportSchema = z.object({
  summary: z
    .string()
    .describe("Executive summary of the business's digital health"),
  swot: z.object({
    strengths: z.array(z.string()).describe("List of key strengths"),
    weaknesses: z.array(z.string()).describe("List of key weaknesses"),
    opportunities: z.array(z.string()).describe("List of growth opportunities"),
    threats: z
      .array(z.string())
      .describe("List of external threats or competitor advantages"),
  }),
  key_issues: z
    .array(z.string())
    .describe("Critical issues needing immediate attention"),
  growth_opportunities: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
      }),
    )
    .describe("Actionable growth strategies"),
  priority_actions: z.array(z.string()).describe("Top 3 actions to take first"),
  estimated_revenue_impact: z
    .string()
    .describe(
      "Estimated functionality of revenue increase (e.g. '$5k-$10k/month')",
    ),
});

/**
 * Generates a strategic report for a business using an LLM.
 * @param {object} business - The business entity
 * @param {object} score - The calculated digital health score
 * @param {array} reviews - Recent reviews
 * @param {array} competitors - Competitor data
 */
const generateReport = async (business, score, reviews, competitors) => {
  try {
    const model = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview", // Use a smart model for reasoning
      temperature: 0.3,
    });

    const structuredModel = model.withStructuredOutput(ReportSchema);

    // Construct Context
    const reviewSummary = reviews
      .map((r) => `"${r.text}" (${r.rating}/5)`)
      .join("\n")
      .slice(0, 2000); // Truncate
    const competitorSummary = competitors.map((c) => `${c.name}`).join(", ");

    const prompt = `
      You are an expert Digital Strategy Consultant. Analyze this business and generate a strategic growth report.
      
      Business: ${business.name} (${business.primaryCategory})
      Location: ${business.address}
      
      Digital Health Score: ${score.totalScore}/100
      Breakdown: ${JSON.stringify(score.breakdown)}
      
      Recent Reviews Snippets:
      ${reviewSummary}
      
      Competitors: ${competitorSummary || "None identified"}
      
      Task:
      Identify why they are losing money and how to fix it.
      Focus on actionable advice.
      Be direct and professional.
    `;

    logger.info(`Generating report for ${business.name}...`);
    const result = await structuredModel.invoke(prompt);

    return result;
  } catch (error) {
    logger.error(`Report generation failed: ${error.message}`);
    throw error;
  }
};

module.exports = { generateReport };
