const Joi = require("joi");
const logger = require("./logger");

const envSchema = Joi.object({
  PORT: Joi.number().default(5005),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  GOOGLE_PLACES_API_KEY: Joi.string().required(),
  GOOGLE_GEOCODING_API_KEY: Joi.string().required(),
  GOOGLE_SHEET_ID: Joi.string().required(),
  GOOGLE_CLIENT_EMAIL: Joi.string().email().required(),
  GOOGLE_PRIVATE_KEY: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  ALLOWED_ORIGINS: Joi.string().default("*"),
})
  .unknown()
  .required();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  logger.error(`Config validation error: ${error.message}`);
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  port: envVars.PORT,
  env: envVars.NODE_ENV,
  google: {
    placesApiKey: envVars.GOOGLE_PLACES_API_KEY,
    geocodingApiKey: envVars.GOOGLE_GEOCODING_API_KEY,
    sheetId: envVars.GOOGLE_SHEET_ID,
    clientEmail: envVars.GOOGLE_CLIENT_EMAIL,
    privateKey: envVars.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  dbUrl: envVars.DATABASE_URL,
  allowedOrigins: envVars.ALLOWED_ORIGINS,
};
