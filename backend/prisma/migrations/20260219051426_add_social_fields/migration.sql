/*
  Warnings:

  - A unique constraint covering the columns `[placeId]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "facebookProfile" TEXT,
ADD COLUMN     "fullReportSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instagramProfile" TEXT,
ADD COLUMN     "introMessageId" TEXT,
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "linkedinProfile" TEXT,
ADD COLUMN     "phoneValid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placeId" TEXT,
ADD COLUMN     "replyReceived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialData" JSONB,
ADD COLUMN     "socialScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "socialStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "subCategory" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PhoneLookup" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "lineType" TEXT,
    "carrier" TEXT,
    "countryCode" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawData" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "domain" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "priceLevel" INTEGER,
    "types" TEXT[],
    "primaryCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "authorName" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "publishTime" TIMESTAMP(3),
    "originalId" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "sentimentLabel" TEXT,
    "topics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "placeId" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneLookup_phone_key" ON "PhoneLookup"("phone");

-- CreateIndex
CREATE INDEX "PhoneLookup_phone_idx" ON "PhoneLookup"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Business_googlePlaceId_key" ON "Business"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_placeId_key" ON "Lead"("placeId");

-- CreateIndex
CREATE INDEX "Lead_city_businessType_idx" ON "Lead"("city", "businessType");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
