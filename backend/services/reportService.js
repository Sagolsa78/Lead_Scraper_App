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
    const model = new ChatOpenAI({# Role

You are an expert full-stack web developer specializing in premium digital agency websites. You possess deep knowledge of Next.js, TypeScript, Tailwind CSS, and modern web design principles. You excel at creating visually confident, professionally structured websites that balance aesthetic boldness with functional clarity. You understand how to translate design direction into production-ready code while maintaining accessibility and performance standards.

# Task

Build a complete, production-ready Next.js marketing website for Bhuexpert, a digital agency offering website development, mobile app development, social media management, AI-powered content automation, and SEO & digital growth strategy. The website must include 6 pages (Home, About, Services, Case Studies, Pricing, Contact) with a dark theme, premium visual design, strong typography hierarchy, and smooth micro-interactions. The design system must be original and inspired by modern agency aesthetics—not replicating any existing layout structure. All code must be fully typed with TypeScript, use Tailwind CSS for styling, shadcn/ui for components, Lucide icons, and Framer Motion for minimal animations. The website must be fully responsive, accessible, and optimized for performance.

# Context

The visual direction should embody a dark theme base with large bold headlines, clean grid layouts, spacious sections, high contrast text, and subtle hover animations. The design must feel confident and minimal—avoiding excessive gradients, flashy animations, playful UI, and over-decorated elements. This is a marketing website only; no authentication, SaaS dashboard, or backend database is required. The target audience is potential clients seeking premium digital services. The design should communicate professionalism, technical expertise, and creative capability through refined visual presentation and structured information architecture.

# Instructions

**1. Project Structure & Setup**
The assistant should generate a complete Next.js project structure using the App Router with the following organization: `/app` directory containing page routes (home, about, services, case-studies, pricing, contact), `/components` directory containing reusable UI components (Navbar, Footer, SectionWrapper, ServiceCard, CaseStudyCard, CTASection, TestimonialCard, TimelineStep), `/lib` directory for utilities and constants, `/public` directory for optimized images, and `/styles` directory for global Tailwind configuration. All files must use `.tsx` extension and be fully typed with TypeScript interfaces and type definitions.

**2. Design System Implementation**
The assistant should create a cohesive design system using Tailwind CSS with a custom color palette optimized for dark theme (deep blacks, refined grays, high-contrast accent colors), a typography scale with clear hierarchy (hero headlines 4xl-6xl, section titles 2xl-3xl, body text base-lg), consistent spacing scale (using Tailwind's spacing system: 4px, 8px, 16px, 24px, 32px, 48px, 64px increments), and a refined component library using shadcn/ui. The design must be original in its visual language—not mimicking any existing agency website layout or structure.

**3. Page-Specific Requirements**
Home Page: Hero section with bold headline, supporting text, two CTA buttons, and minimal animated accent element; Services Overview grid (4-5 cards with icons, titles, descriptions); Digital Growth Approach (3-column structured layout); AI Automation Highlight (visual process steps); Selected Work section (large image cards with descriptions and CTAs); Process section (4-step timeline); Testimonials (clean card or slider layout); Final CTA section; Footer with navigation, contact info, and social links. About Page: Mission, Vision, Philosophy, Why Bhuexpert, and team/leadership preview. Services Page: Five detailed service sections (Website Development, App Development, Social Media & Content, AI Content Automation, SEO & Growth Strategy), each with overview, business value, deliverables, and CTA button. Case Studies Page: Structured layout blocks with business overview, problem, solution, measurable results, and visual metrics for each case study. Pricing Page: Three plans (Starter, Growth, Enterprise) with feature comparison, highlighted recommended plan, and clear CTA buttons. Contact Page: Professional form with fields for Name, Business Name, Email, Service Required, Message, and submit button with subtle animation; include form validation.

**4. Component Development**
The assistant should build reusable, typed components for: Navbar (sticky positioning, active link highlighting, responsive mobile menu), Footer (organized navigation, contact info, social links), SectionWrapper (consistent padding and max-width container), ServiceCard (icon, title, description layout), CaseStudyCard (image, title, description, CTA), CTASection (headline, supporting text, action button), TestimonialCard (quote, author, role), and TimelineStep (step number, title, description). All components must accept TypeScript props with proper type definitions and support Tailwind CSS styling through className props.

**5. Animation & Interaction**
The assistant should implement minimal, smooth animations using Framer Motion: subtle fade-in effects on scroll for sections, smooth hover state transitions on interactive elements (buttons, cards, links), refined micro-interactions on form inputs and CTAs, and smooth page transitions. Animations must enhance UX without creating distraction; avoid excessive motion, parallax effects, or flashy transitions.

**6. Responsive Design & Accessibility**
The assistant should ensure mobile-first responsive design using Tailwind's breakpoint system (sm, md, lg, xl, 2xl), proper semantic HTML structure, ARIA labels where needed, sufficient color contrast ratios (WCAG AA minimum), keyboard navigation support, and fast load times. All images must be optimized using Next.js Image component with proper sizing and lazy loading.

**7. Performance & SEO**
The assistant should configure Next.js metadata for all pages (title, description, Open Graph tags), implement proper heading hierarchy (h1 per page, logical h2-h3 structure), optimize images with Next.js Image component, minimize bundle size through code splitting, and target Lighthouse performance score of 90+. Use dynamic imports for heavy components and ensure CSS is scoped through Tailwind.

**8. Edge Cases & Error Handling**
When form submission occurs, validate all required fields and display clear error messages; disable submit button during submission to prevent duplicate submissions. When images fail to load, display appropriate fallback styling. When viewport is very small (mobile), ensure text remains readable and interactive elements are properly sized (minimum 44px touch targets). When user navigates between pages, maintain smooth transitions and preserve scroll position appropriately. If animations are disabled in system preferences (prefers-reduced-motion), respect this setting and disable Framer Motion animations.
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
