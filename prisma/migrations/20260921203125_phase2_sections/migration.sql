-- AlterTable
ALTER TABLE "Service" ADD COLUMN "category" TEXT;

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Testimonial_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ServiceArea_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FaqItem_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Highlight_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessProfile" (
    "websiteId" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "ctaType" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "openSaturday" BOOLEAN NOT NULL DEFAULT false,
    "openHolidays" BOOLEAN NOT NULL DEFAULT false,
    "emergency24x7" BOOLEAN NOT NULL DEFAULT false,
    "emergencyPhone" TEXT,
    "emergencyMessage" TEXT,
    "bookingMethod" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "bookingUrl" TEXT,
    "bookingText" TEXT,
    CONSTRAINT "BusinessProfile_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BusinessProfile" ("address", "city", "ctaType", "email", "openHolidays", "openSaturday", "phone", "websiteId", "whatsapp") SELECT "address", "city", "ctaType", "email", "openHolidays", "openSaturday", "phone", "websiteId", "whatsapp" FROM "BusinessProfile";
DROP TABLE "BusinessProfile";
ALTER TABLE "new_BusinessProfile" RENAME TO "BusinessProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Testimonial_websiteId_idx" ON "Testimonial"("websiteId");

-- CreateIndex
CREATE INDEX "ServiceArea_websiteId_idx" ON "ServiceArea"("websiteId");

-- CreateIndex
CREATE INDEX "FaqItem_websiteId_idx" ON "FaqItem"("websiteId");

-- CreateIndex
CREATE INDEX "Highlight_websiteId_idx" ON "Highlight"("websiteId");
