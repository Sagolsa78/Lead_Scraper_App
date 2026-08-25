const { PrismaClient } = require("@prisma/client");
const socialDiscoveryService = require("../services/socialDiscoveryService");
const logger = require("../config/logger");

const prisma = new PrismaClient();

const enrichExistingLeads = async () => {
  try {
    console.log("Starting Retroactive Enrichment...");

    // Fetch leads that have 'NONE' status or haven't been checked recently
    // limiting to 5 for safety/demo purposes, remove take: 5 for full run
    const leads = await prisma.lead.findMany({
      where: {
        OR: [{ socialStatus: "NONE" }, { socialStatus: null }],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${leads.length} leads to enrich.`);

    for (const lead of leads) {
      console.log(`Enriching: ${lead.name}...`);

      // Enriched data
      const enriched = await socialDiscoveryService.enrichLead(lead);

      // Update DB
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          instagramProfile: enriched.instagramProfile,
          facebookProfile: enriched.facebookProfile,
          linkedinProfile: enriched.linkedinProfile,
          socialStatus: enriched.socialStatus,
          socialScore: enriched.socialScore,
          socialData: enriched.socialData,
          lastSocialCheck: new Date(),
        },
      });

      console.log(
        `Updated ${lead.name}: Status=${enriched.socialStatus}, Score=${enriched.socialScore}`,
      );

      // Rate limit safety
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log("Enrichment Complete.");
  } catch (error) {
    console.error("Enrichment Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
};

enrichExistingLeads();
