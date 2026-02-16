const { Sequelize } = require("sequelize");
const logger = require("./logger");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL Database connected successfully.");
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };
