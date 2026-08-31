// const { PrismaClient } = require("@prisma/client");
const { calculateLeadPriority } = require("../services/finalScoringEngine");
const prisma = require("../config/prisma");

async function main() {
  const args = process.argv.slice(2);
  const target = args[0]; // Phone number or "all"

  if (!target) {
    console.log(
      "Usage: node triggerScoring.js <phone_number> OR node triggerScoring.js all",
    );
    return;
  }

  try {
    if (target === "all") {
      console.log("Scoring ALL leads...");
      const leads = await prisma.lead.findMany({
        include: {
          business: {
            include: { reviews: true },
          },
        },
      });

      for (const lead of leads) {
        await scoreSingleLead(lead);
      }
    } else {
      console.log(`Scoring lead with phone: ${target}`);
      const lead = await prisma.lead.findUnique({
        where: { phone: target },
        include: {
          business: {
            include: { reviews: true },
          },
        },
      });

      if (!lead) {
        console.error("Lead not found!");
        return;
      }

      await scoreSingleLead(lead);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function scoreSingleLead(lead) {
  console.log(`Processing ${lead.name}...`);

  // Get reviews from relation or maybe raw data?
  // Assuming reviews are linked via Business or attached to Lead somehow?
  // In schema, Lead -> Business -> Reviews.
  // So 'lead.business.reviews' is the array.

  let reviews = [];
  if (lead.business && lead.business.reviews) {
    reviews = lead.business.reviews;
  }

  // Calculate Score
  const result = await calculateLeadPriority(lead, reviews);

  // Update Lead in DB
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      reviewScore: result.reviewScore,
      urgencyScore: result.urgencyScore,
      categoryScore: result.categoryScore,
      finalScore: result.finalScore,
      priority: result.priority,
    },
  });

  console.log(
    `Updated ${lead.name}: Score=${result.finalScore}, Priority=${result.priority}`,
  );
}

main();
