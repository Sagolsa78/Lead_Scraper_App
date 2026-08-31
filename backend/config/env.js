const { z } = require("zod");
const logger = require("./logger");

const envSchema = z.object({
  PORT: z.coerce.number().default(5005),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Google APIs
  GOOGLE_PLACES_API_KEY: z.string().min(1, "GOOGLE_PLACES_API_KEY is required"),
  GOOGLE_GEOCODING_API_KEY: z.string().min(1, "GOOGLE_GEOCODING_API_KEY is required"),
  GOOGLE_SHEET_ID: z.string().min(1, "GOOGLE_SHEET_ID is required"),
  GOOGLE_CLIENT_EMAIL: z.string().email("GOOGLE_CLIENT_EMAIL must be valid email"),
  GOOGLE_PRIVATE_KEY: z.string().min(1, "GOOGLE_PRIVATE_KEY is required"),

  // Security
  ENCRYPTION_KEY: z.string().min(16, "ENCRYPTION_KEY must be at least 16 characters"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ALLOWED_ORIGINS: z.string().min(1, "ALLOWED_ORIGINS is required (comma-separated URLs)"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  logger.error(`Environment validation failed:\n${errors}`);
  throw new Error(`Environment validation failed:\n${errors}`);
}

const env = parsed.data;

module.exports = {
  port: env.PORT,
  env: env.NODE_ENV,
  google: {
    placesApiKey: env.GOOGLE_PLACES_API_KEY,
    geocodingApiKey: env.GOOGLE_GEOCODING_API_KEY,
    sheetId: env.GOOGLE_SHEET_ID,
    clientEmail: env.GOOGLE_CLIENT_EMAIL,
    privateKey: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  dbUrl: env.DATABASE_URL,
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  allowedOrigins: env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
};
