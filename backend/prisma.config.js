/** @type {import('prisma').PrismaConfig} */
require("dotenv").config();

module.exports = {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
  },
};
